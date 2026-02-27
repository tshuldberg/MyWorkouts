import React from 'react';
import { getLocalSearchParamsMock, getRouterMock } from './navigation';

const Screen = ({ children }: { children?: React.ReactNode }) => <>{children}</>;

export const Stack = Object.assign(
  ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  { Screen },
);

export const Tabs = Object.assign(
  ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  { Screen },
);

export function useRouter() {
  return getRouterMock();
}

export function useLocalSearchParams<T extends Record<string, string | undefined>>() {
  return getLocalSearchParamsMock() as T;
}
