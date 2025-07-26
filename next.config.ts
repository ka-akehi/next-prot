import type { NextConfig } from 'next';
import nextPwa from 'next-pwa';

/** @type {import('next').NextConfig} */
const withPWA = nextPwa({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/],
});

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/xss/5-csp',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self'; object-src 'none'; style-src 'self';",
          },
        ],
      },
    ];
  },
  experimental: {
    serverActions: {}, // Next15では必要に応じて
  },
  reactStrictMode: true,
};

export default withPWA(nextConfig);
