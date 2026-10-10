import './globals.css'
import { Suspense } from 'react'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SiteChrome from '@/components/site/SiteChrome'
import RouteProgress from '@/components/site/RouteProgress'
import ThirdPartyScripts from '@/components/site/ThirdPartyScripts'
import ThemeProvider from '@/components/ThemeProvider'
import { AuthProvider } from '@/lib/AuthContext'
import { ProfileProvider } from '@/lib/ProfileContext'
import { SITE } from '@/lib/site'

// One variable font for everything (UI, headings, body). Dropping the second
// display face saves a font download on every page.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FBFBFD' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: 'matriXO — Workshops, hackathons and career programs for students',
    template: '%s · matriXO',
  },
  description: SITE.description,
  applicationName: 'matriXO',
  keywords: [
    'matriXO',
    'technical workshops',
    'hackathons',
    'bootcamps',
    'student events',
    'career programs',
    'coding workshops',
    'StudentVault',
    'student developer pack India',
  ],
  authors: [{ name: 'matriXO', url: SITE.url }],
  creator: 'matriXO',
  publisher: 'matriXO',
  category: 'education',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/brand/matrixo-app-icon.svg', type: 'image/svg+xml' },
      { url: '/brand/favicon-32.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: [{ url: '/brand/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'matriXO',
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    locale: SITE.locale,
    url: SITE.url,
    siteName: SITE.name,
    title: 'matriXO — Workshops, hackathons and career programs for students',
    description: SITE.description,
    images: [{ url: SITE.ogImage, width: 1200, height: 630, alt: 'matriXO' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'matriXO — Workshops, hackathons and career programs for students',
    description: SITE.description,
    images: [SITE.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE.url}/#organization`,
      name: SITE.name,
      url: SITE.url,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE.url}/brand/matrixo-app-icon-512.png`,
        width: 512,
        height: 512,
      },
      description: SITE.description,
      email: SITE.email,
      sameAs: [SITE.social.instagram, SITE.social.linkedin],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: SITE.email,
        url: `${SITE.url}/contact`,
        availableLanguage: ['English', 'Hindi', 'Telugu'],
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.name,
      inLanguage: 'en-IN',
      publisher: { '@id': `${SITE.url}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${SITE.url}/events?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          // Static, trusted content generated above.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <ThemeProvider defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <AuthProvider>
            <ProfileProvider>
              <Suspense fallback={null}>
                <RouteProgress />
              </Suspense>
              <SiteChrome header={<Navbar />} footer={<Footer />}>
                {children}
              </SiteChrome>
            </ProfileProvider>
          </AuthProvider>
        </ThemeProvider>
        <Toaster position="top-center" richColors closeButton />
        <ThirdPartyScripts />
      </body>
    </html>
  )
}
