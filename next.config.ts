import type { NextConfig } from 'next';

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

export default nextConfig;
