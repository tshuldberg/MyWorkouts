import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: [
      {
        find: '@/lib/supabase',
        replacement: path.resolve(__dirname, 'test/mocks/supabase-module.ts'),
      },
      {
        find: /^\.\.\/\.\.\/lib\/supabase$/,
        replacement: path.resolve(__dirname, 'test/mocks/supabase-module.ts'),
      },
      {
        find: '@',
        replacement: path.resolve(__dirname, '.'),
      },
      {
        find: 'react-native',
        replacement: path.resolve(__dirname, 'test/mocks/react-native.tsx'),
      },
      {
        find: 'expo-router',
        replacement: path.resolve(__dirname, 'test/mocks/expo-router.tsx'),
      },
      {
        find: 'react-native-body-highlighter',
        replacement: path.resolve(__dirname, 'test/mocks/body-highlighter.tsx'),
      },
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.tsx'],
    restoreMocks: true,
    clearMocks: true,
  },
});
