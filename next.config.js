/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: ['deck.gl', '@deck.gl/core', '@deck.gl/layers', '@deck.gl/mapbox', '@deck.gl/react'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: '/new-condos-:neighborhood', destination: '/areas/:neighborhood' },
    ];
  },
  async redirects() {
    return [
      { source: '/pre-construction', destination: '/new-condos', permanent: true },
      { source: '/pre-construction/:slug', destination: '/properties/:slug', permanent: true },
      { source: '/contact', destination: '/contact-us', permanent: true },
    ];
  },
};

module.exports = nextConfig;
