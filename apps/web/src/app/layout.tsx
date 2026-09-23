import type { Metadata } from 'next';
import Script from 'next/script';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/providers/auth-provider';
import { LanguageProvider } from '@/providers/language-provider';
import { Nav } from '@/components/nav';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Clock, Award, Phone, Mail, MapPin } from 'lucide-react';

import { SiteFooter } from '@/components/footer';

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
            <SiteFooter />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
