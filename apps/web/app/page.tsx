import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900">MyWorkouts</h1>
        <p className="mt-3 text-lg text-gray-500">Your personal workout companion</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickLink
          href="/explore"
          title="Explore Exercises"
          description="Browse exercises by muscle group using the interactive body map"
        />
        <QuickLink
          href="/workouts"
          title="My Workouts"
          description="Create and manage your custom workout routines"
        />
        <QuickLink
          href="/progress"
          title="Progress"
          description="Track your streaks, volume, and personal records"
        />
        <QuickLink
          href="/plans"
          title="Workout Plans"
          description="Multi-week programs designed by your coach"
        />
        <QuickLink
          href="/pricing"
          title="Premium"
          description="Unlock form recording, coach review, and personalized plans"
        />
        <QuickLink
          href="/profile"
          title="Profile"
          description="Manage your account and preferences"
        />
      </div>
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-gray-200 bg-white p-5 hover:border-indigo-200 hover:shadow-sm transition-all block"
    >
      <div className="font-semibold text-gray-900 mb-1">{title}</div>
      <div className="text-sm text-gray-500">{description}</div>
    </Link>
  );
}
