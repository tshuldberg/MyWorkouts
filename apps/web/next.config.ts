import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@myworkouts/shared', '@myworkouts/ui', '@myworkouts/supabase'],
};

export default nextConfig;
