import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Interval } from '@nestjs/schedule';
import { Job, Queue } from 'bullmq';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../database/prisma.service';
@Processor('booking-timeout')
export class BookingTimeoutWorker extends WorkerHost {
  constructor(private readonly bookings: BookingsService) {
    super();
  }
  async process(job: Job<{ bookingId: string }>) {
    await this.bookings.expire(job.data.bookingId);
  }
}
@Injectable()
export class TimeoutDispatcher {
  private busy = false;
  private readonly logger = new Logger(TimeoutDispatcher.name);
  constructor(
    private readonly db: PrismaService,
    private readonly bookings: BookingsService,
    @InjectQueue('booking-timeout') private readonly queue: Queue,
  ) {}
  @Interval(5000)
  async dispatch() {
    if (this.busy) return;
    this.busy = true;
    try {
      // Sweep first: even a lost Redis dataset cannot strand expired inventory.
      const expired = await this.db.booking.findMany({
        where: { status: 'PENDING_PAYMENT', expiresAt: { lte: new Date() } },
        select: { id: true },
        take: 100,
        orderBy: { expiresAt: 'asc' },
      });
      for (const b of expired) await this.bookings.expire(b.id);
      const rows = await this.db.booking.findMany({
        where: { status: 'PENDING_PAYMENT', timeoutEnqueuedAt: null },
        take: 100,
        orderBy: { createdAt: 'asc' },
      });
      for (const b of rows) {
        await this.queue.add(
          'expire',
          { bookingId: b.id },
          {
            jobId: `expire_${b.id}`,
            delay: Math.max(0, b.expiresAt.getTime() - Date.now()),
            attempts: 5,
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: { age: 86400 },
            removeOnFail: { age: 604800 },
          },
        );
        await this.db.booking.update({
          where: { id: b.id },
          data: { timeoutEnqueuedAt: new Date() },
        });
      }
    } catch {
      this.logger.warn('Timeout dispatcher will retry; database remains authoritative');
    } finally {
      this.busy = false;
    }
  }
}
