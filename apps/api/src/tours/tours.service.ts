import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { TourQuerySchema } from '@tour/shared';
@Injectable()
export class ToursService {
  constructor(private readonly db: PrismaService) {}
  async list(q: z.infer<typeof TourQuerySchema>, admin = false) {
    const where: Prisma.TourWhereInput = {
      deletedAt: null,
      ...(!admin ? { status: 'ACTIVE', countryCode: 'VN' } : {}),
      ...(q.q
        ? {
            OR: [
              { title: { contains: q.q, mode: 'insensitive' } },
              { destination: { contains: q.q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(q.destination ? { destination: { contains: q.destination, mode: 'insensitive' } } : {}),
    };
    const [rows, total] = await this.db.$transaction([
      this.db.tour.findMany({
        where,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      }),
      this.db.tour.count({ where }),
    ]);
    return {
      items: rows.map(({ deletedAt, ...rest }) => rest),
      total,
      page: q.page,
      pageSize: q.pageSize,
    };
  }
  async get(id: string) {
    const { deletedAt, ...tour } = await this.db.tour.findFirstOrThrow({
      where: { id, status: 'ACTIVE', countryCode: 'VN', deletedAt: null },
    });
    return tour;
  }
}
