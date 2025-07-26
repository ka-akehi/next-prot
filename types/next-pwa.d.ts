declare module 'next-pwa' {
  import { NextConfig } from 'next';

  interface PWAOptions {
    dest: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    buildExcludes?: RegExp[];
  }

  const withPWA: (options: PWAOptions) => (config: NextConfig) => NextConfig;
  export default withPWA;
}
