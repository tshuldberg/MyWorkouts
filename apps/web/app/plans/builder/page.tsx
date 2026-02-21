'use client';

import { Suspense, useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  type Workout,
  type WorkoutPlan,
  DAY_NAMES,
  toPlanPayload,
} from '@myworkouts/shared';
import { usePlanBuilderStore } from '@/lib/plan-builder-store';
import { createClient } from '@/lib/supabase/client';

export default function PlanBuilderPageWrapper() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-gray-400">Loading...</div>}>
      <PlanBuilderPage />
    </Suspense>
  );
}

function PlanBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const builder = usePlanBuilderStore();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [saving, setSaving] = useState(false);
  const [pickingDay, setPickingDay] = useState<{ weekIndex: number; dayIndex: number } | null>(null);
  const [workoutSearch, setWorkoutSearch] = useState('');

  // Load available workouts
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('workouts')
        .select('*')
        .order('title');
      if (data) setWorkouts(data as Workout[]);
    })();
  }, []);

  // Load plan for editing
  useEffect(() => {
    if (!editId) {
      builder.reset();
      return;
    }
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('id', editId)
        .single();
      if (data) builder.loadPlan(data as WorkoutPlan);
    })();
  }, [editId]);

  const filteredWorkouts = useMemo(() => {
    if (workoutSearch.length < 2) return workouts;
    const q = workoutSearch.toLowerCase();
    return workouts.filter((w) => w.title.toLowerCase().includes(q));
  }, [workouts, workoutSearch]);

  const workoutNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const w of workouts) map[w.id] = w.title;
    return map;
  }, [workouts]);

  const handleSave = useCallback(async () => {
    if (!builder.title.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const payload = toPlanPayload(builder, user.id);

    if (builder.isEditing && builder.editingPlanId) {
      await (supabase.from('workout_plans') as any)
        .update(payload)
        .eq('id', builder.editingPlanId);
    } else {
      await (supabase.from('workout_plans') as any).insert(payload);
    }

    builder.reset();
    setSaving(false);
    router.push('/plans');
  }, [builder, router]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {builder.isEditing ? 'Edit Plan' : 'New Workout Plan'}
        </h1>
        <button
          type="button"
          onClick={() => { builder.reset(); router.push('/plans'); }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>

      {/* Plan Info */}
      <div className="space-y-4 mb-6">
        <input
          type="text"
          value={builder.title}
          onChange={(e) => builder.setTitle(e.target.value)}
          placeholder="Plan name (e.g., 8-Week Strength Program)"
          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />

        {/* Week count selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Weeks:</span>
          {[4, 6, 8, 12].map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => builder.setWeekCount(count)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                builder.weekCount === count
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      {/* Weekly Grid */}
      <div className="space-y-6 mb-8">
        {builder.weeks.map((week, wi) => (
          <div key={wi}>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Week {week.week_number}
            </h2>
            <div className="grid grid-cols-7 gap-2">
              {DAY_NAMES.map((name) => (
                <div key={name} className="text-center text-xs font-medium text-gray-400 pb-1">
                  {name.slice(0, 3)}
                </div>
              ))}
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
                  {day.rest_day ? (
                    <div className="flex flex-col h-full">
                      <span className="text-gray-400 mb-1">Rest Day</span>
                      <button
                        type="button"
                        onClick={() => builder.toggleRestDay(wi, di)}
                        className="mt-auto text-indigo-500 hover:underline"
                      >
                        Add workout
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full">
                      {day.workout_id ? (
                        <>
                          <span className="text-indigo-700 font-medium mb-1 truncate">
                            {workoutNameMap[day.workout_id] ?? 'Workout'}
                          </span>
                          <div className="mt-auto flex gap-1">
                            <button
                              type="button"
                              onClick={() => setPickingDay({ weekIndex: wi, dayIndex: di })}
                              className="text-indigo-500 hover:underline"
                            >
                              Change
                            </button>
                            <button
                              type="button"
                              onClick={() => builder.setDayWorkout(wi, di, null)}
                              className="text-red-400 hover:underline"
                            >
                              Clear
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col h-full items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setPickingDay({ weekIndex: wi, dayIndex: di })}
                            className="text-indigo-500 hover:underline"
                          >
                            + Workout
                          </button>
                          <button
                            type="button"
                            onClick={() => builder.toggleRestDay(wi, di)}
                            className="text-gray-400 hover:underline"
                          >
                            Rest day
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Save */}
      <button
        type="button"
        onClick={handleSave}
        disabled={!builder.title.trim() || saving}
        className="w-full rounded-lg bg-indigo-500 py-3 font-semibold text-white hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? 'Saving...' : builder.isEditing ? 'Update Plan' : 'Create Plan'}
      </button>

      {/* Workout Picker Modal */}
      {pickingDay && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="w-full max-w-lg max-h-[80vh] bg-white rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold text-gray-900">
                Select Workout for {DAY_NAMES[pickingDay.dayIndex]}
              </h3>
              <button
                type="button"
                onClick={() => { setPickingDay(null); setWorkoutSearch(''); }}
                className="text-gray-400 hover:text-gray-600"
              >
                &#10005;
              </button>
            </div>
            <div className="px-4 py-2 border-b">
              <input
                type="text"
                value={workoutSearch}
                onChange={(e) => setWorkoutSearch(e.target.value)}
                placeholder="Search workouts..."
                autoFocus
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {filteredWorkouts.map((workout) => (
                <button
                  key={workout.id}
                  type="button"
                  onClick={() => {
                    builder.setDayWorkout(pickingDay.weekIndex, pickingDay.dayIndex, workout.id);
                    setPickingDay(null);
                    setWorkoutSearch('');
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900 text-sm">{workout.title}</div>
                  <div className="text-xs text-gray-500">
                    {workout.exercises.length} exercises{' \u00B7 '}
                    {workout.difficulty.charAt(0).toUpperCase() + workout.difficulty.slice(1)}
                  </div>
                </button>
              ))}
              {filteredWorkouts.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-gray-400 text-sm">No workouts found.</p>
                  <button
                    type="button"
                    onClick={() => router.push('/workouts/builder')}
                    className="mt-2 text-indigo-500 text-sm hover:underline"
                  >
                    Create a workout first
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
