import { vi } from 'vitest';

export const routerMock = {
  push: vi.fn<(href: string) => void>(),
  replace: vi.fn<(href: string) => void>(),
  back: vi.fn<() => void>(),
  setParams: vi.fn<(params: Record<string, string>) => void>(),
};

let localSearchParams: Record<string, string> = {};

export function getRouterMock() {
  return routerMock;
}

export function getLocalSearchParamsMock() {
  return localSearchParams;
}

export function setMockLocalSearchParams(next: Record<string, string>) {
  localSearchParams = next;
}

export function resetNavigationMocks() {
  routerMock.push.mockReset();
  routerMock.replace.mockReset();
  routerMock.back.mockReset();
  routerMock.setParams.mockReset();
  localSearchParams = {};
}
