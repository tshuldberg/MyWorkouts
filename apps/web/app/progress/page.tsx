'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { WorkoutSession, Exercise } from '@myworkouts/shared';
import {
  calculateStreaks,
  calculateVolume,
  calculatePersonalRecords,
  getWeeklySummaries,
  buildHistory,
} from '@myworkouts/shared';
import { createClient } from '@/lib/supabase/client';

export default function ProgressPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workoutTitles, setWorkoutTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch sessions, exercises, and workout titles in parallel
      const [sessionsRes, exercisesRes, workoutsRes] = await Promise.all([
        supabase
          .from('workout_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('started_at', { ascending: false }),
        supabase.from('exercises').select('*'),
        supabase.from('workouts').select('id, title'),
      ]);

      if (sessionsRes.data) setSessions(sessionsRes.data as WorkoutSession[]);
      if (exercisesRes.data) setExercises(exercisesRes.data as Exercise[]);
      if (workoutsRes.data) {
        const titles: Record<string, string> = {};
        for (const w of workoutsRes.data as { id: string; title: string }[]) {
          titles[w.id] = w.title;
        }
        setWorkoutTitles(titles);
      }

      setLoading(false);
    })();
  }, []);

  const exerciseMap = useMemo(() => {
    const map: Record<string, Exercise> = {};
    for (const e of exercises) map[e.id] = e;
    return map;
  }, [exercises]);

  const streaks = useMemo(() => calculateStreaks(sessions), [sessions]);
  const volume = useMemo(() => calculateVolume(sessions, exerciseMap), [sessions, exerciseMap]);
  const personalRecords = useMemo(
    () => calculatePersonalRecords(sessions, exerciseMap),
    [sessions, exerciseMap],
  );
  const weeklySummaries = useMemo(() => getWeeklySummaries(sessions, 8), [sessions]);
  const history = useMemo(() => buildHistory(sessions, workoutTitles), [sessions, workoutTitles]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  // Sort muscle groups by count descending for the chart
  const muscleGroupEntries = Object.entries(volume.byMuscleGroup)
    .sort((a, b) => b[1] - a[1]);
  const maxMuscleCount = muscleGroupEntries.length > 0 ? muscleGroupEntries[0][1] : 1;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Progress</h1>

      {sessions.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-500 mb-2">No workout history yet.</p>
          <p className="text-sm text-gray-400 mb-4">
            Complete a workout to start tracking your progress.
          </p>
          <button
            type="button"
            onClick={() => router.push('/workouts')}
            className="text-indigo-500 text-sm hover:underline"
          >
            Browse workouts
          </button>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard
              label="Current Streak"
              value={`${streaks.current}`}
              unit="days"
              accent={streaks.current > 0}
            />
            <StatCard
              label="Longest Streak"
              value={`${streaks.longest}`}
              unit="days"
            />
            <StatCard
              label="Total Workouts"
              value={`${volume.totalSessions}`}
            />
            <StatCard
              label="Total Time"
              value={`${volume.totalDurationMinutes}`}
              unit="min"
            />
          </div>

          {/* Weekly Activity Chart */}
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Weekly Activity</h2>
            <div className="flex items-end gap-2 h-32">
              {weeklySummaries
                .slice()
                .reverse()
                .map((week, i) => {
                  const maxSessions = Math.max(...weeklySummaries.map((w) => w.sessions), 1);
                  const height = week.sessions > 0
                    ? Math.max((week.sessions / maxSessions) * 100, 8)
                    : 4;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={`w-full rounded-t ${
                          week.sessions > 0 ? 'bg-indigo-500' : 'bg-gray-100'
                        }`}
                        style={{ height: `${height}%` }}
                        title={`${week.sessions} sessions, ${week.totalMinutes} min`}
                      />
                      <span className="text-[10px] text-gray-400 truncate w-full text-center">
                        {week.label}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Volume by Muscle Group */}
          {muscleGroupEntries.length > 0 && (
            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-medium text-gray-700 mb-3">Volume by Muscle Group</h2>
              <div className="space-y-2">
                {muscleGroupEntries.slice(0, 8).map(([group, count]) => (
                  <div key={group} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-24 text-right capitalize">
                      {group.replace('_', ' ')}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${(count / maxMuscleCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-8">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Personal Records */}
          {personalRecords.length > 0 && (
            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-medium text-gray-700 mb-3">Personal Records</h2>
              <div className="divide-y divide-gray-100">
                {personalRecords.slice(0, 5).map((pr) => (
                  <div key={pr.exerciseId} className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{pr.exerciseName}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(pr.achievedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-3 text-xs">
                      <span className="text-gray-600">
                        <span className="font-medium text-gray-900">{pr.maxSets}</span> sets
                      </span>
                      <span className="text-gray-600">
                        <span className="font-medium text-gray-900">{pr.maxReps}</span> reps
                      </span>
                      {pr.maxDuration !== null && (
                        <span className="text-gray-600">
                          <span className="font-medium text-gray-900">{pr.maxDuration}</span>s
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workout History */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Workout History</h2>
            {history.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No completed workouts yet.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {history.slice(0, 20).map((entry) => (
                  <div key={entry.sessionId} className="flex items-center justify-between py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {entry.workoutTitle}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(entry.date).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>{entry.durationMinutes} min</span>
                      <span>
                        {entry.exercisesCompleted}/{entry.exercisesTotal} exercises
                      </span>
                      <span>{entry.totalReps} reps</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span
          className={`text-2xl font-bold ${
            accent ? 'text-indigo-600' : 'text-gray-900'
          }`}
        >
          {value}
        </span>
        {unit && <span className="text-sm text-gray-400">{unit}</span>}
      </div>
    </div>
  );
}
