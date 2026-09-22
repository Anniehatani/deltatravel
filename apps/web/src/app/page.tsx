'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { tourApi } from '@/lib/api';
import type { Tour } from '@tour/shared';
import { Scroll3DHero } from '@/components/scroll-3d-hero';
import { formatVND } from '@/lib/format';
import { useLanguage } from '@/providers/language-provider';
import { FALLBACK_TOURS, filterFallbackTours } from '@/lib/fallback-data';
import { getTourImage, getTourLuxuryTag } from '@/lib/tour-assets';
import { GiantScrollTypography } from '@/components/giant-scroll-typography';
import {
  MapPin,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Clock,
  Award,
  Sparkles,
  Star,
  Crown,
  Compass,
} from 'lucide-react';

// Apple-Grade Liquid Glass Tour Cards with scroll-triggered staggered animations
function TourCardsGrid({ tours, t }: { tours: Tour[]; t: (k: string) => string }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [visibleSet, setVisibleSet] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.idx);
            if (!isNaN(idx)) {
              setVisibleSet((prev) => {
                const next = new Set(prev);
                next.add(idx);
                return next;
              });
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' },
    );

    const cards = grid.querySelectorAll('[data-idx]');
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [tours]);

  const getTourPrice = (tour: Tour): number => {
    const match = FALLBACK_TOURS.find((f) => f.id === tour.id || f.slug === tour.slug);
    return match ? match.adultPrice : 2450000;
  };

  return (
    <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {tours.map((tour, i) => {
        const isVisible = visibleSet.has(i);
        const price = getTourPrice(tour);
        const luxuryTag = getTourLuxuryTag(tour);
        const heroImage = getTourImage(tour);

        return (
          <Link
            key={tour.id}
            href={`/tours/${tour.id}`}
            data-idx={i}
            className="group relative flex flex-col rounded-[26px] overflow-hidden liquid-glass-card hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.14)] transition-all duration-500"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.97)',
              transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 0.08}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 0.08}s`,
            }}
          >
            {/* Hero Image with Cinematic Zoom Effect */}
            <div className="relative h-60 w-full overflow-hidden bg-neutral-900">
              <Image
                src={heroImage}
                alt={tour.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />

              {/* Luxury Tagline Badge */}
              <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full liquid-glass-badge px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-lg">
                <Sparkles className="h-3 w-3 text-amber-300" />
                <span>{luxuryTag}</span>
              </div>

              {/* Duration Badge — Liquid Glass */}
              <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-full liquid-glass-badge px-3 py-1 text-[11px] font-bold text-white shadow-lg">
                <Calendar className="h-3 w-3 text-white" />
                <span>
                  {tour.durationDays}N{Math.max(1, tour.durationDays - 1)}Đ
                </span>
              </div>

              {/* Destination Label */}
              <div className="absolute bottom-3.5 left-4 inline-flex items-center gap-1.5 text-white">
                <MapPin className="h-3.5 w-3.5 text-amber-300 drop-shadow-md" />
                <span className="text-xs font-black drop-shadow-md tracking-wide uppercase">
                  {tour.destination}
                </span>
              </div>

              {/* 5-Star Rating Pill */}
              <div className="absolute bottom-3.5 right-4 inline-flex items-center gap-1 text-[10px] font-black text-amber-300 liquid-glass-badge px-2.5 py-0.5 rounded-full">
                <Star className="h-3 w-3 fill-amber-300" />
                <span>5.0 Thượng Lưu</span>
              </div>
            </div>

            {/* Card Content Body */}
            <div className="flex flex-col flex-1 p-6 justify-between bg-white/95">
              <div>
                <h3 className="text-[16px] font-black text-black leading-snug line-clamp-2 group-hover:text-amber-900 transition-colors duration-300 tracking-tight">
                  {tour.title}
                </h3>

                <p className="mt-3 text-xs leading-relaxed text-neutral-600 line-clamp-3 font-normal">
                  {tour.description}
                </p>
              </div>

              {/* Bottom Bar: Price & Liquid Glass CTA */}
              <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-neutral-600 block tracking-wider">
                    Đặc Quyền Từ
                  </span>
                  <span className="text-sm font-black text-black tracking-tight">
                    {formatVND(price)}
                    <span className="text-[10px] font-medium text-neutral-600 ml-1">/ khách</span>
                  </span>
                </div>

                <span className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-[11px] font-black text-white group-hover:bg-neutral-800 transition-all duration-300 group-hover:gap-2.5 shadow-sm">
                  <span>Chiêm Ngưỡng</span>
                  <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1 text-amber-300" />
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function Home() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>('');
  const [allTours, setAllTours] = useState<Tour[]>(() => FALLBACK_TOURS);
  const [loading, setLoading] = useState(false);

  const REGIONS = [
    {
      id: 'bac',
      name: 'Miền Bắc',
      tagline: 'KỲ QUAN NON NƯỚC & NÓC NHÀ ĐÔNG DƯƠNG',
      description: 'Hạ Long vịnh kỳ quan đá vôi nghìn năm, biển mây Fansipan bồng bềnh và quần thể Tràng An linh thiêng.',
      image: '/tour-ha-long.jpg',
      destinations: ['Hạ Long', 'Sa Pa', 'Ninh Bình', 'Hà Nội'],
      href: '/tours?region=bac',
    },
    {
      id: 'trung',
      name: 'Miền Trung',
      tagline: 'HOÀNG TRIỀU CỐ ĐÔ & BIỂN NGỌC BÍCH',
      description: 'Kiệt tác Cầu Vàng Bà Nà Hills, lồng đèn phố cổ Hội An và di sản Đại Nội Huế trầm mặc hữu tình.',
      image: '/tour-da-nang.jpg',
      destinations: ['Đà Nẵng', 'Hội An', 'Huế', 'Nha Trang'],
      href: '/tours?region=trung',
    },
    {
      id: 'nam',
      name: 'Miền Nam',
      tagline: 'THIÊN ĐƯỜNG ĐẢO NGỌC & MIỆT VƯỜN SÔNG NƯỚC',
      description: 'Bờ cát trắng biển xanh ngọc Phú Quốc, rực rỡ chợ nổi Cái Răng miền Tây và đỉnh thiêng mây ngàn Tây Ninh.',
      image: '/tour-phu-quoc.jpg',
      destinations: ['Phú Quốc', 'Cần Thơ', 'Tây Ninh', 'Côn Đảo'],
      href: '/tours?region=nam',
    },
  ];

  useEffect(() => {
    let active = true;
    tourApi
      .list()
      .then((res) => {
        if (active && res.items.length > 0) {
          setAllTours(res.items);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const displayedTours = activeTab
    ? allTours.filter((tour) => {
        const fb = FALLBACK_TOURS.find((f) => f.id === tour.id || f.slug === tour.slug);
        return fb ? fb.region === activeTab : true;
      })
    : allTours;

  return (
    <div className="bg-white text-black">
      {/* High-Performance 3D Scroll Scrubber (Search Form removed, pure Liquid Glass) */}
      <Scroll3DHero />

      {/* Content wrapper with overflow-hidden to protect parallax typography without breaking sticky */}
      <div className="relative overflow-hidden">
        {/* ─── Giant Parallax Typography 1 ─── */}
        <div className="relative pt-6 pb-2 pointer-events-none -z-0">
          <GiantScrollTypography
            text="VIETNAM HERITAGE"
            direction="left"
            speed={0.28}
            outline={true}
          />
        </div>

      {/* ─── 3 Regions Section — Upgraded with Cinematic Photos & Liquid Glass ─── */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/60 bg-amber-50/50 px-4 py-1 text-xs font-black uppercase tracking-widest text-neutral-800 mb-3 backdrop-blur-md">
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span>TAM GIÁC DI SẢN • ARCHITECTURE & NATURE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-black tracking-tight uppercase leading-tight">
            Ba Phân Vùng Tuyệt Tác Việt Nam
          </h2>
          <p className="mt-4 text-xs sm:text-sm font-medium text-neutral-600 leading-relaxed max-w-2xl mx-auto">
            Mỗi vùng miền là một bản hòa ca giữa thiên nhiên nguyên sơ và tinh hoa di sản, được kiến tạo để mang lại trải nghiệm nghỉ dưỡng xa hoa trọn vẹn nhất.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {REGIONS.map((reg) => (
            <Link
              key={reg.id}
              href={reg.href}
              className="group relative flex flex-col rounded-[28px] overflow-hidden liquid-glass-card hover:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.18)] transition-all duration-500 h-[420px]"
            >
              {/* Background Cover Image with Zoom Effect */}
              <div className="absolute inset-0 z-0">
                <Image
                  src={reg.image}
                  alt={reg.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                />
                {/* Multi-layer luxury gradient scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
              </div>

              {/* Card Content atop Liquid Glass Scrim */}
              <div className="relative z-10 flex flex-col justify-between h-full p-7 text-white">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="liquid-glass-badge text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full text-white">
                      {reg.name}
                    </span>
                    <span className="h-8 w-8 rounded-full liquid-glass-badge flex items-center justify-center text-white transition-transform duration-300 group-hover:translate-x-1 group-hover:bg-white group-hover:text-black">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>

                  <span className="text-[10px] font-black tracking-wider text-amber-300 uppercase block mb-1">
                    {reg.tagline}
                  </span>
                  <h3 className="text-2xl font-black tracking-tight text-white drop-shadow-md">
                    {reg.name}
                  </h3>
                  <p className="mt-2.5 text-xs leading-relaxed text-white/80 font-normal line-clamp-3">
                    {reg.description}
                  </p>
                </div>

                {/* Destinations pill tags */}
                <div className="pt-4 border-t border-white/20 flex flex-wrap gap-1.5">
                  {reg.destinations.map((d) => (
                    <span
                      key={d}
                      className="text-[10px] font-bold liquid-glass-badge px-2.5 py-1 rounded-full text-white/90"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Giant Parallax Typography 2 ─── */}
      <div className="relative pt-6 pb-2 pointer-events-none -z-0">
        <GiantScrollTypography
          text="HAUTE EXPEDITIONS"
          direction="right"
          speed={0.24}
          outline={false}
        />
      </div>

      {/* ─── Featured Tours Section — Apple Liquid Glass with All Destination Images ─── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.25em] text-neutral-600 mb-2">
              <span className="w-8 h-px bg-amber-400" />
              HAUTE COLLECTION • BỘ SƯU TẬP TINH HOA
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-black mt-1 uppercase tracking-tight">
              Những Hành Trình Độc Bản 2026
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-neutral-600 max-w-xl">
              Tuyển tập 09 kiệt tác hành trình trọn gói được thiết kế tỉ mỉ bởi các chuyên gia lữ hành hàng đầu.
            </p>
          </div>

          {/* Region Filter Tabs */}
          <div className="flex items-center gap-2 p-1.5 rounded-full bg-white/70 backdrop-blur-xl border border-white/80 shadow-sm flex-wrap">
            {[
              { id: '', label: 'Tất Cả (9)' },
              { id: 'bac', label: 'Miền Bắc' },
              { id: 'trung', label: 'Miền Trung' },
              { id: 'nam', label: 'Miền Nam' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-black transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-black text-white shadow-sm'
                    : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-[26px] border border-neutral-200 overflow-hidden bg-white">
                <div className="h-60 bg-neutral-200" />
                <div className="p-6 space-y-3">
                  <div className="h-4 w-1/3 bg-neutral-200 rounded" />
                  <div className="h-6 w-3/4 bg-neutral-200 rounded" />
                  <div className="h-16 bg-neutral-200 rounded" />
                  <div className="h-9 bg-neutral-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <TourCardsGrid tours={displayedTours} t={t} />
        )}

        <div className="mt-12 text-center">
          <Link
            href="/tours"
            className="group inline-flex items-center gap-3 rounded-full bg-black px-8 py-4 text-xs font-black uppercase tracking-wider text-white hover:bg-neutral-800 transition-all duration-300 shadow-lg hover:scale-105"
          >
            <span>Khám Phá Toàn Bộ Bộ Sưu Tập</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 text-amber-300" />
          </Link>
        </div>
      </section>

      {/* ─── Giant Parallax Typography 3 ─── */}
      <div className="relative pt-6 pb-2 pointer-events-none -z-0">
        <GiantScrollTypography
          text="TIMELESS PRIVÉ"
          direction="left"
          speed={0.2}
          outline={true}
        />
      </div>

      {/* ─── Brand Guarantees — Apple Liquid Glass Prism Cards ─── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-amber-600 mb-2">
            <Crown className="h-3 w-3 text-amber-500" />
            CHUẨN MỰC PHỤC VỤ HOÀNG GIA
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-black uppercase tracking-tight">
            Triết Lý Dịch Vụ DELTA PRIVÉ
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-neutral-600 leading-relaxed">
            Mỗi chi tiết đều được tinh chỉnh nhằm mang lại sự an tâm tuyệt đối và đặc quyền cao cấp nhất cho Quý khách.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="liquid-glass-card rounded-[26px] p-8">
            <div className="h-12 w-12 rounded-2xl bg-black text-white flex items-center justify-center mb-6 shadow-md">
              <ShieldCheck className="h-6 w-6 text-amber-300" />
            </div>
            <h3 className="text-base font-black text-black uppercase tracking-tight">
              Minh Bạch & Đặc Quyền Cao Cấp
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-neutral-600 font-normal">
              100% giá vé trọn gói minh bạch, không phí ẩn. Bao gồm dịch vụ đón tiễn hạng thương gia và bảo hiểm du lịch quốc tế tối đa.
            </p>
          </div>

          <div className="liquid-glass-card rounded-[26px] p-8">
            <div className="h-12 w-12 rounded-2xl bg-black text-white flex items-center justify-center mb-6 shadow-md">
              <Clock className="h-6 w-6 text-amber-300" />
            </div>
            <h3 className="text-base font-black text-black uppercase tracking-tight">
              Quản Gia Lữ Hành Riêng 24/7
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-neutral-600 font-normal">
              Đội ngũ chuyên viên túc trực hỗ trợ tức thì mọi nhu cầu riêng biệt, từ yêu cầu ẩm thực đặc biệt đến sắp xếp nhiếp ảnh gia cá nhân.
            </p>
          </div>

          <div className="liquid-glass-card rounded-[26px] p-8">
            <div className="h-12 w-12 rounded-2xl bg-black text-white flex items-center justify-center mb-6 shadow-md">
              <Award className="h-6 w-6 text-amber-300" />
            </div>
            <h3 className="text-base font-black text-black uppercase tracking-tight">
              Kiểm Tuyển Chuẩn 5 Sao
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-neutral-600 font-normal">
              Đối tác hàng không cao cấp, resort và du thuyền được kiểm định khắt khe nhất để đảm bảo chất lượng hoàn mỹ trong từng khoảnh khắc.
            </p>
          </div>
        </div>
      </section>

      {/* ─── VIP Consultation Atelier Banner ─── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-24">
        <div className="relative rounded-[32px] overflow-hidden liquid-glass-card p-10 md:p-14 border border-white/90 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.12)]">
          {/* Subtle decorative radial backdrop */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-amber-600 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                BESPOKE TRAVEL CONCIERGE
              </span>
              <h2 className="text-2xl md:text-4xl font-black text-black uppercase tracking-tight leading-tight">
                Đặc Quyền Thiết Kế Hành Trình Riêng Biệt
              </h2>
              <p className="mt-3 text-xs md:text-sm text-neutral-600 leading-relaxed font-normal">
                Trò chuyện cùng AI Concierge hoặc Chuyên gia Lữ hành cao cấp để may đo lịch trình độc bản theo sở thích, số ngày và ngân sách riêng của gia đình Quý khách.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 shrink-0">
              <Link
                href="/assistant"
                className="rounded-full bg-black text-white hover:bg-neutral-800 px-7 py-3.5 text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-md hover:scale-105 flex items-center gap-2"
              >
                <span>Hỏi Trợ Lý AI Riêng</span>
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              </Link>
              <Link
                href="/tours"
                className="liquid-glass-pill text-black hover:bg-white px-7 py-3.5 text-xs font-black uppercase tracking-wider transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                <span>Xem Tất Cả Tuyệt Tác</span>
                <ArrowRight className="h-3.5 w-3.5 text-black" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
