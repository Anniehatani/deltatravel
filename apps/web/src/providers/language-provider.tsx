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
  nav_tagline: { vi: 'Du lịch 3 miền', en: 'Vietnam Tours' },
  nav_home: { vi: 'Trang chủ', en: 'Home' },
  nav_north: { vi: 'Miền Bắc', en: 'Northern' },
  nav_central: { vi: 'Miền Trung', en: 'Central' },
  nav_south: { vi: 'Miền Nam', en: 'Southern' },
  nav_region_bac: { vi: 'Miền Bắc', en: 'Northern Vietnam' },
  nav_region_trung: { vi: 'Miền Trung', en: 'Central Vietnam' },
  nav_region_nam: { vi: 'Miền Nam', en: 'Southern Vietnam' },
  nav_all_tours: { vi: 'Tất cả tour', en: 'All Tours' },
  nav_tours: { vi: 'Tất cả tour', en: 'All Tours' },
  nav_my_bookings: { vi: 'Đơn của tôi', en: 'My Bookings' },
  nav_bookings: { vi: 'Đơn của tôi', en: 'My Bookings' },
  nav_assistant: { vi: 'Trợ lý du lịch', en: 'Travel Assistant' },
  nav_login: { vi: 'Đăng nhập', en: 'Login' },
  nav_register: { vi: 'Đăng ký', en: 'Register' },
  nav_admin: { vi: 'Quản trị', en: 'Admin' },
  nav_logout: { vi: 'Đăng xuất', en: 'Logout' },

  // Travel Assistant Page
  asst_badge: { vi: 'TƯ VẤN DU LỊCH', en: 'LUXURY CONCIERGE' },
  asst_title: { vi: 'HỎI ĐÁP & TƯ VẤN DU LỊCH', en: 'Q&A & TRAVEL CONCIERGE' },
  asst_desc: {
    vi: 'Tìm kiếm hành trình 3 miền, tra cứu quy định hoặc kiểm tra đơn đặt của bạn một cách nhanh chóng.',
    en: 'Discover 3-region Vietnam journeys, look up booking policies, or check your reservations seamlessly.',
  },
  asst_suggestions_title: { vi: 'Gợi ý câu hỏi thường gặp', en: 'Frequently Asked Questions' },
  asst_q1: { vi: 'Gợi ý tour du lịch biển nghỉ dưỡng cao cấp?', en: 'Recommend luxury beach resort tours?' },
  asst_q2: { vi: 'Chính sách hủy và thời hạn 72 giờ như thế nào?', en: 'How does the 72-hour cancellation policy work?' },
  asst_q3: { vi: 'Quy trình giữ chỗ 15 phút và thanh toán ra sao?', en: 'How does the 15-minute hold and payment process work?' },
  asst_q4: { vi: 'Có những hành trình di sản miền Trung nào?', en: 'What heritage journeys are available in Central Vietnam?' },
  asst_verified: { vi: 'đã xác thực', en: 'verified' },
  asst_sources_title: { vi: 'Cơ sở dữ liệu trích xuất:', en: 'Verified Knowledge Sources:' },
  asst_waiting: { vi: 'Trợ lý đang truy xuất dữ liệu tour và chính sách...', en: 'Concierge is retrieving tour data and policies...' },
  asst_placeholder: {
    vi: 'Hỏi về địa điểm, giá vé trẻ em, lịch khởi hành hoặc chính sách hủy...',
    en: 'Ask about destinations, child pricing, departure schedules, or cancellation policy...',
  },
  asst_send: { vi: 'Gửi', en: 'Send' },
  asst_disclaimer: {
    vi: 'Trợ lý dựa trên quy chuẩn tour thật. Các giao dịch đặt tour, giữ chỗ và thanh toán luôn cần bạn xác nhận trực tiếp tại trang checkout tương ứng.',
    en: 'The concierge provides verified tour standards. Seat reservations and payments always require your direct confirmation at checkout.',
  },
  asst_groq_badge: { vi: 'Trí tuệ nhân tạo Groq LPU', en: 'Groq LPU AI Concierge' },
  asst_smart_badge: { vi: 'Trợ lý thông minh', en: 'Smart Assistant' },
  asst_rule_badge: { vi: 'Hệ thống tra cứu', en: 'Lookup System' },
  asst_connect_error: { vi: 'Chưa thể kết nối tới dịch vụ trợ lý.', en: 'Unable to connect to concierge service.' },

  // Hero
  hero_tag: { vi: 'DELTA PRIVÉ • BỘ SƯU TẬP 2026', en: 'DELTA PRIVÉ • 2026 COLLECTION' },
  hero_title_1: { vi: 'KIỆT TÁC HÀNH TRÌNH,', en: 'HAUTE EXPEDITIONS,' },
  hero_title_2: { vi: 'ĐỘC BẢN VIỆT NAM', en: 'EXCLUSIVE HERITAGE' },
  hero_desc: {
    vi: 'Khám phá non sông gấm vóc 3 miền Bắc — Trung — Nam với chuẩn mực dịch vụ thượng lưu, lịch trình cá nhân hóa và đặc quyền 5 sao trọn gói.',
    en: 'Discover the timeless wonders across Northern, Central, and Southern Vietnam with royal service standards, bespoke itineraries, and 5-star privileges.',
  },
  hero_scroll_hint: { vi: 'Cuộn chuột để chiêm ngưỡng tuyệt tác', en: 'Scroll down to explore the collection' },
  hero_stage2_tag: { vi: 'TAM GIÁC DI SẢN 3 MIỀN', en: '3 ICONIC REALMS' },
  hero_stage2_title: { vi: 'Bản Hòa Ca Thiên Nhiên & Di Sản', en: 'A Symphony of Nature & Heritage' },
  hero_stage2_desc: {
    vi: 'Từ đỉnh Fansipan mờ sương, Cố đô Huế trầm mặc, Cầu Vàng Đà Nẵng đến Đảo Ngọc Phú Quốc — mỗi bước chân là một dấu ấn xa hoa khó quên.',
    en: 'From misty Fansipan and royal Hue to the Golden Bridge and tropical Phu Quoc — every moment is curated for unforgettable elegance.',
  },
  hero_stage3_tag: { vi: 'BỘ SƯU TẬP HÀNH TRÌNH THƯỢNG LƯU', en: 'BESPOKE TRAVEL COLLECTION' },
  hero_stage3_title: { vi: 'Khởi Đầu Kỳ Nghỉ Độc Bản Của Quý Khách', en: 'Begin Your Bespoke Vacation' },
  hero_stage3_desc: {
    vi: 'Tuyển tập 09 hành trình được thiết kế riêng bởi các chuyên gia lữ hành hàng đầu.',
    en: 'A curated selection of 09 signature voyages tailored by premier travel connoisseurs.',
  },
  btn_tour_north: { vi: 'Tour Miền Bắc', en: 'Northern Tours' },
  btn_tour_central: { vi: 'Tour Miền Trung', en: 'Central Tours' },
  btn_tour_south: { vi: 'Tour Miền Nam', en: 'Southern Tours' },
  hero_btn_explore_all: { vi: 'Khám Phá Toàn Bộ Hành Trình', en: 'Explore All Journeys' },
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

  // 3 Regions Homepage Section
  sec_3regions_tag: { vi: 'TAM GIÁC DI SẢN • ARCHITECTURE & NATURE', en: 'HERITAGE TRIANGLE • ARCHITECTURE & NATURE' },
  sec_3regions_title: { vi: 'Ba Phân Vùng Tuyệt Tác Việt Nam', en: 'Three Masterpiece Realms of Vietnam' },
  sec_3regions_desc: {
    vi: 'Mỗi vùng miền là một bản hòa ca giữa thiên nhiên nguyên sơ và tinh hoa di sản, được kiến tạo để mang lại trải nghiệm nghỉ dưỡng xa hoa trọn vẹn nhất.',
    en: 'Each region is a harmonious symphony of pristine nature and cultural heritage, curated to deliver the ultimate luxury vacation.',
  },
  reg_bac_name: { vi: 'Miền Bắc', en: 'Northern Vietnam' },
  reg_bac_tag: { vi: 'KỲ QUAN NON NƯỚC & NÓC NHÀ ĐÔNG DƯƠNG', en: 'SCENIC WONDERS & INDOCHINA ROOFTOP' },
  reg_bac_desc: {
    vi: 'Hạ Long vịnh kỳ quan đá vôi nghìn năm, biển mây Fansipan bồng bềnh và quần thể Tràng An linh thiêng.',
    en: 'Thousand-year limestone wonders of Ha Long, floating cloudscapes atop Mount Fansipan, and sacred Trang An.',
  },
  reg_trung_name: { vi: 'Miền Trung', en: 'Central Vietnam' },
  reg_trung_tag: { vi: 'HOÀNG TRIỀU CỐ ĐÔ & BIỂN NGỌC BÍCH', en: 'IMPERIAL DYNASTY & EMERALD SEAS' },
  reg_trung_desc: {
    vi: 'Kiệt tác Cầu Vàng Bà Nà Hills, lồng đèn phố cổ Hội An và di sản Đại Nội Huế trầm mặc hữu tình.',
    en: 'Iconic Golden Bridge of Ba Na Hills, radiant lanterns of Hoi An ancient town, and poetic Hue Imperial Citadel.',
  },
  reg_nam_name: { vi: 'Miền Nam', en: 'Southern Vietnam' },
  reg_nam_tag: { vi: 'THIÊN ĐƯỜNG ĐẢO NGỌC & MIỆT VƯỜN SÔNG NƯỚC', en: 'TROPICAL PARADISE & MEKONG RIVERWAYS' },
  reg_nam_desc: {
    vi: 'Bờ cát trắng biển xanh ngọc Phú Quốc, rực rỡ chợ nổi Cái Răng miền Tây và đỉnh thiêng mây ngàn Tây Ninh.',
    en: 'Powdery white beaches of Phu Quoc island, bustling Cai Rang floating market, and mist-veiled Mount Ba Den.',
  },

  // Haute Collection
  haute_tag: { vi: 'HAUTE COLLECTION • BỘ SƯU TẬP TINH HOA', en: 'HAUTE COLLECTION • SIGNATURE VOYAGES' },
  haute_title: { vi: 'Những Hành Trình Độc Bản 2026', en: 'Bespoke Journeys of 2026' },
  haute_desc: {
    vi: 'Tuyển tập 09 kiệt tác hành trình trọn gói được thiết kế tỉ mỉ bởi các chuyên gia lữ hành hàng đầu.',
    en: 'A handpicked anthology of 09 all-inclusive signature expeditions curated by premier travel connoisseurs.',
  },
  filter_all: { vi: 'Tất Cả (9)', en: 'All (9)' },
  filter_bac: { vi: 'Miền Bắc', en: 'Northern' },
  filter_trung: { vi: 'Miền Trung', en: 'Central' },
  filter_nam: { vi: 'Miền Nam', en: 'Southern' },
  btn_explore_all: { vi: 'Khám Phá Toàn Bộ Bộ Sưu Tập', en: 'Explore Entire Collection' },

  // Service Philosophy
  phil_tag: { vi: 'CHUẨN MỰC PHỤC VỤ HOÀNG GIA', en: 'ROYAL SERVICE STANDARD' },
  phil_title: { vi: 'Triết Lý Dịch Vụ DELTA PRIVÉ', en: 'DELTA PRIVÉ Service Philosophy' },
  phil_desc: {
    vi: 'Mỗi chi tiết đều được tinh chỉnh nhằm mang lại sự an tâm tuyệt đối và đặc quyền cao cấp nhất cho Quý khách.',
    en: 'Every detail is tailored to deliver absolute peace of mind and peerless luxury privileges.',
  },
  phil_1_title: { vi: 'Minh Bạch & Đặc Quyền Cao Cấp', en: 'Transparent & Royal Privileges' },
  phil_1_desc: {
    vi: '100% giá vé trọn gói minh bạch, không phí ẩn. Bao gồm dịch vụ đón tiễn hạng thương gia và bảo hiểm du lịch quốc tế tối đa.',
    en: '100% transparent all-inclusive fares with no hidden costs. Includes business-class transfers and full international travel insurance.',
  },
  phil_2_title: { vi: 'Quản Gia Lữ Hành Riêng 24/7', en: '24/7 Dedicated Travel Butler' },
  phil_2_desc: {
    vi: 'Đội ngũ chuyên viên túc trực hỗ trợ tức thì mọi nhu cầu riêng biệt, từ yêu cầu ẩm thực đặc biệt đến sắp xếp nhiếp ảnh gia cá nhân.',
    en: 'Our elite concierge team is on standby 24/7 for all personalized requests, from dietary preferences to private photographers.',
  },
  phil_3_title: { vi: 'Kiểm Tuyển Chuẩn 5 Sao', en: '5-Star Curated Quality' },
  phil_3_desc: {
    vi: 'Đối tác hàng không cao cấp, resort và du thuyền được kiểm định khắt khe nhất để đảm bảo chất lượng hoàn mỹ trong từng khoảnh khắc.',
    en: 'Premier airlines, luxury resorts, and boutique cruises rigorously vetted to guarantee perfection throughout every moment.',
  },

  // Bespoke Banner
  bespoke_tag: { vi: 'BESPOKE TRAVEL CONCIERGE', en: 'BESPOKE TRAVEL CONCIERGE' },
  bespoke_title: { vi: 'Đặc Quyền Thiết Kế Hành Trình Riêng Biệt', en: 'Bespoke Itinerary Curation Privileges' },
  bespoke_desc: {
    vi: 'Trò chuyện cùng AI Concierge hoặc Chuyên gia Lữ hành cao cấp để may đo lịch trình độc bản theo sở thích, số ngày và ngân sách riêng của gia đình Quý khách.',
    en: 'Converse with our AI Concierge or Private Travel Specialists to tailor a one-of-a-kind voyage matching your family’s desires, duration, and budget.',
  },
  bespoke_btn_ai: { vi: 'Hỏi Trợ Lý AI Riêng', en: 'Ask AI Concierge' },
  bespoke_btn_all: { vi: 'Xem Tất Cả Tuyệt Tác', en: 'View All Masterpieces' },

  // Card Badges & Pricing
  card_badge_luxury: { vi: '5.0 Thượng Lưu', en: '5.0 Luxury' },
  card_price_from: { vi: 'Đặc Quyền Từ', en: 'Starting From' },
  card_per_guest: { vi: '/ khách', en: '/ guest' },
  card_view_action: { vi: 'Chiêm Ngưỡng', en: 'Explore' },

  // Tours Page
  tours_header_badge: { vi: 'DELTA PRIVÉ • BỘ SƯU TẬP 2026', en: 'DELTA PRIVÉ • 2026 COLLECTION' },
  tours_header_title: { vi: 'NHỮNG HÀNH TRÌNH ĐỘC BẢN', en: 'BESPOKE SIGNATURE JOURNEYS' },
  tours_header_desc: {
    vi: 'Tuyển tập những kiệt tác du lịch và nghỉ dưỡng thượng lưu khắp Việt Nam. Chuẩn mực dịch vụ tinh hoa, lịch trình độc quyền và trải nghiệm cá nhân hóa trọn vẹn.',
    en: 'An anthology of premier travel and luxury resort masterpieces across Vietnam. Elite standards, exclusive itineraries, and fully tailored experiences.',
  },
  tours_tab_all: { vi: 'Tất Cả Hành Trình', en: 'All Itineraries' },
  tours_tab_all_sub: { vi: '9 Điểm Đến', en: '9 Destinations' },
  tours_tab_bac_sub: { vi: 'Kỳ Quan & Di Sản', en: 'Wonders & Heritage' },
  tours_tab_trung_sub: { vi: 'Hoàng Cung & Biển Xanh', en: 'Imperial & Azure Seas' },
  tours_tab_nam_sub: { vi: 'Đảo Ngọc & Sông Nước', en: 'Emerald Isle & Rivers' },
  tours_counter_prefix: { vi: 'BỘ SƯU TẬP', en: 'COLLECTION' },
  tours_counter_suffix: { vi: 'HÀNH TRÌNH TINH HOA', en: 'SIGNATURE JOURNEYS' },
  tours_counter_all: { vi: 'BỘ SƯU TẬP KIỆT TÁC • 09 HÀNH TRÌNH ĐỘC BẢN', en: 'MASTERPIECE COLLECTION • 09 BESPOKE JOURNEYS' },
  tours_guarantee_text: { vi: 'Cam kết dịch vụ 5 sao & bảo hiểm du lịch trọn gói', en: '5-Star service guarantee & comprehensive insurance' },

  // Tour Details & Itinerary
  detail_breadcrumb_home: { vi: 'DELTA TRAVEL', en: 'DELTA TRAVEL' },
  detail_origin_vn: { vi: 'Xuất phát: Việt Nam', en: 'Departure: Vietnam' },
  detail_itinerary_badge: { vi: 'TRẢI NGHIỆM ĐỘC BẢN', en: 'BESPOKE EXPERIENCE' },
  detail_itinerary_title: { vi: 'Lịch Trình Chi Tiết Từng Ngày', en: 'Detailed Day-by-Day Itinerary' },
  detail_itinerary_desc: {
    vi: 'Thiết kế tỉ mỉ kết hợp trọn vẹn giữa thưởng ngoạn danh lam thắng cảnh và nghỉ dưỡng cao cấp.',
    en: 'Meticulously crafted balancing breathtaking sightseeing with luxury relaxation.',
  },
  detail_itinerary_days_suffix: { vi: 'Ngày hành trình', en: 'Days Voyage' },
  detail_day_prefix: { vi: 'NGÀY', en: 'DAY' },
  detail_cuisine: { vi: 'Ẩm thực:', en: 'Cuisine:' },
  detail_lodging: { vi: 'Lưu trú:', en: 'Lodging:' },
  detail_commit_title: { vi: 'Cam Kết Dịch Vụ DELTA TRAVEL', en: 'DELTA TRAVEL Service Commitments' },
  detail_commit_1: {
    vi: 'Khách sạn & điểm lưu trú sạch sẽ, tiện nghi và đạt chuẩn chất lượng.',
    en: 'Pristine, elegant, and rigorously inspected hotel and resort accommodations.',
  },
  detail_commit_2: {
    vi: 'Bảo hiểm du lịch trọn gói đầy đủ theo quy định cho mọi thành viên.',
    en: 'Comprehensive travel insurance included for every passenger.',
  },
  detail_commit_3: {
    vi: 'Hướng dẫn viên tận tình, am hiểu văn hóa và phong tục từng vùng miền.',
    en: 'Dedicated, knowledgeable tour guides fluent in local culture and traditions.',
  },
  detail_commit_4: {
    vi: 'Hỗ trợ chu đáo 24/7 trước, trong và sau suốt hành trình của bạn.',
    en: '24/7 attentive concierge assistance before, during, and after your trip.',
  },
  detail_person_unit: { vi: 'khách', en: 'guest' },
  detail_child_unit: { vi: 'bé', en: 'child' },
  detail_hold_hint: {
    vi: 'Chỗ được khóa an toàn 15 phút. Xác nhận minh bạch theo tiền VND.',
    en: 'Seats held securely for 15 minutes. Transparent confirmation in VND.',
  },
  detail_select_date_hint: {
    vi: 'Vui lòng chọn ngày khởi hành để tiếp tục.',
    en: 'Please select a departure date to proceed.',
  },

  // Destinations Showcase
  dest_showcase_tag: { vi: 'DANH THẮNG TRỌNG ĐIỂM', en: 'ICONIC DESTINATIONS' },
  dest_showcase_title: { vi: 'Điểm Đến Di Sản & Nghỉ Dưỡng', en: 'Heritage & Luxury Destinations' },
  dest_showcase_desc: {
    vi: 'Khám phá những vùng đất đẹp nhất hình chữ S được tuyển chọn khắt khe theo tiêu chuẩn cảnh quan và dịch vụ 5 sao.',
    en: 'Explore the most breathtaking destinations across Vietnam curated under strict 5-star landscape and hospitality standards.',
  },

  // Signature Experiences
  exp_tag: { vi: 'ĐẶC QUYỀN TRẢI NGHIỆM', en: 'SIGNATURE EXPERIENCES' },
  exp_title: { vi: 'Những Khoảnh Khắc Khó Quên', en: 'Unforgettable Moments' },
  exp_desc: {
    vi: 'Từ du thuyền ngắm hoàng hôn vịnh biển đến bữa tối fine-dining giữa lòng di sản cổ kính.',
    en: 'From golden sunset yacht cruises to private fine-dining inside timeless imperial citadels.',
  },
  exp_1_title: { vi: 'Du Thuyền Thượng Lưu', en: 'Luxury Yacht Cruises' },
  exp_1_desc: { vi: 'Thưởng ngoạn vịnh kỳ quan trên du thuyền 5 sao chuẩn quốc tế với phòng ban công riêng.', en: 'Sail across UNESCO heritage bays on luxury suites with private ocean-view balconies.' },
  exp_2_title: { vi: 'Bay Trực Thăng / Cáp Treo Mây', en: 'Helicopter & Cloud Cable Cars' },
  exp_2_desc: { vi: 'Chiêm ngưỡng toàn cảnh núi rừng Tây Bắc và biển đảo từ độ cao ngoạn mục.', en: 'Gaze over panoramic mountain ranges and turquoise islands from breathtaking heights.' },
  exp_3_title: { vi: 'Ẩm Thực Tinh Hoa Di Sản', en: 'Royal Gastronomy' },
  exp_3_desc: { vi: 'Thưởng thức thực đơn cung đình Huế và hải sản tươi sống được bếp trưởng 5 sao chế biến riêng.', en: 'Savor imperial banquets and fresh seafood curated by renowned 5-star executive chefs.' },
  exp_4_title: { vi: 'Văn Hóa & Làng Nghề Nghìn Năm', en: 'Living Heritage' },
  exp_4_desc: { vi: 'Gặp gỡ nghệ nhân bản địa, lắng nghe ca trù, nhã nhạc cung đình và tìm hiểu phong tục cổ.', en: 'Meet master artisans, listen to UNESCO court music, and immerse in authentic traditions.' },

  // How It Works / 4-Step Process
  proc_tag: { vi: 'QUY TRÌNH ĐẶT TOUR TINH GỌN', en: 'SEAMLESS BOOKING PROCESS' },
  proc_title: { vi: '4 Bước Khởi Đầu Kỳ Nghỉ Độc Bản', en: '4 Steps to Your Dream Vacation' },
  proc_desc: {
    vi: 'Trải nghiệm đặt tour trực tuyến hiện đại, giữ chỗ an toàn tức thì và hỗ trợ chuyên nghiệp.',
    en: 'Experience a frictionless online booking flow with instant secure seat reservation.',
  },
  proc_1_title: { vi: '1. Chọn Tuyệt Tác Hành Trình', en: '1. Select Your Itinerary' },
  proc_1_desc: { vi: 'Khám phá bộ sưu tập 09 hành trình độc bản hoặc trò chuyện với Trợ lý AI để chọn tour phù hợp.', en: 'Explore our curated collection of 09 signature voyages or consult our AI Assistant.' },
  proc_2_title: { vi: '2. Kiểm Tra Lịch & Giá Minh Bạch', en: '2. Check Live Dates & Pricing' },
  proc_2_desc: { vi: 'Xem số chỗ trống thực tế theo thời gian thực và tổng chi phí rõ ràng, không phụ phí phát sinh.', en: 'View real-time seat availability and clear all-inclusive pricing with zero hidden fees.' },
  proc_3_title: { vi: '3. Khóa Chỗ An Toàn 15 Phút', en: '3. 15-Minute Secure Slot Lock' },
  proc_3_desc: { vi: 'Hệ thống tự động giữ chỗ ưu tiên trong 15 phút để bạn hoàn tất xác nhận thanh toán an toàn.', en: 'Our system instantly reserves your preferred seats for 15 minutes to finalize booking.' },
  proc_4_title: { vi: '4. Tận Hưởng Kỳ Nghỉ Hoàn Mỹ', en: '4. Embark on Your Journey' },
  proc_4_desc: { vi: 'Quản gia lữ hành riêng đón tiếp chu đáo và đồng hành cùng Quý khách suốt chuyến đi.', en: 'Your dedicated travel butler welcomes and escorts you throughout the royal journey.' },

  // Key Statistics
  stats_1_num: { vi: '25,000+', en: '25,000+' },
  stats_1_label: { vi: 'Du khách thượng lưu hài lòng', en: 'Satisfied Luxury Travelers' },
  stats_2_num: { vi: '99.8%', en: '99.8%' },
  stats_2_label: { vi: 'Đánh giá 5 sao xuất sắc', en: '5-Star Excellence Rating' },
  stats_3_num: { vi: '100%', en: '100%' },
  stats_3_label: { vi: 'Bảo hiểm du lịch trọn gói', en: 'All-Inclusive Travel Insurance' },
  stats_4_num: { vi: '24/7', en: '24/7' },
  stats_4_label: { vi: 'Quản gia lữ hành riêng', en: 'Dedicated Concierge Butler' },

  // Reviews & Feedback
  rev_tag: { vi: 'TRẢI NGHIỆM THỰC TẾ', en: 'GUEST EXPERIENCES' },
  rev_title: { vi: 'Cảm Nhận Từ Quý Khách Hàng', en: 'Testimonials From Our Guests' },
  rev_desc: {
    vi: 'Những chia sẻ chân thực từ các gia đình và doanh nhân đã đồng hành cùng DELTA TRAVEL.',
    en: 'Authentic reflections from families and entrepreneurs who traveled with DELTA PRIVÉ.',
  },
  rev_1_name: { vi: 'Doanh nhân Trần Minh Đức', en: 'Mr. Tran Minh Duc' },
  rev_1_role: { vi: 'Hà Nội • Khách hàng VIP', en: 'Hanoi • VIP Guest' },
  rev_1_tour: { vi: 'Tour Vịnh Hạ Long — Du Thuyền 5 Sao', en: 'Ha Long Bay 5-Star Cruise' },
  rev_1_content: {
    vi: 'Chuyến đi Hạ Long cùng gia đình thực sự đẳng cấp. Du thuyền riêng sang trọng, ẩm thực hải sản xuất sắc và đội ngũ quản gia chăm sóc chu đáo đến từng chi tiết nhỏ.',
    en: 'The Ha Long voyage with my family was truly sublime. Luxury private yacht, exquisite seafood, and our butler attended to every fine detail.',
  },
  rev_2_name: { vi: 'Chị Lê Hoài An', en: 'Ms. Le Hoai An' },
  rev_2_role: { vi: 'TP. Hồ Chí Minh • Gia đình 3 thế hệ', en: 'HCMC • 3-Generation Family' },
  rev_2_tour: { vi: 'Tour Đà Nẵng — Hội An — Cầu Vàng', en: 'Da Nang — Hoi An — Golden Bridge' },
  rev_2_content: {
    vi: 'Lịch trình rất thong thả và hợp lý cho cả bố mẹ lớn tuổi lẫn các bé. Khách sạn 5 sao tiện nghi, xe đưa đón riêng sạch sẽ và hướng dẫn viên cực kỳ am hiểu lịch sử.',
    en: 'The itinerary was gentle and perfectly paced for both elderly parents and kids. Splendid 5-star lodging, clean private transport, and very knowledgeable guides.',
  },
  rev_3_name: { vi: 'Anh Nguyễn Hoàng Nam', en: 'Mr. Nguyen Hoang Nam' },
  rev_3_role: { vi: 'Đà Nẵng • Cặp đôi kỳ nghỉ', en: 'Da Nang • Couple Vacation' },
  rev_3_tour: { vi: 'Tour Phú Quốc — Sunset Sanato & Cáp Treo', en: 'Phu Quoc Sunset & Cable Car' },
  rev_3_content: {
    vi: 'Giao diện đặt tour hiện đại, khóa chỗ nhanh chóng và giá vé rất minh bạch. Trợ lý du lịch AI tư vấn lịch trình rất thông minh. Chắc chắn sẽ tiếp tục chọn DELTA!',
    en: 'Ultra-modern booking UI, fast seat lock, and transparent pricing. The AI travel assistant was surprisingly insightful. Will definitely return to DELTA!',
  },

  // Footer
  footer_trust_1_title: { vi: 'Chất Lượng Đảm Bảo', en: 'Verified Quality' },
  footer_trust_1_desc: { vi: '100% Tour tuyển chọn chu đáo, hướng dẫn tận tình', en: '100% Handpicked luxury tours with dedicated guidance' },
  footer_trust_2_title: { vi: 'Giữ Chỗ Tiện Lợi', en: 'Seamless Booking' },
  footer_trust_2_desc: { vi: 'Khóa chỗ trực tuyến an toàn trong 15 phút', en: 'Instant online slot reservation held safely for 15 minutes' },
  footer_trust_3_title: { vi: 'Hỗ Trợ Tận Tâm 24/7', en: '24/7 Concierge Support' },
  footer_trust_3_desc: { vi: 'Đồng hành cùng bạn trên mọi nẻo đường quê hương', en: 'Accompanying you across every journey across Vietnam' },
  footer_col_regions: { vi: 'Khám Phá 3 Miền', en: 'Explore 3 Regions' },
  footer_col_services: { vi: 'Dịch Vụ & Đơn Hàng', en: 'Services & Orders' },
  footer_col_contact: { vi: 'Liên Hệ Hỗ Trợ', en: 'Contact & Support' },
  footer_hotline_text: { vi: 'Tổng đài: 1900 6868', en: 'Hotline: 1900 6868' },
  footer_cities_text: { vi: 'Hà Nội — Đà Nẵng — TP.HCM', en: 'Hanoi — Da Nang — Ho Chi Minh City' },
  footer_rights_text: { vi: '© 2026 DELTA TRAVEL. Bảo lưu mọi quyền.', en: '© 2026 DELTA TRAVEL. All rights reserved.' },
  footer_tagline_text: { vi: 'Du lịch Việt Nam an tâm, trọn vẹn và gần gũi.', en: 'Experience Vietnam with tranquility, distinction, and elegance.' },

  // Authentication & RequireAuth
  auth_checking: { vi: 'Đang kiểm tra phiên đăng nhập...', en: 'Verifying session...' },
  auth_badge: { vi: 'XÁC THỰC TÀI KHOẢN • BẢO MẬT', en: 'ACCOUNT AUTHENTICATION • SECURITY' },
  auth_login_required: { vi: 'Đăng Nhập Để Tiếp Tục', en: 'Sign In To Continue' },
  auth_login_desc: {
    vi: 'Vui lòng đăng nhập tài khoản Delta Travel để tra cứu thông tin đơn hàng, lịch trình khởi hành và vé máy bay/du thuyền của bạn.',
    en: 'Please sign in to your Delta Travel account to review reservations, departure schedules, and your flight/cruise tickets.',
  },
  auth_btn_login: { vi: 'Đăng Nhập Ngay', en: 'Sign In Now' },
  auth_btn_register: { vi: 'Tạo Tài Khoản Mới', en: 'Create New Account' },
  auth_back_home: { vi: 'Quay về trang chủ', en: 'Return to Homepage' },
  auth_forbidden_title: { vi: 'Quyền Truy Cập Bị Hạn Chế', en: 'Access Restricted' },
  auth_forbidden_desc: {
    vi: 'Tài khoản hiện tại không có đủ thẩm quyền để xem khu vực quản trị này.',
    en: 'Your account does not have sufficient permissions to view this administrative area.',
  },
  login_page_title: { vi: 'Đăng nhập', en: 'Sign In' },
  login_page_desc: { vi: 'Tiếp tục hành trình của bạn.', en: 'Continue your journey.' },
  register_page_title: { vi: 'Tạo tài khoản', en: 'Create Account' },
  register_page_desc: { vi: 'Quản lý các hành trình của bạn tại một nơi.', en: 'Manage all your journeys in one place.' },
  auth_member_system: { vi: 'Hệ Thống Thành Viên', en: 'Membership Portal' },
  auth_welcome_back: { vi: 'Chào Mừng Trở Lại', en: 'Welcome Back' },
  auth_create_account: { vi: 'Đăng Ký Tài Khoản', en: 'Create Account' },
  auth_login_sub: {
    vi: 'Đăng nhập để tra cứu lịch sử hành trình và tiếp tục giữ chỗ.',
    en: 'Sign in to access your journey history and continue seat reservations.',
  },
  auth_register_sub: {
    vi: 'Tạo tài khoản để quản lý đơn đặt tour và hưởng ưu đãi dành riêng.',
    en: 'Create an account to manage your tour bookings and receive exclusive privileges.',
  },
  auth_name_label: { vi: 'Họ và tên của bạn *', en: 'Your Full Name *' },
  auth_name_placeholder: { vi: 'Ví dụ: Lê Văn An', en: 'e.g. John Doe' },
  auth_email_label: { vi: 'Địa chỉ Email *', en: 'Email Address *' },
  auth_email_placeholder: { vi: 'example@domain.vn', en: 'example@domain.com' },
  auth_pwd_label: { vi: 'Mật khẩu *', en: 'Password *' },
  auth_pwd_min: { vi: 'Tối thiểu 12 ký tự', en: 'Min 12 characters' },
  auth_btn_submit_login: { vi: 'Đăng nhập', en: 'Sign In' },
  auth_btn_submit_register: { vi: 'Tạo tài khoản ngay', en: 'Create Account Now' },
  auth_processing: { vi: 'Đang xử lý...', en: 'Processing...' },
  auth_have_account: { vi: 'Đã có tài khoản?', en: 'Already have an account?' },
  auth_no_account: { vi: 'Chưa có tài khoản thành viên?', en: 'No membership account yet?' },
  auth_link_login: { vi: 'Đăng nhập tại đây', en: 'Sign in here' },
  auth_link_register: { vi: 'Đăng ký miễn phí', en: 'Register for free' },

  // Account Management Modal
  acc_vip_badge: { vi: 'DELTA PRIVÉ • THÀNH VIÊN THƯỢNG LƯU', en: 'DELTA PRIVÉ • VIP MEMBER' },
  acc_title: { vi: 'Quản Lý Tài Khoản', en: 'Account Management' },
  acc_desc: {
    vi: 'Tùy chỉnh ảnh đại diện, thông tin định danh và quyền lợi khách hàng VIP.',
    en: 'Customize your profile avatar, personal credentials, and VIP benefits.',
  },
  acc_change_avatar: { vi: 'Đổi ảnh', en: 'Change Photo' },
  acc_upload_hint: { vi: 'Tải ảnh lên từ thiết bị', en: 'Upload from device' },
  acc_adjust_btn_show: { vi: 'Căn chỉnh ảnh (Zoom / Vị trí)', en: 'Adjust Photo (Zoom / Position)' },
  acc_adjust_btn_hide: { vi: 'Ẩn bộ căn chỉnh', en: 'Hide Adjuster' },
  acc_adjust_drag_hint: { vi: 'Kéo rê trên ảnh để dịch vị trí', en: 'Drag photo to reposition' },
  acc_adjust_vert: { vi: 'Căn dọc:', en: 'Vertical:' },
  acc_adjust_horiz: { vi: 'Căn ngang:', en: 'Horizontal:' },
  acc_adjust_reset: { vi: 'Đặt lại', en: 'Reset' },
  acc_adjust_apply: { vi: 'Áp dụng căn chỉnh', en: 'Apply Crop' },
  acc_preset_hint: { vi: 'Gợi ý ảnh:', en: 'Preset avatars:' },
  acc_name_label: { vi: 'Họ và tên', en: 'Full Name' },
  acc_name_placeholder: { vi: 'Nhập họ và tên của bạn...', en: 'Enter your full name...' },
  acc_email_label: { vi: 'Địa chỉ Email', en: 'Email Address' },
  acc_phone_label: { vi: 'Số điện thoại liên hệ', en: 'Contact Phone Number' },
  acc_phone_placeholder: { vi: 'Ví dụ: 0988 123 456', en: 'e.g. +84 988 123 456' },
  acc_save_success: { vi: 'Đã cập nhật thông tin & ảnh đại diện thành công!', en: 'Profile information & avatar updated successfully!' },
  acc_btn_save: { vi: 'Lưu Thay Đổi', en: 'Save Changes' },
  acc_btn_logout: { vi: 'Đăng xuất', en: 'Log Out' },

  // Bookings List Page (/bookings)
  bk_list_badge: { vi: 'Hồ Sơ Đơn Hàng', en: 'Booking Portfolio' },
  bk_list_title: { vi: 'Đơn Của Tôi', en: 'My Bookings' },
  bk_list_desc: {
    vi: 'Theo dõi tình trạng giữ chỗ, thời hạn thanh toán và lịch sử các chuyến du ngoạn.',
    en: 'Track seat reservation status, payment windows, and journey history.',
  },
  bk_empty_title: { vi: 'Bạn chưa có đơn đặt tour nào', en: 'You have no tour bookings yet' },
  bk_empty_desc: {
    vi: 'Hãy khám phá các danh thắng và điểm đến hấp dẫn trên khắp 3 miền Việt Nam để bắt đầu chuyến đi của bạn.',
    en: 'Explore stunning heritage destinations across Vietnam to embark on your next trip.',
  },
  bk_explore_now: { vi: 'Khám phá tour ngay', en: 'Explore Tours Now' },
  bk_code_prefix: { vi: 'Mã:', en: 'ID:' },
  bk_dep_prefix: { vi: 'Khởi hành:', en: 'Departure:' },
  bk_created_prefix: { vi: 'Tạo lúc:', en: 'Created:' },
  bk_total_price: { vi: 'Tổng tiền', en: 'Total Amount' },
  bk_btn_cancel: { vi: 'Hủy đơn', en: 'Cancel Booking' },
  bk_btn_pay: { vi: 'Thanh toán', en: 'Pay Now' },
  bk_btn_detail: { vi: 'Chi tiết', en: 'Details' },
  bk_cancel_modal_title: { vi: 'Xác Nhận Hủy Đơn Đặt Chỗ', en: 'Confirm Booking Cancellation' },
  bk_cancel_modal_warning: {
    vi: 'Bạn có chắc chắn muốn hủy đơn này không? Kho chỗ và vé đã giữ sẽ được giải phóng ngay lập tức.',
    en: 'Are you sure you want to cancel this booking? Reserved seats and tickets will be released immediately.',
  },
  bk_cancel_reason_label: { vi: 'Chọn hoặc nhập lý do hủy:', en: 'Select or enter cancellation reason:' },
  bk_cancel_reason_placeholder: { vi: 'Nhập lý do chi tiết...', en: 'Enter detailed reason...' },
  bk_cancel_btn_close: { vi: 'Đóng lại', en: 'Close' },
  bk_cancel_btn_confirm: { vi: 'Xác Nhận Hủy Đơn', en: 'Confirm Cancellation' },
  bk_cancelling: { vi: 'Đang hủy...', en: 'Cancelling...' },

  // Booking Details & Payment Page (/bookings/[id])
  bk_detail_badge: { vi: 'Chi Tiết Đơn Hàng', en: 'Booking Details' },
  bk_detail_back: { vi: 'Danh sách đơn', en: 'All Bookings' },
  bk_detail_not_found: { vi: 'Không tìm thấy thông tin đơn hàng', en: 'Booking Not Found' },
  bk_detail_not_found_desc: {
    vi: 'Mã đơn không tồn tại hoặc bạn không có quyền truy cập.',
    en: 'This booking ID does not exist or you do not have permission to view it.',
  },
  bk_detail_retry: { vi: 'Thử lại', en: 'Retry' },
  bk_status_pending_title: { vi: 'Chờ Thanh Toán — Khóa Chỗ An Toàn Trong 15 Phút', en: 'Pending Payment — 15-Minute Safe Seat Lock' },
  bk_status_pending_sub: {
    vi: 'Vui lòng chọn phương thức thanh toán trực tiếp hoặc trực tuyến bên dưới.',
    en: 'Please select a direct or online payment method below.',
  },
  bk_status_remaining: { vi: 'Còn lại', en: 'Time Left' },
  bk_status_confirmed_title: { vi: 'Đã Xác Nhận Đơn Hàng — Thanh Toán Trực Tiếp', en: 'Booking Confirmed — Direct Payment' },
  bk_status_confirmed_sub: {
    vi: 'Đơn đặt tour của Quý khách đã được bảo lưu thành công trên hệ thống. Quý khách vui lòng thanh toán trực tiếp tại văn phòng Delta Travel hoặc cho Hướng dẫn viên đón đoàn tại điểm hẹn trước giờ khởi hành.',
    en: 'Your tour reservation has been successfully confirmed. Please pay in cash/card at any Delta Travel office or directly to your Tour Leader prior to departure.',
  },
  bk_status_paid_title: { vi: 'Đã Thanh Toán Thành Công', en: 'Payment Succeeded' },
  bk_status_paid_sub: {
    vi: 'Đơn hàng đã được thanh toán thành công. Chuyên viên Delta Travel sẽ liên hệ gửi vé điện tử trước ngày khởi hành.',
    en: 'Payment completed successfully. A Delta Travel concierge specialist will send your e-tickets prior to departure.',
  },
  bk_status_cancelled_title: { vi: 'Đơn Đặt Chỗ Đã Hủy', en: 'Reservation Cancelled' },
  bk_status_cancelled_sub: {
    vi: 'Kho chỗ đã được giải phóng. Quý khách có thể tìm kiếm và đặt chuyến đi mới bất kỳ lúc nào.',
    en: 'Reserved seats have been released. You may explore and book a new journey at any time.',
  },
  bk_reason_prefix: { vi: 'Lý do:', en: 'Reason:' },
  bk_default_cancel_reason: {
    vi: 'Người dùng yêu cầu hủy đơn hoặc quá thời hạn thanh toán.',
    en: 'User requested cancellation or payment window expired.',
  },
  bk_itinerary_title: { vi: 'Hành Trình Khởi Hành', en: 'Departure Itinerary' },
  bk_dep_date_label: { vi: 'Ngày khởi hành', en: 'Departure Date' },
  bk_guest_count_label: { vi: 'Số lượng khách', en: 'Passenger Count' },
  bk_adult_unit: { vi: 'Người lớn', en: 'Adults' },
  bk_child_unit: { vi: 'Trẻ em', en: 'Children' },
  bk_financial_breakdown: { vi: 'Chi tiết dòng tiền', en: 'Price Breakdown' },
  bk_ticket_adult: { vi: 'Vé người lớn', en: 'Adult ticket' },
  bk_ticket_child: { vi: 'Vé trẻ em', en: 'Child ticket' },
  bk_rep_info: { vi: 'Thông Tin Người Đại Diện', en: 'Contact Representative' },
  bk_rep_name: { vi: 'Họ tên', en: 'Full Name' },
  bk_rep_email: { vi: 'Email', en: 'Email' },
  bk_rep_phone: { vi: 'Số điện thoại', en: 'Phone' },
  bk_cancel_box_title: { vi: 'Hủy Đơn Đặt Chỗ', en: 'Cancel Booking' },
  bk_cancel_box_desc: {
    vi: 'Nếu thay đổi kế hoạch chuyến đi, Quý khách có thể yêu cầu hủy đơn để giải phóng chỗ nhanh chóng.',
    en: 'If your travel plans change, you can cancel this reservation to quickly release seats.',
  },
  bk_cancel_box_btn: { vi: 'Hủy Đơn Này', en: 'Cancel This Booking' },
  bk_btn_delete: { vi: 'Xóa đơn hàng', en: 'Delete Booking' },
  bk_deleting: { vi: 'Đang xóa đơn...', en: 'Deleting booking...' },
  bk_delete_modal_title: { vi: 'Xác Nhận Xóa Đơn Hàng', en: 'Confirm Booking Deletion' },
  bk_delete_modal_desc: {
    vi: 'Hành động này sẽ xóa vĩnh viễn đơn hàng đã hủy khỏi danh sách của bạn. Bạn không thể hoàn tác thao tác này.',
    en: 'This action will permanently delete this cancelled booking from your account. This action cannot be undone.',
  },
  bk_delete_box_title: { vi: 'Xóa Đơn Khỏi Tài Khoản', en: 'Delete Booking from Account' },
  bk_delete_box_desc: {
    vi: 'Đơn này đã được hủy thành công. Quý khách có thể xóa hoàn toàn khỏi danh sách lưu trữ.',
    en: 'This reservation has been cancelled. You can permanently remove it from your records.',
  },
  admin_portal_btn: { vi: 'Vào Trang Quản Trị Hệ Thống (Admin)', en: 'Access Admin Dashboard' },
  bk_total_summary: { vi: 'Tổng thanh toán', en: 'Total Payment' },
  bk_status_label: { vi: 'Trạng thái:', en: 'Status:' },
  bk_payment_method_label: { vi: 'Phương Thức Thanh Toán', en: 'Payment Method' },
  bk_pay_direct_label: { vi: 'Thanh toán trực tiếp (Tại quầy / Cho HDV)', en: 'Direct Payment (At Office / To Tour Leader)' },
  bk_pay_direct_desc: {
    vi: 'Thanh toán bằng tiền mặt hoặc thẻ tại văn phòng Delta Travel (Hà Nội, Đà Nẵng, TP.HCM) hoặc cho Hướng dẫn viên khi đón tour.',
    en: 'Pay by cash or card at Delta Travel offices (Hanoi, Da Nang, HCMC) or directly to the Tour Leader upon tour pickup.',
  },
  bk_pay_vnpay_label: { vi: 'VNPay QR / Thẻ ATM & Quốc tế', en: 'VNPay QR / ATM & Credit Cards' },
  bk_pay_vnpay_desc: {
    vi: 'Quét mã QR từ 40+ ứng dụng ngân hàng và ví điện tử VNPAY tiện lợi.',
    en: 'Scan QR with 40+ banking apps and international cards via VNPay.',
  },
  bk_pay_momo_label: { vi: 'Ví MoMo', en: 'MoMo E-Wallet' },
  bk_pay_momo_desc: {
    vi: 'Thanh toán siêu tốc qua ứng dụng MoMo an toàn tuyệt đối.',
    en: 'Instant and secure payment via MoMo mobile app.',
  },
  bk_pay_zalopay_label: { vi: 'Ví ZaloPay', en: 'ZaloPay E-Wallet' },
  bk_pay_zalopay_desc: {
    vi: 'Xác thực thanh toán liền mạch trong hệ sinh thái Zalo.',
    en: 'Seamless and authenticated payment in Zalo ecosystem.',
  },
  bk_confirm_direct: { vi: 'Xác Nhận Thanh Toán Trực Tiếp', en: 'Confirm Direct Payment' },
  bk_confirming: { vi: 'Đang xác nhận...', en: 'Confirming...' },
  bk_connecting_gateway: { vi: 'Đang kết nối cổng...', en: 'Connecting to gateway...' },
  bk_pay_via: { vi: 'Thanh toán qua', en: 'Pay via' },
  bk_office_network: { vi: 'Hệ thống văn phòng Delta Travel:', en: 'Delta Travel Office Network:' },
  bk_office_locations: {
    vi: 'Hà Nội (12 Tràng Thi), Đà Nẵng (58 Bạch Đằng), TP.HCM (88 Nguyễn Huệ).',
    en: 'Hanoi (12 Trang Thi), Da Nang (58 Bach Dang), HCMC (88 Nguyen Hue).',
  },
  bk_hotline_support: {
    vi: 'Hỗ trợ 24/7 qua tổng đài 1900 6868 để giải đáp mọi thắc mắc và hướng dẫn thanh toán.',
    en: '24/7 Concierge Hotline 1900 6868 for inquiries and payment assistance.',
  },
  bk_status_pending_label: { vi: 'CHỜ THANH TOÁN', en: 'PENDING PAYMENT' },
  bk_status_paid_label: { vi: 'ĐÃ THANH TOÁN', en: 'PAID' },
  bk_status_confirmed_label: { vi: 'ĐÃ XÁC NHẬN', en: 'CONFIRMED' },
  bk_status_completed_label: { vi: 'HOÀN THÀNH', en: 'COMPLETED' },
  bk_status_cancelled_label: { vi: 'ĐÃ HỦY', en: 'CANCELLED' },

  // Checkout Page (/checkout/[scheduleId])
  chk_shell_badge: { vi: 'ĐẶT CHỖ TRỰC TUYẾN', en: 'ONLINE RESERVATION' },
  chk_shell_title: { vi: 'Xác Nhận Thông Tin & Khóa Chỗ', en: 'Review Information & Lock Seats' },
  chk_shell_desc: {
    vi: 'Hệ thống giữ chỗ trong 15 phút. Bạn có thể chọn thanh toán trực tiếp hoặc trực tuyến.',
    en: 'System holds seats for 15 minutes. Choose direct or online payment.',
  },
  chk_passenger_section: { vi: 'Số Lượng Hành Khách', en: 'Passenger Configuration' },
  chk_adult_desc: { vi: 'Từ 12 tuổi trở lên', en: '12 years and older' },
  chk_child_desc: { vi: 'Dưới 12 tuổi', en: 'Under 12 years old' },
  chk_realtime_seats: { vi: 'Kho chỗ khả dụng thời gian thực:', en: 'Real-time seat availability:' },
  chk_cant_check_seats: { vi: 'Chưa kiểm tra được chỗ', en: 'Unable to check seats' },
  chk_checking_seats: { vi: 'Đang kiểm tra kho chỗ...', en: 'Checking seat inventory...' },
  chk_remaining_seats: { vi: 'Còn lại', en: 'Remaining' },
  chk_sold_out: { vi: 'Đã hết chỗ', en: 'Sold out' },
  chk_seat_exceeded_detail: {
    vi: 'Số lượng khách vượt quá số chỗ khả dụng. Vui lòng giảm số người.',
    en: 'Passenger count exceeds available seats. Please adjust party size.',
  },
  chk_contact_section: { vi: 'Thông Tin Người Liên Hệ', en: 'Contact Information' },
  chk_contact_sub: {
    vi: 'Thông tin dùng để nhận mã đơn, hóa đơn và vé máy bay/du thuyền.',
    en: 'Used for reservation codes, receipts, and flight/cruise tickets.',
  },
  chk_rep_name_label: { vi: 'Họ và tên người đại diện *', en: 'Full name of representative *' },
  chk_rep_email_label: { vi: 'Địa chỉ Email *', en: 'Email Address *' },
  chk_rep_phone_label: { vi: 'Số điện thoại liên hệ *', en: 'Contact Phone Number *' },
  chk_phone_format_hint: { vi: 'Định dạng: 09... hoặc +84... (10 số)', en: 'Format: 09... or +84... (10 digits)' },
  chk_security_note: { vi: 'Bảo mật dữ liệu cá nhân & Giao dịch an toàn', en: 'Personal data encryption & secure transaction' },
  chk_summary_section: { vi: 'Tóm Tắt Giữ Chỗ', en: 'Reservation Summary' },
  chk_departure_prefix: { vi: 'Khởi hành:', en: 'Departure:' },
  chk_dep_location: { vi: 'Xuất phát tại Việt Nam', en: 'Departing from Vietnam' },
  chk_tax_included: { vi: 'Đã bao gồm thuế & bảo hiểm', en: 'Taxes & travel insurance included' },
  chk_calculating: { vi: 'Đang tính...', en: 'Calculating...' },
  chk_hold_rule_title: { vi: 'Quy định giữ chỗ 15 phút', en: '15-minute seat hold policy' },
  chk_hold_rule_desc: {
    vi: 'Sau khi nhấn nút xác nhận, hệ thống sẽ cấp mã đơn và giữ chỗ trong vòng 15 phút để bạn chọn cổng thanh toán an toàn.',
    en: 'Upon confirmation, the system will allocate your booking ID and hold seats for 15 minutes for secure payment.',
  },
  chk_available_seats: { vi: 'Chỗ trống còn lại:', en: 'Available seats:' },
  chk_seats_unit: { vi: 'chỗ', en: 'seats' },
  chk_btn_hold: { vi: 'Xác nhận giữ chỗ (15 phút)', en: 'Confirm seat reservation (15 mins)' },
  chk_holding: { vi: 'Đang khởi tạo đơn giữ chỗ...', en: 'Creating reservation...' },
  chk_seat_exceeded: {
    vi: 'Số khách vượt quá số chỗ còn lại trên lịch khởi hành này.',
    en: 'Number of passengers exceeds available seats for this schedule.',
  },
  chk_loading_page: { vi: 'Đang chuẩn bị trang đặt tour...', en: 'Preparing reservation page...' },

  // Preloader
  preloader_skip: { vi: 'Khám phá ngay', en: 'Explore Now' },
  preloader_collection: { vi: 'BỘ SƯU TẬP 2026', en: '2026 COLLECTION' },
  preloader_heritage_tag: { vi: 'HÀNH TRÌNH DI SẢN 3 MIỀN VIỆT NAM', en: '3-REGION VIETNAM HERITAGE EXPEDITIONS' },
  preloader_headline: { vi: 'NHỮNG HÀNH TRÌNH ĐỘC BẢN', en: 'BESPOKE SIGNATURE JOURNEYS' },
  preloader_desc: {
    vi: 'Khám phá tinh hoa cảnh sắc Việt Nam từ biển đảo kỳ vĩ đến đỉnh trời mây ngàn.',
    en: 'Discover the timeless elegance of Vietnam from majestic bays to cloud-veiled peaks.',
  },
  preloader_status_1: { vi: 'Khởi tạo tọa độ không gian & kết nối vệ tinh...', en: 'Initializing coordinates & satellite connection...' },
  preloader_status_2: { vi: 'Định vị bán đảo Đông Dương & dải đất hình chữ S...', en: 'Positioning Indochina peninsula & Vietnam S-shaped territory...' },
  preloader_status_3: { vi: 'Nạp các tuyệt tác di sản 3 miền Bắc - Trung - Nam...', en: 'Loading 3-region heritage collections...' },
  preloader_status_4: { vi: 'Chuẩn bị hoàn tất không gian số...', en: 'Finalizing digital experience...' },
  preloader_status_ready: { vi: 'Chào mừng Quý khách đến với DELTA TRAVEL', en: 'Welcome to DELTA TRAVEL' },
  preloader_status_frozen: { vi: 'Đã định vị thành công. Đang tải nốt những dữ liệu cuối cùng...', en: 'Positioned successfully. Loading final assets...' },
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
