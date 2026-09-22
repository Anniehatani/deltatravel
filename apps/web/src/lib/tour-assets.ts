import type { Tour } from '@tour/shared';

export const TOUR_IMAGES: Record<string, string> = {
  'vinh-ha-long-du-thuyen-kayak': '/tour-ha-long.jpg',
  'sa-pa-chinh-phuc-fansipan-cat-cat': '/tour-sapa.jpg',
  'ninh-binh-trang-an-bai-dinh-hang-mua': '/tour-ninh-binh.jpg',
  'da-nang-hoi-an-ba-na-hills-cau-vang': '/tour-da-nang.jpg',
  'hue-co-do-dai-noi-ca-hue-song-huong': '/tour-hue.jpg',
  'nha-trang-bien-xanh-dao-diep-son': '/tour-nha-trang.jpg',
  'phu-quoc-dao-ngoc-lan-ngam-san-ho': '/tour-phu-quoc.jpg',
  'can-tho-cho-noi-cai-rang-miet-vuon': '/tour-can-tho.jpg',
  'tay-ninh-nui-ba-den-toa-thanh': '/tour-tay-ninh.jpg',
};

// Luxury editorial taglines for each destination
export const TOUR_LUXURY_TAGS: Record<string, string> = {
  'vinh-ha-long-du-thuyen-kayak': 'KỲ QUAN DI SẢN THẾ GIỚI',
  'sa-pa-chinh-phuc-fansipan-cat-cat': 'CHINH PHỤC ĐỈNH ĐÔNG DƯƠNG',
  'ninh-binh-trang-an-bai-dinh-hang-mua': 'TUYỆT TÁC NON NƯỚC TRÀNG AN',
  'da-nang-hoi-an-ba-na-hills-cau-vang': 'DI SẢN & BIỂU TƯỢNG CẦU VÀNG',
  'hue-co-do-dai-noi-ca-hue-song-huong': 'HOÀNG TRIỀU CỐ ĐÔ LINH THIÊNG',
  'nha-trang-bien-xanh-dao-diep-son': 'VỊNH NGỌC BÍCH & CON ĐƯỜNG BIỂN',
  'phu-quoc-dao-ngoc-lan-ngam-san-ho': 'THIÊN ĐƯỜNG ĐẢO NGỌC THƯỢNG LƯU',
  'can-tho-cho-noi-cai-rang-miet-vuon': 'PHONG VỊ MIỆT VƯỜN SÔNG NƯỚC',
  'tay-ninh-nui-ba-den-toa-thanh': 'ĐỈNH THIÊNG MÂY NGÀN TÂY NINH',
};

export function getTourImage(tour: Tour | { slug?: string; destination?: string }): string {
  if (tour.slug && TOUR_IMAGES[tour.slug]) {
    return TOUR_IMAGES[tour.slug];
  }
  const slug = (tour.slug || '').toLowerCase();
  const dest = (tour.destination || '').toLowerCase();

  if (slug.includes('long') || dest.includes('quảng ninh') || dest.includes('hạ long')) return '/tour-ha-long.jpg';
  if (slug.includes('sapa') || slug.includes('fansipan') || dest.includes('lào cai')) return '/tour-sapa.jpg';
  if (slug.includes('ninh-binh') || slug.includes('trang-an') || dest.includes('ninh bình')) return '/tour-ninh-binh.jpg';
  if (slug.includes('da-nang') || slug.includes('hoi-an') || dest.includes('đà nẵng')) return '/tour-da-nang.jpg';
  if (slug.includes('hue') || dest.includes('huế')) return '/tour-hue.jpg';
  if (slug.includes('nha-trang') || dest.includes('khánh hòa')) return '/tour-nha-trang.jpg';
  if (slug.includes('phu-quoc') || dest.includes('kiên giang') || dest.includes('phú quốc')) return '/tour-phu-quoc.jpg';
  if (slug.includes('can-tho') || dest.includes('cần thơ')) return '/tour-can-tho.jpg';
  if (slug.includes('tay-ninh') || dest.includes('tây ninh')) return '/tour-tay-ninh.jpg';

  return '/tour-ha-long.jpg';
}

export function getTourLuxuryTag(tour: Tour | { slug?: string }): string {
  if (tour.slug && TOUR_LUXURY_TAGS[tour.slug]) {
    return TOUR_LUXURY_TAGS[tour.slug];
  }
  return 'HÀNH TRÌNH ĐỘC BẢN';
}
