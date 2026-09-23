import type { Tour, Schedule, Page, QuoteResultSchema } from '@tour/shared';
import type { z } from 'zod';

export type QuoteResult = z.infer<typeof QuoteResultSchema>;

export interface ExtendedTour extends Tour {
  region: 'bac' | 'trung' | 'nam';
  regionName: string;
  regionNameEn?: string;
  adultPrice: number;
  childPrice: number;
  highlights: string[];
  highlightsEn?: string[];
  titleEn?: string;
  descriptionEn?: string;
  destinationEn?: string;
}

export const FALLBACK_TOURS: ExtendedTour[] = [
  {
    id: 'a1000000-0000-4000-8000-000000000001',
    slug: 'vinh-ha-long-du-thuyen-kayak',
    title: 'Vịnh Hạ Long — Trải Nghiệm Du Thuyền & Chèo Thuyền Kayak',
    titleEn: 'Ha Long Bay — Luxury Cruise & Kayaking Odyssey',
    description: 'Hành trình 2 ngày 1 đêm ngắm hoàng hôn trên vịnh kỳ quan, khám phá hang Sửng Sốt, chèo kayak tại hang Luồn và tắm biển đảo Ti Tốp.',
    descriptionEn: 'A 2-day 1-night voyage witnessing golden sunsets over the UNESCO world wonder, exploring Sung Sot Cave, kayaking through Luon Cave, and swimming at Ti Top Island.',
    destination: 'Quảng Ninh',
    destinationEn: 'Quang Ninh',
    durationDays: 2,
    countryCode: 'VN',
    status: 'ACTIVE',
    region: 'bac',
    regionName: 'Miền Bắc',
    regionNameEn: 'Northern Vietnam',
    adultPrice: 2450000,
    childPrice: 1650000,
    highlights: ['Du thuyền vịnh Hạ Long', 'Chèo kayak hang Luồn', 'Tắm biển đảo Ti Tốp', 'Thưởng thức hải sản tươi ngon'],
    highlightsEn: ['Ha Long Bay Luxury Cruise', 'Luon Cave Kayaking', 'Ti Top Island Swimming', 'Fresh Gourmet Seafood'],
    createdAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
  },
  {
    id: 'a1000000-0000-4000-8000-000000000002',
    slug: 'sa-pa-chinh-phuc-fansipan-cat-cat',
    title: 'Sa Pa — Chinh Phục Đỉnh Fansipan & Khám Phá Bản Cát Cát',
    titleEn: 'Sa Pa — Conquering Mount Fansipan & Cat Cat Cultural Village',
    description: 'Chiêm ngưỡng nóc nhà Đông Dương Fansipan hùng vĩ, trải nghiệm cáp treo mây bồng bềnh, ghé thăm bản làng H\'Mông và chợ đêm Sa Pa.',
    descriptionEn: 'Behold the majestic "Roof of Indochina" Fansipan at 3,143m, glide above floating cloudscapes by cable car, discover H\'mong ethnic culture, and savor Sa Pa night market.',
    destination: 'Lào Cai',
    destinationEn: 'Lao Cai',
    durationDays: 3,
    countryCode: 'VN',
    status: 'ACTIVE',
    region: 'bac',
    regionName: 'Miền Bắc',
    regionNameEn: 'Northern Vietnam',
    adultPrice: 2850000,
    childPrice: 1950000,
    highlights: ['Đỉnh Fansipan 3.143m', 'Bản văn hóa Cát Cát', 'Đèo Ô Quy Hồ', 'Thưởng thức lẩu cá hồi'],
    highlightsEn: ['Mount Fansipan Peak (3,143m)', 'Cat Cat Cultural Village', 'O Quy Ho Mountain Pass', 'Fresh Salmon Hotpot Feast'],
    createdAt: new Date('2026-01-02T00:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-01-02T00:00:00.000Z').toISOString(),
  },
  {
    id: 'a1000000-0000-4000-8000-000000000003',
    slug: 'ninh-binh-trang-an-bai-dinh-hang-mua',
    title: 'Ninh Bình — Quần Thể Danh Thắng Tràng An & Chùa Bái Đính',
    titleEn: 'Ninh Binh — Trang An Scenic Complex & Bai Dinh Sanctuary',
    description: 'Du thuyền xuôi dòng sông Sào Khê len lỏi qua các hang động kỳ thú, viếng chùa Bái Đính linh thiêng và leo đỉnh hang Múa ngắm Tam Cốc.',
    descriptionEn: 'Glide along the Sao Khe River through mystical limestone grottoes, visit the grand Bai Dinh Pagoda, and ascend Hang Mua Peak for panoramic valley vistas.',
    destination: 'Ninh Bình',
    destinationEn: 'Ninh Binh',
    durationDays: 1,
    countryCode: 'VN',
    status: 'ACTIVE',
    region: 'bac',
    regionName: 'Miền Bắc',
    regionNameEn: 'Northern Vietnam',
    adultPrice: 950000,
    childPrice: 650000,
    highlights: ['Ngồi thuyền Tràng An', 'Chùa Bái Đính kỷ lục', 'Check-in Hang Múa ngắm toàn cảnh'],
    highlightsEn: ['Trang An Riverboat Safari', 'Historic Bai Dinh Pagoda', 'Hang Mua Panoramic Summit View'],
    createdAt: new Date('2026-01-03T00:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-01-03T00:00:00.000Z').toISOString(),
  },
  {
    id: 'a1000000-0000-4000-8000-000000000004',
    slug: 'da-nang-hoi-an-ba-na-hills-cau-vang',
    title: 'Đà Nẵng — Hội An — Cầu Vàng Bà Nà Hills',
    titleEn: 'Da Nang — Hoi An Ancient Town & Golden Bridge Ba Na Hills',
    description: 'Hành trình di sản và hiện đại: check-in Cầu Vàng nổi tiếng thế giới, ngắm phố cổ Hội An rực rỡ đèn lồng bên sông Hoài và tắm biển Mỹ Khê.',
    descriptionEn: 'A harmonious blend of contemporary marvels and timeless heritage: check in at the world-famous Golden Bridge, wander through lantern-lit Hoi An, and relax on My Khe Beach.',
    destination: 'Đà Nẵng',
    destinationEn: 'Da Nang',
    durationDays: 4,
    countryCode: 'VN',
    status: 'ACTIVE',
    region: 'trung',
    regionName: 'Miền Trung',
    regionNameEn: 'Central Vietnam',
    adultPrice: 3650000,
    childPrice: 2450000,
    highlights: ['Cầu Vàng Bà Nà Hills', 'Phố cổ Hội An về đêm', 'Biển Mỹ Khê', 'Du thuyền sông Hàn'],
    highlightsEn: ['Golden Bridge Ba Na Hills', 'Hoi An Lantern Town at Dusk', 'My Khe Azure Beach', 'Han River Sunset Cruise'],
    createdAt: new Date('2026-01-04T00:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-01-04T00:00:00.000Z').toISOString(),
  },
  {
    id: 'a1000000-0000-4000-8000-000000000005',
    slug: 'hue-co-do-dai-noi-ca-hue-song-huong',
    title: 'Cố Đô Huế — Đại Nội Hoàng Cung & Ca Huế Sông Hương',
    titleEn: 'Hue Imperial Citadel — Royal Palaces & Perfume River Serenades',
    description: 'Lắng đọng cùng di sản văn hóa thế giới: thăm Đại Nội, lăng Khải Định, lăng Tự Đức cổ kính và thả hoa đăng nghe ca Huế trên sông Hương.',
    descriptionEn: 'Immerse in Vietnam’s imperial heritage: explore the Forbidden Purple City, royal tombs of Khai Dinh and Tu Duc, and float flower lanterns while listening to traditional folk songs.',
    destination: 'Huế',
    destinationEn: 'Hue',
    durationDays: 2,
    countryCode: 'VN',
    status: 'ACTIVE',
    region: 'trung',
    regionName: 'Miền Trung',
    regionNameEn: 'Central Vietnam',
    adultPrice: 1850000,
    childPrice: 1250000,
    highlights: ['Đại Nội Hoàng Cung', 'Lăng Khải Định & Tự Đức', 'Ca Huế trên sông Hương', 'Ẩm thực cung đình Huế'],
    highlightsEn: ['Hue Imperial Citadel', 'Khai Dinh & Tu Duc Royal Tombs', 'Perfume River Folk Serenades', 'Royal Court Gastronomy'],
    createdAt: new Date('2026-01-05T00:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-01-05T00:00:00.000Z').toISOString(),
  },
  {
    id: 'a1000000-0000-4000-8000-000000000006',
    slug: 'nha-trang-bien-xanh-dao-diep-son',
    title: 'Nha Trang — Khám Phá Vịnh Biển San Hô & Đảo Điệp Sơn',
    titleEn: 'Nha Trang — Coral Bay Exploration & Diep Son Island',
    description: 'Tận hưởng làn nước trong xanh ngọc bích, trải nghiệm con đường đi bộ giữa biển độc đáo ở đảo Điệp Sơn và lặn ngắm rạn san hô đa sắc.',
    descriptionEn: 'Bask in crystal-clear turquoise waters, stroll along the mesmerizing sandbar path across the open sea at Diep Son Island, and snorkel among vibrant coral reefs.',
    destination: 'Khánh Hòa',
    destinationEn: 'Khanh Hoa',
    durationDays: 3,
    countryCode: 'VN',
    status: 'ACTIVE',
    region: 'trung',
    regionName: 'Miền Trung',
    regionNameEn: 'Central Vietnam',
    adultPrice: 2950000,
    childPrice: 1950000,
    highlights: ['Con đường giữa biển Điệp Sơn', 'Lặn ngắm san hô vịnh Nha Trang', 'Hải sản biển tươi ngon'],
    highlightsEn: ['Diep Son Ocean-Walking Sandbar', 'Nha Trang Bay Coral Snorkeling', 'Fresh Ocean Seafood Feast'],
    createdAt: new Date('2026-01-06T00:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-01-06T00:00:00.000Z').toISOString(),
  },
  {
    id: 'a1000000-0000-4000-8000-000000000007',
    slug: 'phu-quoc-dao-ngoc-lan-ngam-san-ho',
    title: 'Phú Quốc — Đảo Ngọc Thiên Đường & Câu Cá Ngắm Hoàng Hôn',
    titleEn: 'Phu Quoc — Emerald Island Paradise & Sunset Sea Safari',
    description: 'Kỳ nghỉ thư giãn tuyệt vời tại Phú Quốc: đi cáp treo Hòn Thơm vượt biển, lặn ngắm san hô quần đảo An Thới và vui chơi tại Grand World.',
    descriptionEn: 'The ultimate tropical island retreat: ride the world’s longest sea-crossing cable car to Hon Thom, snorkel pristine reefs in the An Thoi archipelago, and experience Grand World.',
    destination: 'Kiên Giang',
    destinationEn: 'Kien Giang',
    durationDays: 3,
    countryCode: 'VN',
    status: 'ACTIVE',
    region: 'nam',
    regionName: 'Miền Nam',
    regionNameEn: 'Southern Vietnam',
    adultPrice: 3450000,
    childPrice: 2350000,
    highlights: ['Cáp treo Hòn Thơm', 'Lặn san hô 4 đảo', 'Grand World thành phố không ngủ', 'Hoàng hôn bãi Dài'],
    highlightsEn: ['Hon Thom Sea-Crossing Cable Car', '4-Islands Coral Snorkeling', 'Grand World Sleepless City', 'Bai Dai Golden Sunset'],
    createdAt: new Date('2026-01-07T00:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-01-07T00:00:00.000Z').toISOString(),
  },
  {
    id: 'a1000000-0000-4000-8000-000000000008',
    slug: 'can-tho-cho-noi-cai-rang-miet-vuon',
    title: 'Cần Thơ — Chợ Nổi Cái Răng & Trải Nghiệm Miệt Vườn Sông Nước',
    titleEn: 'Can Tho — Cai Rang Floating Market & Mekong River Orchards',
    description: 'Đậm đà phong vị Nam Bộ: đón bình minh chợ nổi Cái Răng nhộn nhịp, tự tay hái trái cây chín mọng tại miệt vườn Phong Điền và đờn ca tài tử.',
    descriptionEn: 'Authentic Southern flavors: greet the vibrant dawn at Cai Rang floating market, pick ripe tropical fruits in Phong Dien orchards, and enjoy soulful Don Ca Tai Tu music.',
    destination: 'Cần Thơ',
    destinationEn: 'Can Tho',
    durationDays: 2,
    countryCode: 'VN',
    status: 'ACTIVE',
    region: 'nam',
    regionName: 'Miền Nam',
    regionNameEn: 'Southern Vietnam',
    adultPrice: 1650000,
    childPrice: 1100000,
    highlights: ['Chợ nổi Cái Răng buổi sớm', 'Vườn trái cây trĩu quả', 'Đờn ca tài tử Nam Bộ', 'Cá lóc nướng trui'],
    highlightsEn: ['Dawn Cai Rang Floating Market', 'Bountiful Tropical Orchards', 'Mekong Don Ca Tai Tu Folk Music', 'Grilled Snakehead Fish Specialty'],
    createdAt: new Date('2026-01-08T00:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-01-08T00:00:00.000Z').toISOString(),
  },
  {
    id: 'a1000000-0000-4000-8000-000000000009',
    slug: 'tay-ninh-nui-ba-den-toa-thanh',
    title: 'Tây Ninh — Chinh Phục Núi Bà Đen & Chiêm Bái Tòa Thánh',
    titleEn: 'Tay Ninh — Mount Ba Den Summit & Holy Cao Dai Sanctuary',
    description: 'Hành trình 1 ngày linh thiêng: đi tuyến cáp treo hiện đại lên đỉnh núi Bà Đen ngắm tượng Phật Bà bằng đồng cao nhất Châu Á và Tòa Thánh.',
    descriptionEn: 'A sacred 1-day spiritual journey: soar via modern cable car to the misty summit of Mount Ba Den to venerate Asia’s tallest bronze Lady Buddha statue, and visit the Holy Cao Dai Temple.',
    destination: 'Tây Ninh',
    destinationEn: 'Tay Ninh',
    durationDays: 1,
    countryCode: 'VN',
    status: 'ACTIVE',
    region: 'nam',
    regionName: 'Miền Nam',
    regionNameEn: 'Southern Vietnam',
    adultPrice: 850000,
    childPrice: 550000,
    highlights: ['Tượng Phật Bà núi Bà Đen', 'Cáp treo Sun World', 'Tòa Thánh Cao Đài', 'Bánh tráng phơi sương'],
    highlightsEn: ['Mount Ba Den Bronze Buddha', 'Sun World Scenic Cable Car', 'Cao Dai Holy See Sanctuary', 'Sun-Dried Rice Paper Delicacy'],
    createdAt: new Date('2026-01-09T00:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-01-09T00:00:00.000Z').toISOString(),
  },
];

export function getLocalizedTour<T extends Tour | ExtendedTour>(tour: T, lang: 'vi' | 'en'): T {
  if (lang === 'vi') return tour;
  const match = FALLBACK_TOURS.find((f) => f.id === tour.id || f.slug === tour.slug);
  if (!match) return tour;
  return {
    ...tour,
    title: match.titleEn || tour.title,
    description: match.descriptionEn || tour.description,
    destination: match.destinationEn || tour.destination,
    ...(('regionName' in tour && match.regionNameEn) ? { regionName: match.regionNameEn } : {}),
    ...(('highlights' in tour && match.highlightsEn) ? { highlights: match.highlightsEn } : {}),
  } as T;
}

export function getFallbackSchedules(tourId: string): Schedule[] {
  const tour = FALLBACK_TOURS.find((t) => t.id === tourId || t.slug === tourId) || FALLBACK_TOURS[0];
  const tourIdx = FALLBACK_TOURS.findIndex((t) => t.id === tour.id);
  const tourHex = (tourIdx >= 0 ? tourIdx + 1 : 1).toString().padStart(4, '0');
  const baseTime = Date.now();
  
  const schedules: Schedule[] = [];
  const intervals = [3, 7, 14, 21];
  
  intervals.forEach((days, idx) => {
    const depTime = baseTime + days * 24 * 60 * 60 * 1000;
    const depIso = new Date(depTime).toISOString();
    const available = idx === 0 ? 8 : idx === 1 ? 15 : 22;
    
    // Valid and unique UUID formatting per tour & schedule
    const schedHex = (idx + 1).toString().padStart(12, '0');
    const schedId = `b1000000-${tourHex}-4000-8000-${schedHex}`;

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

export function filterFallbackTours(query = '', region = '', lang: 'vi' | 'en' = 'vi'): Page<ExtendedTour> {
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
        (t.titleEn && t.titleEn.toLowerCase().includes(q)) ||
        t.destination.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.regionName.toLowerCase().includes(q)
    );
  }

  if (lang === 'en') {
    filtered = filtered.map((t) => getLocalizedTour(t, 'en'));
  }

  return {
    items: filtered,
    page: 1,
    pageSize: 20,
    total: filtered.length,
  };
}
