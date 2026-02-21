import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'MyWorkouts Coach Portal',
  description: 'Coach review and management dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <nav className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-indigo-600">MyWorkouts</Link>
              <span className="ml-2 rounded bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                Coach
              </span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/plans" className="text-sm text-gray-600 hover:text-gray-900">
                Plans
              </Link>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
