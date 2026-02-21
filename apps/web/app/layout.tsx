import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'MyWorkouts',
  description: 'Your personal workout companion',
};

function Nav() {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-primary-600">
          MyWorkouts
        </Link>
        <div className="flex gap-6">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            Home
          </Link>
          <Link href="/explore" className="text-sm text-gray-600 hover:text-gray-900">
            Explore
          </Link>
          <Link href="/workouts" className="text-sm text-gray-600 hover:text-gray-900">
            Workouts
          </Link>
          <Link href="/profile" className="text-sm text-gray-600 hover:text-gray-900">
            Profile
          </Link>
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
