import Link from 'next/link';

export default function CoachPortalPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900">Coach Portal</h1>
        <p className="mt-3 text-lg text-gray-500">
          Manage your clients, plans, and form reviews
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/plans"
          className="rounded-xl border border-gray-200 bg-white p-6 hover:border-indigo-200 hover:shadow-sm transition-all block"
        >
          <div className="text-lg font-semibold text-gray-900 mb-2">Workout Plans</div>
          <div className="text-sm text-gray-500">
            Create and manage multi-week workout programs for your clients.
          </div>
        </Link>
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 opacity-60">
          <div className="text-lg font-semibold text-gray-900 mb-2">Form Reviews</div>
          <div className="text-sm text-gray-500">
            Review client recordings and leave timestamped feedback.
          </div>
          <div className="mt-2 text-xs text-gray-400">Coming soon</div>
        </div>
      </div>
    </div>
  );
}
