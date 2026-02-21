'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Workout } from '@myworkouts/shared';
import { createClient } from '@/lib/supabase/client';

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  return `${m} min`;
}

export default function WorkoutsPage() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkouts = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('workouts')
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setWorkouts(data as Workout[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Workouts</h1>
        <button
          type="button"
          onClick={() => router.push('/workouts/builder')}
          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 transition-colors"
        >
          + New Workout
        </button>
      </div>

      {loading && (
        <p className="py-12 text-center text-gray-400">Loading...</p>
      )}

      {!loading && workouts.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-gray-500 mb-4">No custom workouts yet.</p>
          <button
            type="button"
            onClick={() => router.push('/workouts/builder')}
            className="text-indigo-500 hover:underline"
          >
            Create your first workout
          </button>
        </div>
      )}

      <div className="space-y-3">
        {workouts.map((w) => (
          <div
            key={w.id}
            className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 hover:border-indigo-200 hover:shadow-sm transition-all"
          >
            <div>
              <div className="font-semibold text-gray-900">{w.title}</div>
              <div className="text-xs text-gray-500 mt-1">
                {w.exercises.length} exercises{' \u00B7 '}
                {formatDuration(w.estimated_duration)}{' \u00B7 '}
                {w.difficulty.charAt(0).toUpperCase() + w.difficulty.slice(1)}
              </div>
              {w.description && (
                <div className="text-xs text-gray-400 mt-1 line-clamp-1">{w.description}</div>
              )}
            </div>
            <button
              type="button"
              onClick={() => router.push(`/workouts/builder?edit=${w.id}`)}
              className="text-sm text-indigo-500 hover:underline"
            >
              Edit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
