import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Header, Footer } from '@/components/shell';
import './globals.css';
const manrope = localFont({
  src: '../public/fonts/manrope-latin.woff2',
  display: 'swap',
  variable: '--font-sans',
  weight: '200 800',
});
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl), alternates: { canonical: '/' } } : {}),
  title: {
    default: 'Ahmad Abulhawa — Creative Frontend & AI Developer',
    template: '%s — Ahmad Abulhawa',
  },
  description:
    'Ahmad Mohammad Abulhawa builds expressive interfaces and intelligent products. Explore cinematic frontend work, full-stack applications, and AI-powered experiences.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Ahmad Abulhawa',
    title: 'Thoughtful code. Unforgettable experiences.',
    description:
      'Creative frontend engineering, full-stack development, and AI-powered products by Ahmad Mohammad Abulhawa.',
    ...(siteUrl
      ? {
          images: [
            {
              url: '/social.png',
              width: 1200,
              height: 630,
              alt: 'Ahmad Abulhawa — Creative Frontend, Full-stack & AI Developer',
            },
          ],
        }
      : {}),
  },
  twitter: {
    card: 'summary_large_image',
    ...(siteUrl ? { images: ['/social.png'] } : {}),
  },
  robots: { index: true, follow: true },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={manrope.variable}>
      <body id="top">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
