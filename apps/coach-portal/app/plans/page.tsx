'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { WorkoutPlan } from '@myworkouts/shared';
import { getPlanProgress } from '@myworkouts/shared';
import { createClient } from '@/lib/supabase/client';

export default function CoachPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setPlans(data as WorkoutPlan[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workout Plans</h1>
          <p className="text-sm text-gray-400 mt-1">
            Create and manage multi-week programs for your clients
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/plans/new')}
          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 transition-colors"
        >
          + New Plan
        </button>
      </div>

      {loading && (
        <p className="py-12 text-center text-gray-400">Loading...</p>
      )}

      {!loading && plans.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-gray-500 mb-2">No plans created yet.</p>
          <p className="text-sm text-gray-400">
            Create a multi-week workout plan to assign to your clients.
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
              onClick={() => router.push(`/plans/new?edit=${plan.id}`)}
              className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left hover:border-indigo-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{plan.title}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {plan.weeks.length} weeks{' \u00B7 '}{progress.total} workouts
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {plan.is_premium && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Premium
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(plan.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
