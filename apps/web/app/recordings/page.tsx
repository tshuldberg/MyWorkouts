'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { FormRecording } from '@myworkouts/shared';
import { createClient } from '@/lib/supabase/client';
import { deleteRecording } from '@/lib/recording-upload';

interface RecordingWithExercise extends FormRecording {
  exercise_name?: string;
  thumbnail_url?: string;
}

export default function RecordingsPage() {
  const router = useRouter();
  const [recordings, setRecordings] = useState<RecordingWithExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageUsed, setStorageUsed] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRecordings = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Get recordings via session join
    const { data } = await (supabase as any)
      .from('form_recordings')
      .select(`
        *,
        workout_sessions!inner(user_id)
      `)
      .eq('workout_sessions.user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      // Enrich with exercise names
      const exerciseIds = [...new Set((data as any[]).map((r: any) => r.exercise_id))];
      const { data: exercises } = await supabase
        .from('exercises')
        .select('id, name')
        .in('id', exerciseIds);

      const nameMap: Record<string, string> = {};
      if (exercises) {
        for (const e of exercises as any[]) {
          nameMap[e.id] = e.name;
        }
      }

      setRecordings(
        (data as any[]).map((r: any) => ({
          ...r,
          exercise_name: nameMap[r.exercise_id] ?? 'Unknown Exercise',
        })),
      );

      // Estimate storage (rough: count recordings * avg size)
      setStorageUsed(data.length * 15); // ~15MB avg estimate per recording
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  const handleDelete = useCallback(async (recording: RecordingWithExercise) => {
    if (!confirm('Delete this recording? This cannot be undone.')) return;
    setDeleting(recording.id);
    setError(null);
    try {
      const deleted = await deleteRecording(recording.id, recording.video_url);
      if (!deleted) {
        setError('Could not delete recording. Please try again.');
        return;
      }
      setRecordings((prev) => prev.filter((r) => r.id !== recording.id));
    } finally {
      setDeleting(null);
    }
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Form Recordings</h1>
          <p className="text-sm text-gray-400 mt-1">
            Review your workout form recordings
          </p>
        </div>
        {storageUsed > 0 && (
          <div className="text-right">
            <p className="text-sm text-gray-500">~{storageUsed} MB used</p>
            <p className="text-xs text-gray-400">of your recording storage</p>
          </div>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading && (
        <p className="py-12 text-center text-gray-400">Loading recordings...</p>
      )}

      {!loading && recordings.length === 0 && (
        <div className="py-16 text-center">
          <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <p className="mt-4 text-gray-500">No recordings yet.</p>
          <p className="text-sm text-gray-400 mt-1">
            Enable the camera during a workout to record your form.
          </p>
          <button
            type="button"
            onClick={() => router.push('/workouts')}
            className="mt-4 text-indigo-500 text-sm hover:underline"
          >
            Start a workout
          </button>
        </div>
      )}

      <div className="space-y-3">
        {recordings.map((rec) => (
          <div
            key={rec.id}
            className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-4"
          >
            <button
              type="button"
              onClick={() => router.push(`/recordings/${rec.id}`)}
              className="flex-1 text-left"
            >
              <div className="font-medium text-gray-900">
                {rec.exercise_name}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(rec.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {' \u00B7 '}
                {Math.round(rec.timestamp_end - rec.timestamp_start)}s duration
              </div>
              {rec.coach_feedback.length > 0 && (
                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-600">
                  <span>&#9733;</span>
                  {rec.coach_feedback.length} coach note{rec.coach_feedback.length > 1 ? 's' : ''}
                </div>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleDelete(rec)}
              disabled={deleting === rec.id}
              className="text-sm text-red-400 hover:text-red-600 disabled:opacity-50"
            >
              {deleting === rec.id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
