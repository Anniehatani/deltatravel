'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Clock, Award, Phone, Mail, MapPin } from 'lucide-react';
import { useLanguage } from '@/providers/language-provider';

export function SiteFooter() {
  const pathname = usePathname();
  const { t } = useLanguage();

  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="border-t border-black/10 bg-white text-black mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value Props Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10 border-b border-black/10">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg border border-black bg-white flex items-center justify-center text-black">
              <ShieldCheck className="w-6 h-6 text-black" />
            </div>
            <div>
              <h4 className="font-bold text-black text-sm">{t('footer_trust_1_title')}</h4>
              <p className="text-xs text-neutral-600 mt-0.5">{t('footer_trust_1_desc')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg border border-black bg-white flex items-center justify-center text-black">
              <Clock className="w-6 h-6 text-black" />
            </div>
            <div>
              <h4 className="font-bold text-black text-sm">{t('footer_trust_2_title')}</h4>
              <p className="text-xs text-neutral-600 mt-0.5">{t('footer_trust_2_desc')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg border border-black bg-white flex items-center justify-center text-black">
              <Award className="w-6 h-6 text-black" />
            </div>
            <div>
              <h4 className="font-bold text-black text-sm">{t('footer_trust_3_title')}</h4>
              <p className="text-xs text-neutral-600 mt-0.5">{t('footer_trust_3_desc')}</p>
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
              {t('nav_tagline')}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-black">
              {t('footer_col_regions')}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm font-medium text-black">
              <li>
                <Link href="/tours?region=bac" className="hover:underline underline-offset-4">
                  {t('nav_region_bac')}
                </Link>
              </li>
              <li>
                <Link href="/tours?region=trung" className="hover:underline underline-offset-4">
                  {t('nav_region_trung')}
                </Link>
              </li>
              <li>
                <Link href="/tours?region=nam" className="hover:underline underline-offset-4">
                  {t('nav_region_nam')}
                </Link>
              </li>
              <li>
                <Link href="/assistant" className="hover:underline underline-offset-4">
                  {t('nav_assistant')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-black">
              {t('footer_col_services')}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm font-medium text-black">
              <li>
                <Link href="/tours" className="hover:underline underline-offset-4">
                  {t('nav_tours')}
                </Link>
              </li>
              <li>
                <Link href="/bookings" className="hover:underline underline-offset-4">
                  {t('nav_bookings')}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:underline underline-offset-4">
                  {t('nav_login')}
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:underline underline-offset-4">
                  {t('nav_register')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-black">
              {t('footer_col_contact')}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm font-medium text-black">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-black shrink-0" />
                <span>{t('footer_hotline_text')}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-black shrink-0" />
                <span>hotro@deltatravel.vn</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-black shrink-0" />
                <span>{t('footer_cities_text')}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="border-t border-black/10 pt-8 pb-12 flex flex-col md:flex-row items-center justify-between text-xs text-neutral-500">
          <p>{t('footer_rights_text')}</p>
          <p className="mt-2 md:mt-0 font-medium text-black">
            {t('footer_tagline_text')}
          </p>
        </div>
      </div>
    </footer>
  );
}
