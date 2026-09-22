import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/providers/auth-provider';
import { LanguageProvider } from '@/providers/language-provider';
import { Nav } from '@/components/nav';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Clock, Award, Phone, Mail, MapPin } from 'lucide-react';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'DELTA TRAVEL | Du Lịch Việt Nam 3 Miền', template: '%s | DELTA TRAVEL' },
  description: 'DELTA TRAVEL — Đặt tour du lịch nội địa trọn gói khắp 3 miền Việt Nam. Lịch trình chu đáo, giá vé minh bạch, hỗ trợ tận tâm 24/7.',
  icons: {
    icon: '/favicon_logo_delta.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={beVietnamPro.variable}>
      <body className="min-h-screen flex flex-col bg-white text-black selection:bg-black selection:text-white">
        <LanguageProvider>
          <AuthProvider>
            <Nav />
            <main className="flex-1 bg-white">{children}</main>
            
            <footer className="mt-20 border-t border-black bg-white pt-14 pb-12">
              <div className="mx-auto max-w-7xl px-6 lg:px-8">
                {/* Trust Badges - Strict Monochrome */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 border-b border-black/10">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg border border-black bg-white flex items-center justify-center text-black">
                      <ShieldCheck className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h4 className="font-bold text-black text-sm">Chất Lượng Đảm Bảo</h4>
                      <p className="text-xs text-neutral-600 mt-0.5">100% Tour tuyển chọn chu đáo, hướng dẫn tận tình</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg border border-black bg-white flex items-center justify-center text-black">
                      <Clock className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h4 className="font-bold text-black text-sm">Giữ Chỗ Tiện Lợi</h4>
                      <p className="text-xs text-neutral-600 mt-0.5">Khóa chỗ trực tuyến an toàn trong 15 phút</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg border border-black bg-white flex items-center justify-center text-black">
                      <Award className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h4 className="font-bold text-black text-sm">Hỗ Trợ Tận Tâm 24/7</h4>
                      <p className="text-xs text-neutral-600 mt-0.5">Đồng hành cùng bạn trên mọi nẻo đường quê hương</p>
                    </div>
                  </div>
                </div>

                {/* Main Footer Links */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10 py-12">
                  <div className="md:col-span-1">
                    <div className="flex items-center gap-2.5">
                      <div className="relative h-7 w-7 flex items-center justify-center">
                        <Image
                          src="/favicon_logo_delta.png"
                          alt="DELTA TRAVEL"
                          width={24}
                          height={24}
                          className="object-contain"
                        />
                      </div>
                      <span className="text-lg font-black tracking-wider text-black">
                        DELTA TRAVEL
                      </span>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-neutral-600">
                      Cùng người thân và gia đình khám phá trọn vẹn cảnh sắc kỳ vĩ, con người thân thiện và nét văn hóa đặc sắc của 3 miền đất nước.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-black">Khám Phá 3 Miền</h3>
                    <ul className="mt-4 space-y-2.5 text-sm font-medium text-black">
                      <li><Link href="/tours?region=bac" className="hover:underline underline-offset-4">Tour Miền Bắc</Link></li>
                      <li><Link href="/tours?region=trung" className="hover:underline underline-offset-4">Tour Miền Trung</Link></li>
                      <li><Link href="/tours?region=nam" className="hover:underline underline-offset-4">Tour Miền Nam</Link></li>
                      <li><Link href="/assistant" className="hover:underline underline-offset-4">Trợ lý du lịch</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-black">Dịch Vụ & Đơn Hàng</h3>
                    <ul className="mt-4 space-y-2.5 text-sm font-medium text-black">
                      <li><Link href="/tours" className="hover:underline underline-offset-4">Tất cả tour</Link></li>
                      <li><Link href="/bookings" className="hover:underline underline-offset-4">Tra cứu đơn đã đặt</Link></li>
                      <li><Link href="/login" className="hover:underline underline-offset-4">Đăng nhập tài khoản</Link></li>
                      <li><Link href="/register" className="hover:underline underline-offset-4">Đăng ký thành viên</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-black">Liên Hệ Hỗ Trợ</h3>
                    <ul className="mt-4 space-y-2.5 text-sm font-medium text-black">
                      <li className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-black shrink-0" />
                        <span>Tổng đài: 1900 6868</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-black shrink-0" />
                        <span>hotro@deltatravel.vn</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-black shrink-0" />
                        <span>Hà Nội — Đà Nẵng — TP.HCM</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Bottom Copyright */}
                <div className="border-t border-black/10 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-neutral-500">
                  <p>© 2026 DELTA TRAVEL. Bảo lưu mọi quyền.</p>
                  <p className="mt-2 md:mt-0 font-medium text-black">
                    Du lịch Việt Nam an tâm, trọn vẹn và gần gũi.
                  </p>
                </div>
              </div>
            </footer>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
