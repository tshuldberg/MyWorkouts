import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@myworkouts/shared', '@myworkouts/supabase'],
};

export default nextConfig;
