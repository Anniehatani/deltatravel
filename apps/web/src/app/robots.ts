import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://delta-travel-web.onrender.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/bookings', '/checkout', '/payments/return', '/api/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
