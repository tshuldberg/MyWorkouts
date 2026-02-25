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

vi.mock('next/dynamic', () => ({
  default: () => {
    const DynamicStub = ({
      onClick,
    }: {
      onClick?: (arg: { muscle: string }) => void;
    }) => (
      <button
        type="button"
        data-testid="dynamic-stub"
        onClick={() => onClick?.({ muscle: 'chest' })}
      >
        Dynamic
      </button>
    );
    return DynamicStub;
  },
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => getActiveSupabaseMock().client,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => getActiveSupabaseMock().client,
  isSupabaseConfigured: () => true,
}));

vi.stubGlobal('confirm', vi.fn(() => true));

Object.defineProperty(globalThis.HTMLMediaElement.prototype, 'play', {
  configurable: true,
  value: vi.fn().mockResolvedValue(undefined),
});

Object.defineProperty(globalThis.HTMLMediaElement.prototype, 'pause', {
  configurable: true,
  value: vi.fn(),
});

afterEach(() => {
  cleanup();
  resetNavigationMocks();
  resetActiveSupabaseMock();
  vi.clearAllMocks();
});
