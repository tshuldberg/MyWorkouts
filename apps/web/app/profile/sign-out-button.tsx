'use client';

import { useRouter } from 'next/navigation';

export function SignOutButton() {
  const router = useRouter();

  function handleSignOut() {
    // In local SQLite mode there's no real auth session to clear.
    // Navigate to home as a no-op sign-out.
    router.push('/');
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      Sign Out
    </button>
  );
}
