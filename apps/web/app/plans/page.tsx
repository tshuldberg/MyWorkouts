'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { WorkoutPlan } from '@myworkouts/shared';
import { getPlanProgress } from '@myworkouts/shared';
import { fetchWorkoutPlans } from '../../lib/actions';

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCoach, setIsCoach] = useState(false);

  useEffect(() => {
    (async () => {
      const result = await fetchWorkoutPlans();
      setPlans(result.plans);
      setIsCoach(result.isCoach);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Workout Plans</h1>
        {isCoach && (
          <button
            type="button"
            onClick={() => router.push('/plans/builder')}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 transition-colors"
          >
            + New Plan
          </button>
        )}
      </div>

      <p className="text-sm text-gray-400 mb-4">
        Multi-week workout programs designed by your coach. Premium feature.
      </p>

      {loading && (
        <p className="py-12 text-center text-gray-400">Loading...</p>
      )}

      {!loading && plans.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-gray-500 mb-2">No workout plans available.</p>
          <p className="text-sm text-gray-400">
            {isCoach
              ? 'Create a multi-week plan for your clients.'
              : 'Ask your coach to create a personalized plan for you.'}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {plans.map((plan) => {
          const progress = getPlanProgress(plan, new Set());
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => router.push(`/plans/${plan.id}`)}
              className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left hover:border-indigo-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{plan.title}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {plan.weeks.length} weeks{' \u00B7 '}{progress.total} workouts
                  </div>
                </div>
                {plan.is_premium && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Premium
                  </span>
                )}
              </div>
              {/* Progress bar */}
              <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-gray-400">
                {progress.completed}/{progress.total} completed ({progress.percent}%)
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
