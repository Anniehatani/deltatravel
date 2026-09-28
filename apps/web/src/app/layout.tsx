import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/providers/auth-provider';
import { LanguageProvider } from '@/providers/language-provider';
import { Nav } from '@/components/nav';

import { SiteFooter } from '@/components/footer';
import { AiAgentLauncher } from '@/components/ai-agent-launcher';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://delta-travel-web.onrender.com';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'DELTA TRAVEL | Du Lịch Việt Nam 3 Miền', template: '%s | DELTA TRAVEL' },
  description:
    'DELTA TRAVEL — Đặt tour du lịch nội địa trọn gói khắp 3 miền Việt Nam. Lịch trình chu đáo, giá vé minh bạch, hỗ trợ tận tâm 24/7.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: '/',
    siteName: 'DELTA TRAVEL',
    title: 'DELTA TRAVEL | Du Lịch Việt Nam 3 Miền',
    description:
      'Đặt tour nội địa Việt Nam với dữ liệu lịch khởi hành, giá và số chỗ từ hệ thống Delta Travel.',
  },
  twitter: {
    card: 'summary',
    title: 'DELTA TRAVEL | Du Lịch Việt Nam 3 Miền',
    description: 'Đặt tour nội địa Việt Nam cùng Delta Travel và AI Agent.',
  },
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
            <AiAgentLauncher />
            <SiteFooter />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
