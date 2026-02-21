'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  type WorkoutPlan,
  type Workout,
  DAY_NAMES,
  getPlanProgress,
} from '@myworkouts/shared';
import { createClient } from '@/lib/supabase/client';

export default function PlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [workoutNames, setWorkoutNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('id', id)
        .single();
      if (data) {
        const p = data as WorkoutPlan;
        setPlan(p);

        // Fetch workout names for all referenced workout IDs
        const workoutIds = new Set<string>();
        for (const week of p.weeks) {
          for (const day of week.days) {
            if (day.workout_id) workoutIds.add(day.workout_id);
          }
        }
        if (workoutIds.size > 0) {
          const { data: workouts } = await supabase
            .from('workouts')
            .select('id, title')
            .in('id', Array.from(workoutIds));
          if (workouts) {
            const names: Record<string, string> = {};
            for (const w of workouts as Workout[]) {
              names[w.id] = w.title;
            }
            setWorkoutNames(names);
          }
        }
      }
      setLoading(false);
    })();
  }, [id]);

  const progress = useMemo(
    () => plan ? getPlanProgress(plan, new Set()) : { completed: 0, total: 0, percent: 0 },
    [plan]
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Plan not found.</p>
        <button
          type="button"
          onClick={() => router.push('/plans')}
          className="text-indigo-500 hover:underline"
        >
          Back to Plans
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Back */}
      <button
        type="button"
        onClick={() => router.push('/plans')}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Plans
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-gray-900">{plan.title}</h1>
        {plan.is_premium && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
            Premium
          </span>
        )}
      </div>

      <p className="text-sm text-gray-500 mb-4">
        {plan.weeks.length} weeks{' \u00B7 '}{progress.total} workouts
      </p>

      {/* Overall Progress */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm text-gray-500">{progress.percent}%</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <div className="mt-1 text-xs text-gray-400">
          {progress.completed} of {progress.total} workouts completed
        </div>
      </div>

      {/* Weekly Calendar */}
      <div className="space-y-6">
        {plan.weeks.map((week, wi) => (
          <div key={wi}>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Week {week.week_number}
            </h2>
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {DAY_NAMES.map((name) => (
                <div key={name} className="text-center text-xs font-medium text-gray-400 pb-1">
                  {name.slice(0, 3)}
                </div>
              ))}
              {/* Day cells */}
              {week.days.map((day, di) => (
                <div
                  key={di}
                  className={`rounded-lg border p-2 min-h-[80px] text-xs ${
                    day.rest_day
                      ? 'border-gray-100 bg-gray-50'
                      : day.workout_id
                        ? 'border-indigo-200 bg-indigo-50'
                        : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="font-medium text-gray-500 mb-1">
                    {DAY_NAMES[di]?.slice(0, 3)}
                  </div>
                  {day.rest_day ? (
                    <span className="text-gray-400">Rest</span>
                  ) : day.workout_id ? (
                    <span className="text-indigo-700 font-medium">
                      {workoutNames[day.workout_id] ?? 'Workout'}
                    </span>
                  ) : (
                    <span className="text-gray-300">--</span>
                  )}
                  {day.notes && (
                    <div className="mt-1 text-gray-400 truncate" title={day.notes}>
                      {day.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
