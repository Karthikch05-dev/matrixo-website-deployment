const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  images: {
    // Serve modern formats; AVIF/WebP are 30-60% smaller than the source PNGs.
    formats: ['image/avif', 'image/webp'],
    // Cache optimized derivatives for a year instead of re-optimizing constantly.
    minimumCacheTTL: 31536000,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'tedxkprit.in' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' }, // profile & team photos
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google sign-in photos
    ],
  },
  experimental: {
    // These packages ship huge barrel files; without this every `import { FaUser }
    // from 'react-icons/fa'` drags in the whole icon set. Tree-shakes them per-import.
    optimizePackageImports: [
      'react-icons',
      'react-icons/fa',
      'lucide-react',
      'framer-motion',
      'date-fns',
      'recharts',
    ],
  },
  webpack(config, { isServer, webpack }) {
    if (!isServer) {
      // Next 14 always ships polyfills for Array.prototype.at, Object.hasOwn,
      // String.trimStart, etc. Every browser in `browserslist` (package.json)
      // has these natively, so the module is dead weight on every page.
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /[\\/]build[\\/]polyfills[\\/]polyfill-module(\.js)?$/,
          path.resolve(__dirname, 'lib/polyfills/empty.js')
        )
      )
    }
    return config
  },
  async headers() {
    const security = [
      { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      // Google sign-in and Razorpay open popups, so allow popups to keep an opener.
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), payment=(self)' },
    ]

    return [
      { source: '/:path*', headers: security },
      {
        // Static assets in /public are content-stable; let browsers and the CDN
        // hold on to them instead of re-fetching on every visit.
        source: '/:all*(png|jpg|jpeg|gif|svg|ico|webp|avif|woff|woff2|ttf|otf)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/brand/:file*.zip',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
          { key: 'Content-Disposition', value: 'attachment' },
        ],
      },
      {
        source: '/llms.txt',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600' }],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/events/tedxkprit',
        destination: '/events/tedxkprit-2025-break-the-loop',
        permanent: false,
      },
      {
        source: '/events/devagents',
        destination: '/events/devagents-1-0',
        permanent: true,
      },
      { source: '/talk-with-us', destination: '/contact', permanent: true },
    ]
  },
}

module.exports = nextConfig
