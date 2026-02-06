/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable strict mode for better development experience
  reactStrictMode: true,

  // Restore scroll position when navigating back
  experimental: {
    scrollRestoration: true,
  },

  // Completely disable Vercel Data Cache for dynamic routes
  // This forces all fetch requests to go to origin
  // See: https://nextjs.org/docs/app/api-reference/next-config-js/staleTimes
  cacheMaxMemorySize: 0, // Disable in-memory cache

  // Security & caching headers
  async headers() {
    return [
      {
        // Security headers for all routes
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // Prevent caching of API routes
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
