import type { Tour, Schedule, Page, QuoteResultSchema } from '@tour/shared';
import type { z } from 'zod';

export type QuoteResult = z.infer<typeof QuoteResultSchema>;

export interface ExtendedTour extends Tour {
  region: 'bac' | 'trung' | 'nam';
  regionName: string;
  adultPrice: number;
  childPrice: number;
  highlights: string[];
}

export const FALLBACK_TOURS: ExtendedTour[] = [
  {
    id: 'a1000000-0000-4000-8000-000000000001',
    slug: 'vinh-ha-long-du-thuyen-kayak',
    title: 'Vịnh Hạ Long — Trải Nghiệm Du Thuyền & Chèo Thuyền Kayak',
    description: 'Hành trình 2 ngày 1 đêm ngắm hoàng hôn trên vịnh kỳ quan, khám phá hang Sửng Sốt, chèo kayak tại hang Luồn và tắm biển đảo Ti Tốp.',
    destination: 'Quảng Ninh',
    durationDays: 2,
    countryCode: 'VN',
    status: 'ACTIVE',
    region: 'bac',
    regionName: 'Miền Bắc',
    adultPrice: 2450000,
    childPrice: 1650000,
    highlights: ['Du thuyền vịnh Hạ Long', 'Chèo kayak hang Luồn', 'Tắm biển đảo Ti Tốp', 'Thưởng thức hải sản tươi ngon'],
    createdAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
  },
  {
    id: 'a1000000-0000-4000-8000-000000000002',
    slug: 'sa-pa-chinh-phuc-fansipan-cat-cat',
    title: 'Sa Pa — Chinh Phục Đỉnh Fansipan & Khám Phá Bản Cát Cát',
    description: 'Chiêm ngưỡng nóc nhà Đông Dương Fansipan hùng vĩ, trải nghiệm cáp treo mây bồng bềnh, ghé thăm bản làng H\'Mông và chợ đêm Sa Pa.',
    destination: 'Lào Cai',
    durationDays: 3,
    countryCode: 'VN',
    status: 'ACTIVE',
    region: 'bac',
    regionName: 'Miền Bắc',
    adultPrice: 2850000,
    childPrice: 1950000,
    highlights: ['Đỉnh Fansipan 3.143m', 'Bản văn hóa Cát Cát', 'Đèo Ô Quy Hồ', 'Thưởng thức lẩu cá hồi'],
    createdAt: new Date('2026-01-02T00:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-01-02T00:00:00.000Z').toISOString(),
  },
  {
    id: 'a1000000-0000-4000-8000-000000000003',
    slug: 'ninh-binh-trang-an-bai-dinh-hang-mua',
    title: 'Ninh Bình — Quần Thể Danh Thắng Tràng An & Chùa Bái Đính',
    description: 'Du thuyền xuôi dòng sông Sào Khê len lỏi qua các hang động kỳ thú, viếng chùa Bái Đính linh thiêng và leo đỉnh hang Múa ngắm Tam Cốc.',
    destination: 'Ninh Bình',
    durationDays: 1,
    countryCode: 'VN',
    status: 'ACTIVE',
    region: 'bac',
    regionName: 'Miền Bắc',
    adultPrice: 950000,
    childPrice: 650000,
    highlights: ['Ngồi thuyền Tràng An', 'Chùa Bái Đính kỷ lục', 'Check-in Hang Múa ngắm toàn cảnh'],
    createdAt: new Date('2026-01-03T00:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-01-03T00:00:00.000Z').toISOString(),
  },
  {
    id: 'a1000000-0000-4000-8000-000000000004',
    slug: 'da-nang-hoi-an-ba-na-hills-cau-vang',
    title: 'Đà Nẵng — Hội An — Cầu Vàng Bà Nà Hills',
    description: 'Hành trình di sản và hiện đại: check-in Cầu Vàng nổi tiếng thế giới, ngắm phố cổ Hội An rực rỡ đèn lồng bên sông Hoài và tắm biển Mỹ Khê.',
    destination: 'Đà Nẵng',
    durationDays: 4,
    countryCode: 'VN',
    status: 'ACTIVE',
    region: 'trung',
    regionName: 'Miền Trung',
    adultPrice: 3650000,
    childPrice: 2450000,
    highlights: ['Cầu Vàng Bà Nà Hills', 'Phố cổ Hội An về đêm', 'Biển Mỹ Khê', 'Du thuyền sông Hàn'],
    createdAt: new Date('2026-01-04T00:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-01-04T00:00:00.000Z').toISOString(),
  },
  {
    id: 'a1000000-0000-4000-8000-000000000005',
    slug: 'hue-co-do-dai-noi-ca-hue-song-huong',
    title: 'Cố Đô Huế — Đại Nội Hoàng Cung & Ca Huế Sông Hương',
    description: 'Lắng đọng cùng di sản văn hóa thế giới: thăm Đại Nội, lăng Khải Định, lăng Tự Đức cổ kính và thả hoa đăng nghe ca Huế trên sông Hương.',
    destination: 'Huế',
    durationDays: 2,
    countryCode: 'VN',
    status: 'ACTIVE',
    region: 'trung',
    regionName: 'Miền Trung',
    adultPrice: 1850000,
    childPrice: 1250000,
    highlights: ['Đại Nội Hoàng Cung', 'Lăng Khải Định & Tự Đức', 'Ca Huế trên sông Hương', 'Ẩm thực cung đình Huế'],
    createdAt: new Date('2026-01-05T00:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-01-05T00:00:00.000Z').toISOString(),
  },
  {
    id: 'a1000000-0000-4000-8000-000000000006',
    slug: 'nha-trang-bien-xanh-dao-diep-son',
    title: 'Nha Trang — Khám Phá Vịnh Biển San Hô & Đảo Điệp Sơn',
    description: 'Tận hưởng làn nước trong xanh ngọc bích, trải nghiệm con đường đi bộ giữa biển độc đáo ở đảo Điệp Sơn và lặn ngắm rạn san hô đa sắc.',
    destination: 'Khánh Hòa',
    durationDays: 3,
    countryCode: 'VN',
    status: 'ACTIVE',
    region: 'trung',
    regionName: 'Miền Trung',
    adultPrice: 2950000,
    childPrice: 1950000,
    highlights: ['Con đường giữa biển Điệp Sơn', 'Lặn ngắm san hô vịnh Nha Trang', 'Hải sản biển tươi ngon'],
    createdAt: new Date('2026-01-06T00:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-01-06T00:00:00.000Z').toISOString(),
  },
  {
    id: 'a1000000-0000-4000-8000-000000000007',
    slug: 'phu-quoc-dao-ngoc-lan-ngam-san-ho',
    title: 'Phú Quốc — Đảo Ngọc Thiên Đường & Câu Cá Ngắm Hoàng Hôn',
    description: 'Kỳ nghỉ thư giãn tuyệt vời tại Phú Quốc: đi cáp treo Hòn Thơm vượt biển, lặn ngắm san hô quần đảo An Thới và vui chơi tại Grand World.',
    destination: 'Kiên Giang',
    durationDays: 3,
    countryCode: 'VN',
    status: 'ACTIVE',
    region: 'nam',
    regionName: 'Miền Nam',
    adultPrice: 3450000,
    childPrice: 2350000,
    highlights: ['Cáp treo Hòn Thơm', 'Lặn san hô 4 đảo', 'Grand World thành phố không ngủ', 'Hoàng hôn bãi Dài'],
    createdAt: new Date('2026-01-07T00:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-01-07T00:00:00.000Z').toISOString(),
  },
  {
    id: 'a1000000-0000-4000-8000-000000000008',
    slug: 'can-tho-cho-noi-cai-rang-miet-vuon',
    title: 'Cần Thơ — Chợ Nổi Cái Răng & Trải Nghiệm Miệt Vườn Sông Nước',
    description: 'Đậm đà phong vị Nam Bộ: đón bình minh chợ nổi Cái Răng nhộn nhịp, tự tay hái trái cây chín mọng tại miệt vườn Phong Điền và đờn ca tài tử.',
    destination: 'Cần Thơ',
    durationDays: 2,
    countryCode: 'VN',
    status: 'ACTIVE',
    region: 'nam',
    regionName: 'Miền Nam',
    adultPrice: 1650000,
    childPrice: 1100000,
    highlights: ['Chợ nổi Cái Răng buổi sớm', 'Vườn trái cây trĩu quả', 'Đờn ca tài tử Nam Bộ', 'Cá lóc nướng trui'],
    createdAt: new Date('2026-01-08T00:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-01-08T00:00:00.000Z').toISOString(),
  },
  {
    id: 'a1000000-0000-4000-8000-000000000009',
    slug: 'tay-ninh-nui-ba-den-toa-thanh',
    title: 'Tây Ninh — Chinh Phục Núi Bà Đen & Chiêm Bái Tòa Thánh',
    description: 'Hành trình 1 ngày linh thiêng: đi tuyến cáp treo hiện đại lên đỉnh núi Bà Đen ngắm tượng Phật Bà bằng đồng cao nhất Châu Á và Tòa Thánh.',
    destination: 'Tây Ninh',
    durationDays: 1,
    countryCode: 'VN',
    status: 'ACTIVE',
    region: 'nam',
    regionName: 'Miền Nam',
    adultPrice: 850000,
    childPrice: 550000,
    highlights: ['Tượng Phật Bà núi Bà Đen', 'Cáp treo Sun World', 'Tòa Thánh Cao Đài', 'Bánh tráng phơi sương'],
    createdAt: new Date('2026-01-09T00:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-01-09T00:00:00.000Z').toISOString(),
  },
];

export function getFallbackSchedules(tourId: string): Schedule[] {
  const tour = FALLBACK_TOURS.find((t) => t.id === tourId || t.slug === tourId) || FALLBACK_TOURS[0];
  const baseTime = Date.now();
  
  const schedules: Schedule[] = [];
  const intervals = [3, 7, 14, 21];
  
  intervals.forEach((days, idx) => {
    const depTime = baseTime + days * 24 * 60 * 60 * 1000;
    const depIso = new Date(depTime).toISOString();
    const available = idx === 0 ? 8 : idx === 1 ? 15 : 22;
    
    // Valid UUID formatting for schedules
    const schedHex = (idx + 1).toString().padStart(12, '0');
    const schedId = `b1000000-0000-4000-8000-${schedHex}`;

    schedules.push({
      id: schedId,
      tourId: tour.id,
      departureAt: depIso,
      totalSeats: 30,
      reservedSeats: 30 - available,
      availableSeats: available,
      adultPrice: tour.adultPrice,
      childPrice: tour.childPrice,
      status: 'OPEN',
      serverTime: new Date().toISOString(),
    });
  });

  return schedules;
}

export function filterFallbackTours(query = '', region = ''): Page<Tour> {
  const q = query.trim().toLowerCase();
  const reg = region.trim().toLowerCase();

  let filtered = FALLBACK_TOURS;

  if (reg && (reg === 'bac' || reg === 'trung' || reg === 'nam')) {
    filtered = filtered.filter((t) => t.region === reg);
  }

  if (q) {
    filtered = filtered.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.destination.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.regionName.toLowerCase().includes(q)
    );
  }

  return {
    items: filtered,
    page: 1,
    pageSize: 20,
    total: filtered.length,
  };
}
