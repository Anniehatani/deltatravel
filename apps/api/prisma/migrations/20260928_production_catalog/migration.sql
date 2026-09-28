-- Seed the first production catalog for DELTA TRAVEL.
-- Idempotent fixed UUIDs keep frontend assets and live API records aligned.

INSERT INTO "TOUR"
  ("id","slug","title","description","destination","countryCode","durationDays","status","createdAt","updatedAt")
VALUES
('a1000000-0000-4000-8000-000000000001','vinh-ha-long-du-thuyen-kayak','Vịnh Hạ Long — Trải Nghiệm Du Thuyền & Chèo Thuyền Kayak','Hành trình 2 ngày 1 đêm ngắm hoàng hôn trên vịnh, khám phá hang Sửng Sốt, chèo kayak tại hang Luồn và tắm biển đảo Ti Tốp.','Quảng Ninh','VN',2,'ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('a1000000-0000-4000-8000-000000000002','sa-pa-chinh-phuc-fansipan-cat-cat','Sa Pa — Chinh Phục Đỉnh Fansipan & Khám Phá Bản Cát Cát','Chiêm ngưỡng Fansipan, trải nghiệm cáp treo, khám phá bản Cát Cát và không gian văn hóa vùng cao Sa Pa.','Lào Cai','VN',3,'ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('a1000000-0000-4000-8000-000000000003','ninh-binh-trang-an-bai-dinh-hang-mua','Ninh Bình — Quần Thể Danh Thắng Tràng An & Chùa Bái Đính','Du thuyền Tràng An, tham quan chùa Bái Đính và leo Hang Múa ngắm toàn cảnh Tam Cốc.','Ninh Bình','VN',1,'ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('a1000000-0000-4000-8000-000000000004','da-nang-hoi-an-ba-na-hills-cau-vang','Đà Nẵng — Hội An — Cầu Vàng Bà Nà Hills','Khám phá Cầu Vàng Bà Nà Hills, phố cổ Hội An và bãi biển Mỹ Khê trong hành trình miền Trung.','Đà Nẵng','VN',4,'ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('a1000000-0000-4000-8000-000000000005','hue-co-do-dai-noi-ca-hue-song-huong','Cố Đô Huế — Đại Nội Hoàng Cung & Ca Huế Sông Hương','Tham quan Đại Nội, lăng Khải Định, lăng Tự Đức và trải nghiệm văn hóa Huế bên sông Hương.','Huế','VN',2,'ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('a1000000-0000-4000-8000-000000000006','nha-trang-bien-xanh-dao-diep-son','Nha Trang — Khám Phá Vịnh Biển San Hô & Đảo Điệp Sơn','Khám phá biển Nha Trang, đảo Điệp Sơn và trải nghiệm lặn ngắm san hô tại vùng biển Khánh Hòa.','Khánh Hòa','VN',3,'ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('a1000000-0000-4000-8000-000000000007','phu-quoc-dao-ngoc-lan-ngam-san-ho','Phú Quốc — Đảo Ngọc Thiên Đường & Câu Cá Ngắm Hoàng Hôn','Trải nghiệm cáp treo Hòn Thơm, lặn ngắm san hô quần đảo An Thới và khám phá Phú Quốc.','Kiên Giang','VN',3,'ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('a1000000-0000-4000-8000-000000000008','can-tho-cho-noi-cai-rang-miet-vuon','Cần Thơ — Chợ Nổi Cái Răng & Trải Nghiệm Miệt Vườn Sông Nước','Đón bình minh tại chợ nổi Cái Răng, khám phá miệt vườn Phong Điền và văn hóa sông nước Nam Bộ.','Cần Thơ','VN',2,'ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('a1000000-0000-4000-8000-000000000009','tay-ninh-nui-ba-den-toa-thanh','Tây Ninh — Chinh Phục Núi Bà Đen & Chiêm Bái Tòa Thánh','Đi cáp treo lên núi Bà Đen, ngắm cảnh Tây Ninh và tham quan Tòa Thánh trong hành trình một ngày.','Tây Ninh','VN',1,'ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "LICH_KHOI_HANH"
  ("id","tourId","departureAt","totalSeats","reservedSeats","adultPrice","childPrice","status")
VALUES
('b1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000001','2026-10-10T01:00:00Z',30,0,2450000,1650000,'OPEN'),
('b1000000-0000-4000-8000-000000000002','a1000000-0000-4000-8000-000000000002','2026-10-12T01:00:00Z',30,0,2850000,1950000,'OPEN'),
('b1000000-0000-4000-8000-000000000003','a1000000-0000-4000-8000-000000000003','2026-10-14T01:00:00Z',30,0,950000,650000,'OPEN'),
('b1000000-0000-4000-8000-000000000004','a1000000-0000-4000-8000-000000000004','2026-10-16T01:00:00Z',30,0,3650000,2450000,'OPEN'),
('b1000000-0000-4000-8000-000000000005','a1000000-0000-4000-8000-000000000005','2026-10-18T01:00:00Z',30,0,1850000,1250000,'OPEN'),
('b1000000-0000-4000-8000-000000000006','a1000000-0000-4000-8000-000000000006','2026-10-20T01:00:00Z',30,0,2950000,1950000,'OPEN'),
('b1000000-0000-4000-8000-000000000007','a1000000-0000-4000-8000-000000000007','2026-10-22T01:00:00Z',30,0,3450000,2350000,'OPEN'),
('b1000000-0000-4000-8000-000000000008','a1000000-0000-4000-8000-000000000008','2026-10-24T01:00:00Z',30,0,1650000,1100000,'OPEN'),
('b1000000-0000-4000-8000-000000000009','a1000000-0000-4000-8000-000000000009','2026-10-26T01:00:00Z',30,0,850000,550000,'OPEN')
ON CONFLICT ("id") DO NOTHING;
