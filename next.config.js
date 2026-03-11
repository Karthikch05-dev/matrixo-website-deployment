/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'avatars.githubusercontent.com', 'tedxkprit.in', 'firebasestorage.googleapis.com', 'lh3.googleusercontent.com'],
  },
  async redirects() {
    return [
      {
        source: '/events/tedxkprit',
        destination: '/events/tedxkprit-2025-break-the-loop',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
