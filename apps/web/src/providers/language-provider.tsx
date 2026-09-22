'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'vi' | 'en';

interface Translations {
  [key: string]: {
    vi: string;
    en: string;
  };
}

export const DICTIONARY: Translations = {
  // Brand & Nav
  brand_name: { vi: 'DELTA TRAVEL', en: 'DELTA TRAVEL' },
  brand_tagline: { vi: 'Du lịch 3 miền', en: 'Vietnam Tours' },
  nav_home: { vi: 'Trang chủ', en: 'Home' },
  nav_north: { vi: 'Miền Bắc', en: 'Northern' },
  nav_central: { vi: 'Miền Trung', en: 'Central' },
  nav_south: { vi: 'Miền Nam', en: 'Southern' },
  nav_all_tours: { vi: 'Tất cả tour', en: 'All Tours' },
  nav_my_bookings: { vi: 'Đơn của tôi', en: 'My Bookings' },
  nav_assistant: { vi: 'Trợ lý du lịch', en: 'Travel Assistant' },
  nav_login: { vi: 'Đăng nhập', en: 'Login' },
  nav_register: { vi: 'Đăng ký', en: 'Register' },
  nav_admin: { vi: 'Quản trị', en: 'Admin' },
  nav_logout: { vi: 'Đăng xuất', en: 'Logout' },

  // Hero
  hero_tag: { vi: 'DELTA TRAVEL — KHÁM PHÁ VIỆT NAM', en: 'DELTA TRAVEL — DISCOVER VIETNAM' },
  hero_title_1: { vi: 'Hành Trình Gần Gũi,', en: 'Explore Vietnam With Ease,' },
  hero_title_2: { vi: 'Trọn Vẹn Niềm Vui', en: 'Full Of Cherished Memories' },
  hero_desc: {
    vi: 'Cùng gia đình và bạn bè khám phá trọn vẹn non sông 3 miền Bắc — Trung — Nam với lịch trình tiện lợi và giá vé minh bạch.',
    en: 'Discover the natural wonders and heritage across Northern, Central, and Southern Vietnam with clear schedules and transparent pricing.',
  },
  hero_scroll_hint: { vi: 'Cuộn chuột để bắt đầu hành trình', en: 'Scroll down to begin the journey' },
  hero_stage2_tag: { vi: '3 Miền Rạng Rỡ', en: '3 Distinct Regions' },
  hero_stage2_title: { vi: 'Mỗi Miền Một Vẻ Đẹp Riêng', en: 'Unique Beauty in Every Region' },
  hero_stage2_desc: {
    vi: 'Sa Pa mù sương Tây Bắc, Cố đô Huế trầm mặc, Cầu Vàng Đà Nẵng hay đảo ngọc Phú Quốc nắng ấm — điểm đến nào bạn cũng dễ dàng đồng hành.',
    en: 'From the misty mountains of Sa Pa and the ancient heritage of Hue to Da Nang Golden Bridge and sunny Phu Quoc island.',
  },
  hero_stage3_tag: { vi: 'Vịnh Hạ Long & Điểm Đến Kỳ Quan', en: 'Ha Long Bay & Iconic Landmarks' },
  hero_stage3_title: { vi: 'Sẵn Sàng Cho Chuyến Đi Tới?', en: 'Ready For Your Next Journey?' },
  hero_stage3_desc: {
    vi: 'Chọn nhanh khu vực bạn muốn đi hoặc tìm kiếm trực tiếp chuyến đi phù hợp.',
    en: 'Quickly select your preferred region or search for your ideal tour.',
  },
  btn_tour_north: { vi: 'Tour Miền Bắc', en: 'Northern Tours' },
  btn_tour_central: { vi: 'Tour Miền Trung', en: 'Central Tours' },
  btn_tour_south: { vi: 'Tour Miền Nam', en: 'Southern Tours' },
  search_placeholder: { vi: 'Hạ Long, Sa Pa, Đà Nẵng, Phú Quốc...', en: 'Ha Long, Sa Pa, Da Nang, Phu Quoc...' },
  btn_search: { vi: 'Tìm tour', en: 'Search' },

  // Regions section
  sec_region_tag: { vi: 'Khám Phá Theo Khu Vực', en: 'Explore By Region' },
  sec_region_title: { vi: 'Du Lịch 3 Miền Bắc — Trung — Nam', en: 'Tours Across 3 Regions' },
  sec_region_desc: {
    vi: 'Chọn khu vực bạn muốn đến để xem các tour du lịch phù hợp cho gia đình và nhóm bạn.',
    en: 'Choose your desired region to view handpicked tours suitable for families and friends.',
  },

  // Featured Tours
  sec_tours_tag: { vi: 'Lịch Trình Mở Bán', en: 'Available Itineraries' },
  sec_tours_title: { vi: 'Tour Được Khách Hàng Yêu Thích', en: 'Most Popular Tours' },
  view_all_tours: { vi: 'Xem tất cả tour', en: 'View all tours' },
  departure_from: { vi: 'Khởi hành', en: 'Departure' },
  view_schedule_price: { vi: 'Xem lịch & Giá', en: 'View Schedule & Price' },
  days: { vi: 'Ngày', en: 'Days' },
  nights: { vi: 'Đêm', en: 'Nights' },

  // Tours Page
  tours_page_badge: { vi: 'Du Lịch Nội Địa', en: 'Domestic Travel' },
  tours_page_title: { vi: 'Danh Sách Tour 3 Miền Đất Nước', en: 'Vietnam Tours Across 3 Regions' },
  tours_page_desc: {
    vi: 'Lựa chọn những hành trình ý nghĩa cùng gia đình và bạn bè với thông tin rõ ràng và giá vé minh bạch.',
    en: 'Choose meaningful journeys for family and friends with transparent information and prices.',
  },
  all_regions: { vi: 'Tất cả 3 Miền', en: 'All Regions' },
  region_filter: { vi: 'Khu vực:', en: 'Region:' },
  btn_reset: { vi: 'Đặt lại', en: 'Reset' },
  found_tours: { vi: 'Tìm thấy', en: 'Found' },
  tours_count: { vi: 'hành trình phù hợp', en: 'matching tours' },

  // Detail & Schedules
  sched_title: { vi: 'Lịch Khởi Hành & Giá Chỗ', en: 'Departure Dates & Pricing' },
  sched_subtitle: {
    vi: 'Chọn ngày khởi hành phù hợp với kế hoạch của bạn và gia đình',
    en: 'Select departure date that fits your family travel schedule',
  },
  dep_date: { vi: 'Ngày khởi hành', en: 'Departure date' },
  ticket_price: { vi: 'Giá vé:', en: 'Price:' },
  seats_left: { vi: 'Còn', en: 'Seats left:' },
  seats_unit: { vi: 'chỗ', en: '' },
  sold_out: { vi: 'Hết chỗ', en: 'Sold out' },
  quote_title: { vi: 'Báo Giá Trực Tuyến', en: 'Online Price Quote' },
  quote_adult: { vi: 'Người lớn (≥12 tuổi)', en: 'Adults (≥12 yrs)' },
  quote_child: { vi: 'Trẻ em (<12 tuổi)', en: 'Children (<12 yrs)' },
  total_estimate: { vi: 'Tổng tiền dự tính:', en: 'Estimated Total:' },
  btn_book_now: { vi: 'Tiếp tục đặt chỗ', en: 'Proceed to Booking' },

  // Guarantees
  guar_1_title: { vi: 'Lịch Trình Chu Đáo', en: 'Thoughtful Itineraries' },
  guar_1_desc: {
    vi: 'Sắp xếp khoa học, thoải mái cho cả người lớn tuổi và trẻ nhỏ.',
    en: 'Comfortable pacing designed for both seniors and young children.',
  },
  guar_2_title: { vi: 'Giá Rõ Ràng & Giữ Chỗ Tức Thì', en: 'Clear Prices & Instant Hold' },
  guar_2_desc: {
    vi: 'Hiển thị cụ thể giá người lớn và trẻ em theo VND. Khóa chỗ an toàn 15 phút.',
    en: 'Transparent adult & child pricing in VND. Safe 15-minute slot lock.',
  },
  guar_3_title: { vi: 'Hỗ Trợ Tận Tình 24/7', en: '24/7 Dedicated Support' },
  guar_3_desc: {
    vi: 'Đội ngũ tư vấn đồng hành cùng bạn trước, trong và sau chuyến đi.',
    en: 'Our support team accompanies you before, during, and after your trip.',
  },

  // Footer
  footer_about: {
    vi: 'Cùng người thân và gia đình khám phá trọn vẹn cảnh sắc kỳ vĩ, con người thân thiện và nét văn hóa đặc sắc của 3 miền đất nước.',
    en: 'Explore the scenic wonders, friendly people, and rich cultural heritage of Vietnam with DELTA TRAVEL.',
  },
  footer_explore: { vi: 'Khám Phá 3 Miền', en: 'Explore 3 Regions' },
  footer_service: { vi: 'Dịch Vụ & Tra Cứu', en: 'Services & Lookup' },
  footer_contact: { vi: 'Liên Hệ Hỗ Trợ', en: 'Contact & Support' },
  footer_copyright: {
    vi: '© 2026 DELTA TRAVEL. Đồng hành cùng du khách trên mọi hành trình quê hương.',
    en: '© 2026 DELTA TRAVEL. Accompanying travelers across every journey.',
  },
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'vi',
  setLang: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('vi');

  useEffect(() => {
    const saved = localStorage.getItem('delta_lang') as Language;
    if (saved === 'vi' || saved === 'en') {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('delta_lang', newLang);
  };

  const t = (key: string): string => {
    const item = DICTIONARY[key];
    if (!item) return key;
    return item[lang] || item.vi || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
