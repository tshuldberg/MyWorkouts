'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';

interface ClientProfile {
  id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
  created_at: string;
}

interface SessionRow {
  id: string;
  workout_id: string;
  started_at: string;
  completed_at: string | null;
  workout_title: string;
}

interface RecordingRow {
  id: string;
  session_id: string;
  video_url: string;
  exercise_id: string;
  exercise_name: string;
  timestamp_start: number;
  timestamp_end: number;
  coach_feedback: Array<{ timestamp: number; comment: string; coach_id: string; created_at: string }>;
  created_at: string;
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [recordings, setRecordings] = useState<RecordingRow[]>([]);
  const [feedbackText, setFeedbackText] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setLoading(false);
        router.push('/auth/sign-in');
        return;
      }

      // Fetch client profile
      const { data: profile } = await supabase
        .from('users')
        .select('id, display_name, email, avatar_url, created_at')
        .eq('id', id)
        .single();

      if (!profile) {
        setLoading(false);
        return;
      }
      setClient(profile);

      // Fetch workout sessions with workout titles
      const { data: sessionsData } = await supabase
        .from('workout_sessions')
        .select('id, workout_id, started_at, completed_at')
        .eq('user_id', id)
        .order('started_at', { ascending: false })
        .limit(20);

      if (sessionsData && sessionsData.length > 0) {
        const sessions = sessionsData as any[];
        const workoutIds = [...new Set(sessions.map((s) => s.workout_id))];
        const { data: workouts } = await supabase
          .from('workouts')
          .select('id, title')
          .in('id', workoutIds);

        const workoutMap = new Map((workouts as any[] ?? []).map((w: any) => [w.id, w.title]));
        setSessions(
          sessions.map((s: any) => ({
            ...s,
            workout_title: workoutMap.get(s.workout_id) ?? 'Unknown Workout',
          })),
        );

        // Fetch form recordings for these sessions
        const sessionIds = sessions.map((s: any) => s.id);
        const { data: recs } = await supabase
          .from('form_recordings')
          .select('id, session_id, video_url, exercise_id, timestamp_start, timestamp_end, coach_feedback, created_at')
          .in('session_id', sessionIds)
          .order('created_at', { ascending: false });

        if (recs && (recs as any[]).length > 0) {
          const recsArr = recs as any[];
          const exerciseIds = [...new Set(recsArr.map((r: any) => r.exercise_id))];
          const { data: exercises } = await supabase
            .from('exercises')
            .select('id, name')
            .in('id', exerciseIds);

          const exerciseMap = new Map((exercises as any[] ?? []).map((e: any) => [e.id, e.name]));
          setRecordings(
            recsArr.map((r: any) => ({
              ...r,
              exercise_name: exerciseMap.get(r.exercise_id) ?? 'Unknown Exercise',
              coach_feedback: (r.coach_feedback ?? []) as RecordingRow['coach_feedback'],
            })),
          );
        }
      }

      setLoading(false);
    }
    load();
  }, [id, router]);

  async function submitFeedback(recordingId: string) {
    const comment = feedbackText[recordingId]?.trim();
    if (!comment) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const recording = recordings.find((r) => r.id === recordingId);
    if (!recording) return;

    const newFeedback = {
      timestamp: 0,
      comment,
      coach_id: user.id,
      created_at: new Date().toISOString(),
    };

    const updatedFeedback = [...recording.coach_feedback, newFeedback];

    await (supabase as any)
      .from('form_recordings')
      .update({ coach_feedback: updatedFeedback })
      .eq('id', recordingId);

    setRecordings((prev) =>
      prev.map((r) =>
        r.id === recordingId ? { ...r, coach_feedback: updatedFeedback } : r,
      ),
    );
    setFeedbackText((prev) => ({ ...prev, [recordingId]: '' }));
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function formatDuration(start: string, end: string | null): string {
    if (!end) return 'In progress';
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const mins = Math.round(ms / 60000);
    return `${mins} min`;
  }

  function getInitials(name: string | null, email: string): string {
    if (name) return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
    return email[0].toUpperCase();
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gray-200" />
            <div className="space-y-2">
              <div className="h-6 w-40 rounded bg-gray-200" />
              <div className="h-4 w-24 rounded bg-gray-200" />
            </div>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <p className="text-gray-500">Client not found.</p>
        <Link href="/clients" className="mt-4 inline-block text-indigo-600 hover:underline">
          Back to clients
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Back link */}
      <Link href="/clients" className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        All Clients
      </Link>

      {/* Client header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-lg font-semibold text-indigo-700">
          {client.avatar_url ? (
            <img src={client.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            getInitials(client.display_name, client.email)
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {client.display_name || client.email}
          </h1>
          <p className="text-sm text-gray-500">
            Member since {formatDate(client.created_at)} · {sessions.length} workouts
          </p>
        </div>
      </div>

      {/* Workout History */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Workout History</h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-gray-400">No workouts completed yet.</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-4 py-3"
              >
                <div>
                  <div className="font-medium text-gray-900">{session.workout_title}</div>
                  <div className="text-sm text-gray-500">{formatDate(session.started_at)}</div>
                </div>
                <div className="text-sm text-gray-500">
                  {formatDuration(session.started_at, session.completed_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Form Recordings */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Form Recordings</h2>
        {recordings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-500">No recordings yet.</p>
            <p className="mt-1 text-sm text-gray-400">
              Recordings will appear here when the client records their form during workouts.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recordings.map((rec) => (
              <div key={rec.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium text-gray-900">{rec.exercise_name}</div>
                    <div className="text-sm text-gray-500">{formatDate(rec.created_at)}</div>
                  </div>
                  <a
                    href={rec.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                  >
                    Review Video
                  </a>
                </div>

                {/* Existing feedback */}
                {rec.coach_feedback.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {rec.coach_feedback.map((fb, i) => (
                      <div key={i} className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
                        <span className="text-gray-900">{fb.comment}</span>
                        <span className="ml-2 text-xs text-gray-400">
                          {formatDate(fb.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add feedback */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add feedback..."
                    value={feedbackText[rec.id] ?? ''}
                    onChange={(e) =>
                      setFeedbackText((prev) => ({ ...prev, [rec.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitFeedback(rec.id);
                    }}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                  />
                  <button
                    onClick={() => submitFeedback(rec.id)}
                    disabled={!feedbackText[rec.id]?.trim()}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
