import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Provider } from '@tour/shared';
import { PrismaService } from '../database/prisma.service';
import { lockSchedule, dbNow, expireLocked } from '../bookings/inventory';
import { paymentDto } from '../bookings/dto';
import { fail } from '../common/errors';
import { Gateways, VerifiedPayment, vietnamDate } from './gateways';
@Injectable()
export class PaymentsService {
  constructor(
    private readonly db: PrismaService,
    private readonly gateways: Gateways,
  ) {}
  async create(userId: string, bookingId: string, provider: Provider, ip: string) {
    const parent = await this.db.booking.findFirstOrThrow({ where: { id: bookingId, userId } });
    // Commit expiration before checking payment eligibility, even when returning an error.
    const prepared = await this.db.serial(async (tx) => {
      await lockSchedule(tx, parent.scheduleId);
      const now = await dbNow(tx);
      await expireLocked(tx, parent.scheduleId, now);
      const b = await tx.booking.findUniqueOrThrow({
        where: { id: bookingId },
        include: { payment: true },
      });
      if (b.status !== 'PENDING_PAYMENT') return { invalid: true as const };
      if (b.payment) {
        if (b.payment.provider !== provider)
          fail(409, 'PAYMENT_PROVIDER_LOCKED', 'Đơn này đã chọn một cổng thanh toán');
        return { payment: b.payment, expiresAt: b.expiresAt };
      }
      if (b.totalAmount > 0n) this.gateways.assertConfigured(provider, b.totalAmount, b.expiresAt);
      const id = randomUUID();
      const providerReference =
        provider === 'ZALOPAY' ? `${vietnamDate(now).slice(2, 8)}_${id.replace(/-/g, '')}` : id;
      const payment = await tx.payment.create({
        data: {
          id,
          bookingId,
          provider,
          providerReference,
          amount: b.totalAmount,
          createdAt: now,
          status: b.totalAmount === 0n ? 'SUCCEEDED' : 'INITIATED',
        },
      });
      if (b.totalAmount === 0n) {
        await tx.booking.update({
          where: { id: bookingId },
          data: { status: 'PAID', paidAt: now },
        });
        await tx.auditLog.create({
          data: { actorId: userId, action: 'ZERO_AMOUNT_PAYMENT', entityId: bookingId },
        });
      }
      return { payment, expiresAt: b.expiresAt };
    });
    if ('invalid' in prepared)
      fail(409, 'BOOKING_NOT_PAYABLE', 'Đơn không còn chờ thanh toán hoặc đã hết hạn');
    if (prepared.payment.checkoutUrl || prepared.payment.status !== 'INITIATED')
      return paymentDto(prepared.payment);
    // No database transaction is held open during an external HTTP call.
    let checkoutUrl: string;
    try {
      checkoutUrl = await this.gateways.checkout(prepared.payment, prepared.expiresAt, ip);
    } catch (e) {
      if (e instanceof Error && e.name === 'ZodError')
        fail(
          502,
          'INVALID_PROVIDER_RESPONSE',
          'Cổng thanh toán chưa trả về kết quả tạo giao dịch hợp lệ',
        );
      throw e;
    }
    const result = await this.db.serial(async (tx) => {
      await lockSchedule(tx, parent.scheduleId);
      await expireLocked(tx, parent.scheduleId, await dbNow(tx));
      const b = await tx.booking.findUniqueOrThrow({ where: { id: bookingId } });
      if (b.status !== 'PENDING_PAYMENT') return null;
      return tx.payment.update({ where: { id: prepared.payment.id }, data: { checkoutUrl } });
    });
    if (!result) fail(409, 'BOOKING_NOT_PAYABLE', 'Đơn đã đổi trạng thái trong khi tạo thanh toán');
    return paymentDto(result);
  }
  async get(id: string, userId: string) {
    return paymentDto(
      await this.db.payment.findFirstOrThrow({ where: { id, booking: { userId } } }),
    );
  }
  async settle(event: VerifiedPayment): Promise<'APPLIED' | 'DUPLICATE'> {
    const p = await this.db.payment.findUnique({
      where: { providerReference: event.reference },
      include: { booking: true },
    });
    if (!p || p.provider !== event.provider)
      fail(404, 'PAYMENT_NOT_FOUND', 'Không tìm thấy giao dịch');
    return this.db.serial(async (tx) => {
      await lockSchedule(tx, p.booking.scheduleId);
      const now = await dbNow(tx);
      await expireLocked(tx, p.booking.scheduleId, now);
      const payment = await tx.payment.findUniqueOrThrow({
        where: { id: p.id },
        include: { booking: true },
      });
      if (payment.amount !== event.amount || payment.currency !== 'VND')
        fail(400, 'AMOUNT_MISMATCH', 'Sai số tiền thanh toán');
      if (['SUCCEEDED', 'REFUND_REQUIRED', 'REFUNDED'].includes(payment.status)) {
        if (event.success && payment.transactionId !== event.transactionId)
          fail(409, 'TRANSACTION_MISMATCH', 'Có giao dịch khác cần đối soát');
        return 'DUPLICATE';
      }
      if (!event.success) {
        await tx.payment.updateMany({
          where: { id: p.id, status: 'INITIATED' },
          data: { status: 'FAILED' },
        });
        return 'APPLIED';
      }
      const payable =
        payment.booking.status === 'PENDING_PAYMENT' && payment.booking.expiresAt > now;
      await tx.payment.update({
        where: { id: p.id },
        data: {
          status: payable ? 'SUCCEEDED' : 'REFUND_REQUIRED',
          transactionId: event.transactionId,
        },
      });
      if (payable)
        await tx.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'PAID', paidAt: now },
        });
      await tx.auditLog.create({
        data: {
          action: payable ? 'PAYMENT_SUCCEEDED' : 'LATE_PAYMENT_REFUND_REQUIRED',
          entityId: payment.bookingId,
          metadata: { paymentId: p.id, provider: event.provider },
        },
      });
      return 'APPLIED';
    });
  }
}
