/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable strict mode for better development experience
  reactStrictMode: true,

  // Restore scroll position when navigating back
  experimental: {
    scrollRestoration: true,
  },

  // Prevent caching of API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
          { key: 'Surrogate-Control', value: 'no-store' },
        ],
      },
    ];
  },

  // Image optimization for perk logos/images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.getproven.com',
      },
      {
        // Google's favicon service for vendor icons
        protocol: 'https',
        hostname: 'www.google.com',
        pathname: '/s2/favicons**',
      },
      {
        // CloudFront CDN for GetProven media assets
        protocol: 'https',
        hostname: '**.cloudfront.net',
      },
    ],
  },

  // Environment variables exposed to the browser (prefix with NEXT_PUBLIC_)
  // Server-only env vars (like API tokens) should NOT be listed here
}

module.exports = nextConfig
