import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchCurrentUser } from '../lib/actions';
import './globals.css';

export const metadata: Metadata = {
  title: 'MyWorkouts',
  description: 'Your personal workout companion',
};

async function Nav() {
  const user = await fetchCurrentUser();

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-primary-600">
          MyWorkouts
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            Home
          </Link>
          <Link href="/explore" className="text-sm text-gray-600 hover:text-gray-900">
            Explore
          </Link>
          <Link href="/workouts" className="text-sm text-gray-600 hover:text-gray-900">
            Workouts
          </Link>
          <Link href="/progress" className="text-sm text-gray-600 hover:text-gray-900">
            Progress
          </Link>
          <Link href="/templates" className="text-sm text-gray-600 hover:text-gray-900">
            Templates
          </Link>
          <Link href="/tools/plate-calculator" className="text-sm text-gray-600 hover:text-gray-900">
            Tools
          </Link>
          {/* Body & Social nav group (social-dev) */}
          <span className="text-gray-300">|</span>
          <Link href="/measurements" className="text-sm text-gray-600 hover:text-gray-900">
            Measurements
          </Link>
          <Link href="/photos" className="text-sm text-gray-600 hover:text-gray-900">
            Photos
          </Link>
          <Link href="/social" className="text-sm text-gray-600 hover:text-gray-900">
            Social
          </Link>
          {user ? (
            <Link href="/profile" className="text-sm text-gray-600 hover:text-gray-900">
              Profile
            </Link>
          ) : (
            <Link
              href="/auth/sign-in"
              className="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
