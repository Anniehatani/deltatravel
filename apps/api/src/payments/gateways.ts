import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import type { Payment } from '@prisma/client';
import type { Provider } from '@tour/shared';
import { fail } from '../common/errors';
export const hmac = (algorithm: string, key: string, data: string) =>
  createHmac(algorithm, key).update(data, 'utf8').digest('hex');
export function verifyMac(expected: string, received: string) {
  if (!/^[a-f0-9]+$/i.test(received)) return false;
  const a = Buffer.from(expected, 'hex'),
    b = Buffer.from(received, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}
const encode = (s: string) => encodeURIComponent(s).replace(/%20/g, '+');
export const vnpCanonical = (p: Record<string, string>) =>
  Object.keys(p)
    .filter((k) => k !== 'vnp_SecureHash' && k !== 'vnp_SecureHashType')
    .sort()
    .map((k) => `${encode(k)}=${encode(p[k])}`)
    .join('&');
export function vietnamDate(date: Date) {
  return new Date(date.getTime() + 7 * 3600000).toISOString().slice(0, 19).replace(/[-T:]/g, '');
}
export type VerifiedPayment = {
  provider: Provider;
  reference: string;
  transactionId: string;
  amount: bigint;
  success: boolean;
};
const scalar = z.union([z.string(), z.number().int().safe()]).transform(String);
const momoFields = [
  'amount',
  'extraData',
  'message',
  'orderId',
  'orderInfo',
  'orderType',
  'partnerCode',
  'payType',
  'requestId',
  'responseTime',
  'resultCode',
  'transId',
] as const;
export const momoCanonical = (accessKey: string, p: Record<string, string>) =>
  `accessKey=${accessKey}&` + momoFields.map((k) => `${k}=${p[k]}`).join('&');
@Injectable()
export class Gateways {
  constructor(private readonly config: ConfigService) {}
  private secret(key: string) {
    const value = this.config.get<string>(key);
    if (!value) fail(503, 'PROVIDER_NOT_CONFIGURED', `Chưa cấu hình ${key}`);
    return value;
  }
  assertConfigured(provider: Provider, amount: bigint, expiresAt: Date) {
    const keys = {
      VNPAY: ['VNPAY_TMN_CODE', 'VNPAY_HASH_SECRET'],
      MOMO: ['MOMO_PARTNER_CODE', 'MOMO_ACCESS_KEY', 'MOMO_SECRET_KEY'],
      ZALOPAY: ['ZALOPAY_APP_ID', 'ZALOPAY_KEY1', 'ZALOPAY_KEY2'],
    }[provider];
    keys.forEach((k) => this.secret(k));
    if (provider === 'MOMO' && (amount < 1000n || amount > 50000000n))
      fail(
        422,
        'PROVIDER_AMOUNT_LIMIT',
        'MoMo hỗ trợ từ 1.000 đến 50.000.000 VND theo cấu hình tích hợp này',
      );
    if (provider === 'ZALOPAY' && expiresAt.getTime() - Date.now() < 300000)
      fail(
        409,
        'PROVIDER_TIME_LIMIT',
        'ZaloPay cần ít nhất 5 phút còn lại; chọn cổng khác trước khi tạo giao dịch',
      );
  }
  async checkout(p: Payment, expiresAt: Date, ip: string): Promise<string> {
    const returnUrl = `${this.config.getOrThrow<string>('WEB_ORIGIN')}/payments/return?bookingId=${p.bookingId}`;
    const api = this.config.getOrThrow<string>('API_PUBLIC_URL');
    if (p.provider === 'VNPAY') {
      const fields: Record<string, string> = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: this.secret('VNPAY_TMN_CODE'),
        vnp_Amount: String(p.amount * 100n),
        vnp_CurrCode: 'VND',
        vnp_TxnRef: p.providerReference,
        vnp_OrderInfo: `Thanh toan tour ${p.id.replace(/-/g, '')}`,
        vnp_OrderType: 'other',
        vnp_Locale: 'vn',
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ip.replace('::ffff:', ''),
        vnp_CreateDate: vietnamDate(p.createdAt),
        vnp_ExpireDate: vietnamDate(expiresAt),
      };
      const query = vnpCanonical(fields);
      return `${this.config.get('VNPAY_URL') || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'}?${query}&vnp_SecureHash=${hmac('sha512', this.secret('VNPAY_HASH_SECRET'), query)}`;
    }
    if (p.provider === 'MOMO') {
      const data = {
        partnerCode: this.secret('MOMO_PARTNER_CODE'),
        requestId: p.id,
        amount: Number(p.amount),
        orderId: p.providerReference,
        orderInfo: `Thanh toan tour ${p.id}`,
        redirectUrl: returnUrl,
        ipnUrl: `${api}/api/v1/payments/webhooks/momo`,
        requestType: 'captureWallet',
        extraData: '',
        lang: 'vi',
        autoCapture: true,
      };
      const raw = `accessKey=${this.secret('MOMO_ACCESS_KEY')}&amount=${data.amount}&extraData=&ipnUrl=${data.ipnUrl}&orderId=${data.orderId}&orderInfo=${data.orderInfo}&partnerCode=${data.partnerCode}&redirectUrl=${data.redirectUrl}&requestId=${data.requestId}&requestType=${data.requestType}`;
      const response = await this.post(
        this.config.get('MOMO_URL') || 'https://test-payment.momo.vn/v2/gateway/api/create',
        { ...data, signature: hmac('sha256', this.secret('MOMO_SECRET_KEY'), raw) },
      );
      const r = z
        .object({
          resultCode: z.literal(0),
          payUrl: z.string().url(),
          partnerCode: z.string(),
          requestId: z.string(),
          orderId: z.string(),
          amount: scalar,
          responseTime: scalar,
          signature: z.string(),
        })
        .parse(response);
      const signed = `accessKey=${this.secret('MOMO_ACCESS_KEY')}&amount=${r.amount}&orderId=${r.orderId}&partnerCode=${r.partnerCode}&payUrl=${r.payUrl}&requestId=${r.requestId}&responseTime=${r.responseTime}&resultCode=${r.resultCode}`;
      if (
        !verifyMac(hmac('sha256', this.secret('MOMO_SECRET_KEY'), signed), r.signature) ||
        r.orderId !== p.providerReference ||
        r.requestId !== p.id ||
        r.partnerCode !== data.partnerCode ||
        BigInt(r.amount) !== p.amount
      )
        fail(502, 'INVALID_PROVIDER_RESPONSE', 'Phản hồi MoMo không hợp lệ');
      return this.safeUrl(r.payUrl, 'momo.vn');
    }
    const data = {
      app_id: Number(this.secret('ZALOPAY_APP_ID')),
      app_user: 'tour-booking',
      app_trans_id: p.providerReference,
      app_time: p.createdAt.getTime(),
      amount: Number(p.amount),
      item: '[]',
      embed_data: JSON.stringify({ redirecturl: returnUrl }),
      bank_code: '',
      description: `Thanh toan tour ${p.id}`,
      callback_url: `${api}/api/v1/payments/webhooks/zalopay`,
      expire_duration_seconds: Math.max(
        300,
        Math.floor((expiresAt.getTime() - p.createdAt.getTime()) / 1000),
      ),
    };
    const raw = [
      data.app_id,
      data.app_trans_id,
      data.app_user,
      data.amount,
      data.app_time,
      data.embed_data,
      data.item,
    ].join('|');
    const response = await this.post(
      this.config.get('ZALOPAY_URL') || 'https://sb-openapi.zalopay.vn/v2/create',
      { ...data, mac: hmac('sha256', this.secret('ZALOPAY_KEY1'), raw) },
    );
    const r = z.object({ return_code: z.literal(1), order_url: z.string().url() }).parse(response);
    return this.safeUrl(r.order_url, 'zalopay.vn');
  }
  private safeUrl(value: string, domain: string) {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      !(url.hostname === domain || url.hostname.endsWith(`.${domain}`))
    )
      fail(502, 'INVALID_PROVIDER_RESPONSE', 'URL thanh toán không hợp lệ');
    return value;
  }
  private async post(url: string, data: unknown): Promise<unknown> {
    if (!url.startsWith('https://'))
      fail(503, 'PROVIDER_CONFIG_INVALID', 'Cổng thanh toán phải dùng HTTPS');
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(35000),
      });
      if (!response.ok) throw new Error('gateway');
      return await response.json();
    } catch {
      fail(
        503,
        'PROVIDER_UNAVAILABLE',
        'Chưa xác định kết quả tạo giao dịch. Thử lại cùng đơn hoặc nhờ vận hành đối soát',
      );
    }
  }
  verifyVnpay(input: unknown): VerifiedPayment {
    const p = z.record(z.string()).parse(input);
    if (
      !p.vnp_SecureHash ||
      !verifyMac(
        hmac('sha512', this.secret('VNPAY_HASH_SECRET'), vnpCanonical(p)),
        p.vnp_SecureHash,
      )
    )
      fail(400, 'INVALID_SIGNATURE', 'Chữ ký VNPay không hợp lệ');
    if (p.vnp_TmnCode !== this.secret('VNPAY_TMN_CODE'))
      fail(400, 'MERCHANT_MISMATCH', 'Sai merchant');
    if (!/^\d+$/.test(p.vnp_Amount ?? '') || BigInt(p.vnp_Amount) % 100n !== 0n)
      fail(400, 'INVALID_AMOUNT', 'Số tiền VNPay không hợp lệ');
    if (!p.vnp_TxnRef || !p.vnp_TransactionNo) fail(400, 'INVALID_CALLBACK', 'Thiếu mã giao dịch');
    return {
      provider: 'VNPAY',
      reference: p.vnp_TxnRef,
      transactionId: p.vnp_TransactionNo,
      amount: BigInt(p.vnp_Amount) / 100n,
      success: p.vnp_ResponseCode === '00' && p.vnp_TransactionStatus === '00',
    };
  }
  verifyMomo(input: unknown): VerifiedPayment {
    const raw = z.record(z.unknown()).parse(input);
    const p: Record<string, string> = {};
    // Optional provider fields (e.g. promotionInfo arrays) are not signed here.
    // Validate every signed field and ignore unrelated fields, never flatten them.
    for (const field of momoFields) p[field] = scalar.parse(raw[field]);
    p.signature = z.string().parse(raw.signature);
    if (
      momoFields.some((k) => p[k] === undefined) ||
      !verifyMac(
        hmac(
          'sha256',
          this.secret('MOMO_SECRET_KEY'),
          momoCanonical(this.secret('MOMO_ACCESS_KEY'), p),
        ),
        p.signature ?? '',
      )
    )
      fail(400, 'INVALID_SIGNATURE', 'Chữ ký MoMo không hợp lệ');
    if (p.partnerCode !== this.secret('MOMO_PARTNER_CODE'))
      fail(400, 'MERCHANT_MISMATCH', 'Sai merchant');
    if (!/^\d+$/.test(p.amount) || !p.orderId || !p.transId)
      fail(400, 'INVALID_CALLBACK', 'Dữ liệu thanh toán không hợp lệ');
    return {
      provider: 'MOMO',
      reference: p.orderId,
      transactionId: p.transId,
      amount: BigInt(p.amount),
      success: p.resultCode === '0',
    };
  }
  verifyZalopay(input: unknown): VerifiedPayment {
    const p = z.object({ data: z.string(), mac: z.string() }).parse(input);
    if (!verifyMac(hmac('sha256', this.secret('ZALOPAY_KEY2'), p.data), p.mac))
      fail(400, 'INVALID_SIGNATURE', 'Chữ ký ZaloPay không hợp lệ');
    const data = z
      .object({
        app_id: scalar,
        app_trans_id: z.string().min(1),
        zp_trans_id: scalar,
        amount: z.number().int().nonnegative().safe(),
      })
      .parse(JSON.parse(p.data));
    if (data.app_id !== this.secret('ZALOPAY_APP_ID'))
      fail(400, 'MERCHANT_MISMATCH', 'Sai merchant');
    return {
      provider: 'ZALOPAY',
      reference: data.app_trans_id,
      transactionId: data.zp_trans_id,
      amount: BigInt(data.amount),
      success: true,
    };
  }
}
