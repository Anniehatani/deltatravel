import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { lockSchedule, expireLocked, dbNow } from '../bookings/inventory';
import { scheduleDto } from '../bookings/dto';
@Injectable()
export class SchedulesService {
  constructor(private readonly db: PrismaService) {}
  async get(id: string) {
    return this.db.serial(async (tx) => {
      await lockSchedule(tx, id);
      const now = await dbNow(tx);
      await expireLocked(tx, id, now);
      const s = await tx.schedule.findFirstOrThrow({
        where: { id, tour: { status: 'ACTIVE', countryCode: 'VN', deletedAt: null } },
      });
      return scheduleDto(s, now);
    });
  }
  async list(tourId: string, page: number, pageSize: number) {
    await this.db.tour.findFirstOrThrow({
      where: { id: tourId, status: 'ACTIVE', deletedAt: null, countryCode: 'VN' },
    });
    const where = { tourId, status: 'OPEN' as const, departureAt: { gt: new Date() } };
    const [rows, total] = await this.db.$transaction([
      this.db.schedule.findMany({
        where,
        select: { id: true },
        take: pageSize,
        skip: (page - 1) * pageSize,
        orderBy: [{ departureAt: 'asc' }, { id: 'asc' }],
      }),
      this.db.schedule.count({ where }),
    ]);
    const items = [];
    for (const row of rows) items.push(await this.get(row.id));
    return { items, total, page, pageSize };
  }
}
