import { vi } from 'vitest';

export const routerMock = {
  push: vi.fn<(href: string) => void>(),
  replace: vi.fn<(href: string) => void>(),
  refresh: vi.fn<() => void>(),
  back: vi.fn<() => void>(),
  prefetch: vi.fn<(href: string) => Promise<void>>(),
};

let params: Record<string, string> = {};
let searchParams = new URLSearchParams();

export function getRouterMock() {
  return routerMock;
}

export function getParamsMock() {
  return params;
}

export function getSearchParamsMock() {
  return searchParams;
}

export function setMockParams(next: Record<string, string>) {
  params = next;
}

export function setMockSearchParams(
  next: URLSearchParams | Record<string, string | number | null | undefined> | string,
) {
  if (next instanceof URLSearchParams) {
    searchParams = next;
    return;
  }

  if (typeof next === 'string') {
    searchParams = new URLSearchParams(next);
    return;
  }

  searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(next)) {
    if (value !== null && value !== undefined) {
      searchParams.set(key, String(value));
    }
  }
}

export function resetNavigationMocks() {
  routerMock.push.mockReset();
  routerMock.replace.mockReset();
  routerMock.refresh.mockReset();
  routerMock.back.mockReset();
  routerMock.prefetch.mockReset();
  params = {};
  searchParams = new URLSearchParams();
}
