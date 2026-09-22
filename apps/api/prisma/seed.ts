import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/auth/password';
const db = new PrismaClient();
async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Seed demo is disabled in production');
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password || password.length < 12 || password.startsWith('REPLACE_'))
    throw new Error('Run npm run setup and configure SEED_ADMIN_PASSWORD');
  await db.user.upsert({
    where: { email: process.env.SEED_ADMIN_EMAIL || 'admin@tour.local' },
    update: {},
    create: {
      name: 'Quản trị demo',
      email: process.env.SEED_ADMIN_EMAIL || 'admin@tour.local',
      role: 'ADMIN',
      passwordHash: await hashPassword(password),
    },
  });
  const tours = [
    ['da-nang-hoi-an', 'Đà Nẵng và Hội An', 'Đà Nẵng', 3, 3990000, 2490000],
    ['ninh-binh-trang-an', 'Ninh Bình và Tràng An', 'Ninh Bình', 2, 1990000, 1190000],
    ['phu-quoc-bien-xanh', 'Phú Quốc biển xanh', 'Phú Quốc', 4, 5990000, 3490000],
  ] as const;
  for (const [slug, title, destination, durationDays, adultPrice, childPrice] of tours) {
    const tour = await db.tour.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        title,
        destination,
        durationDays,
        status: 'ACTIVE',
        countryCode: 'VN',
        description: `Hành trình khám phá ${destination}. Dữ liệu minh họa cho đồ án, không phải sản phẩm thương mại đang mở bán.`,
      },
    });
    if ((await db.schedule.count({ where: { tourId: tour.id } })) === 0) {
      const departureAt = new Date();
      departureAt.setUTCDate(departureAt.getUTCDate() + 30);
      departureAt.setUTCHours(1, 0, 0, 0);
      await db.schedule.create({
        data: { tourId: tour.id, departureAt, totalSeats: 30, adultPrice, childPrice },
      });
    }
  }
  console.log(
    'Seed hoàn tất: 3 tour Việt Nam, 3 lịch khởi hành, 1 admin. Mật khẩu nằm trong apps/api/.env.',
  );
}
main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
