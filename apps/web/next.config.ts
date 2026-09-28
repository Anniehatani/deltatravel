import type { NextConfig } from 'next';

const config: NextConfig = {
  transpilePackages: ['@tour/shared'],
  poweredByHeader: false,
};

export default config;
