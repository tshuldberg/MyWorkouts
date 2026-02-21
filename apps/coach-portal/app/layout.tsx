import type { Metadata } from 'next';
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
          <div className="mx-auto flex max-w-7xl items-center px-4 py-3">
            <span className="text-xl font-bold text-primary-600">MyWorkouts</span>
            <span className="ml-2 rounded bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
              Coach
            </span>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
