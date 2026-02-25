import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { resetNavigationMocks } from './mocks/navigation';
import { resetActiveSupabaseMock } from './mocks/supabase';

afterEach(() => {
  cleanup();
  resetNavigationMocks();
  resetActiveSupabaseMock();
  vi.clearAllMocks();
});
