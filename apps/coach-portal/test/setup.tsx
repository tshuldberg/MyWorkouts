import React from 'react';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import {
  getParamsMock,
  getRouterMock,
  getSearchParamsMock,
  resetNavigationMocks,
} from './mocks/navigation';
import { getActiveSupabaseMock, resetActiveSupabaseMock } from './mocks/supabase';

vi.mock('next/navigation', () => ({
  useRouter: () => getRouterMock(),
  useParams: () => getParamsMock(),
  useSearchParams: () => getSearchParamsMock(),
  redirect: vi.fn(),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string | { pathname?: string };
    children: React.ReactNode;
  }) => {
    const resolvedHref = typeof href === 'string' ? href : (href?.pathname ?? '');
    return (
      <a href={resolvedHref} {...props}>
        {children}
      </a>
    );
  },
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => getActiveSupabaseMock().client,
}));

vi.stubGlobal('confirm', vi.fn(() => true));

afterEach(() => {
  cleanup();
  resetNavigationMocks();
  resetActiveSupabaseMock();
  vi.clearAllMocks();
});
