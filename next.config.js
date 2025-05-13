/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/scm-ui' : '',
  images: {
    unoptimized: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/health',
        destination: '/api/health',
        permanent: true,
      },
      {
        source: '/device-count',
        destination: '/api/device-count',
        permanent: true,
      }
    ];
  },
  async rewrites() {
    return [
      {
        source: '/devices/:path*',
        destination: 'http://localhost:8000/devices/:path*',
      },
      {
        source: '/activities/:path*',
        destination: 'http://localhost:8000/activities/:path*',
      },
      {
        source: '/analytics/:path*',
        destination: 'http://localhost:8000/analytics/:path*',
      },
      {
        source: '/status',
        destination: 'http://localhost:8000/status',
      },
      {
        source: '/device-count',
        destination: 'http://localhost:8000/device-count',
      },
      {
        source: '/health',
        destination: 'http://localhost:8000/health',
      },
    ];
  },
};

module.exports = nextConfig;