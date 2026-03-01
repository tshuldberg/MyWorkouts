'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { RoutineTemplate, WorkoutExercise, Exercise } from '@myworkouts/shared';
import { loadExercisesWithFallback } from '../../../lib/exercises';

interface TemplateRow {
  id: string;
  title: string;
  description: string;
  creator_id: string;
  exercises: string;
  difficulty: string;
  is_public: number;
  clone_count: number;
  created_at: string;
}

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700',
};

export default function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [template, setTemplate] = useState<RoutineTemplate | null>(null);
  const [exerciseMap, setExerciseMap] = useState<Record<string, Exercise>>({});
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [templateRes, exercises] = await Promise.all([
          fetch(`/api/templates/${encodeURIComponent(id)}`),
          loadExercisesWithFallback(),
        ]);

        if (templateRes.ok) {
          const row: TemplateRow = await templateRes.json();
          let parsedExercises: WorkoutExercise[] = [];
          try {
            parsedExercises = JSON.parse(row.exercises);
          } catch {
            parsedExercises = [];
          }
          setTemplate({
            id: row.id,
            title: row.title,
            description: row.description ?? '',
            creatorId: row.creator_id,
            exercises: parsedExercises,
            difficulty: row.difficulty,
            isPublic: !!row.is_public,
            cloneCount: row.clone_count,
            createdAt: row.created_at,
          });
        }

        const map: Record<string, Exercise> = {};
        for (const e of exercises) map[e.id] = e;
        setExerciseMap(map);
      } catch {
        // Silently fail
      }
      setLoading(false);
    })();
  }, [id]);

  const isOwn = template?.creatorId === 'local-user';

  const handleClone = async () => {
    if (!template) return;
    try {
      const response = await fetch('/api/templates/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: template.id }),
      });
      if (response.ok) {
        router.push('/workouts');
      }
    } catch {
      router.push('/workouts/builder');
    }
  };

  const handleDelete = async () => {
    if (!template || !confirm('Delete this template? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/templates/${encodeURIComponent(template.id)}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        router.push('/templates');
        return;
      }
    } catch {
      // Silently fail
    }
    setDeleting(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Template not found.</p>
        <Link href="/templates" className="text-indigo-500 hover:underline text-sm">
          Back to Templates
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Back */}
      <Link
        href="/templates"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to Templates
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{template.title}</h1>
        <div className="flex items-center gap-3 mt-2">
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
              difficultyColors[template.difficulty] ?? 'bg-gray-100 text-gray-600'
            }`}
          >
            {template.difficulty.charAt(0).toUpperCase() + template.difficulty.slice(1)}
          </span>
          <span className="text-sm text-gray-500">
            {template.exercises.length} exercise{template.exercises.length !== 1 ? 's' : ''}
          </span>
          {template.cloneCount > 0 && (
            <span className="text-sm text-gray-400">
              Cloned {template.cloneCount} time{template.cloneCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {template.description && (
          <p className="mt-3 text-sm text-gray-600 leading-relaxed">{template.description}</p>
        )}
      </div>

      {/* Exercise List */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Exercises</h2>
        {template.exercises.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No exercises in this template.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {template.exercises.map((ex, i) => {
              const exercise = exerciseMap[ex.exercise_id];
              return (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-500">
                      {i + 1}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {exercise?.name ?? ex.exercise_id}
                      </div>
                      <div className="text-xs text-gray-400">
                        {exercise?.category
                          ? exercise.category.charAt(0).toUpperCase() + exercise.category.slice(1)
                          : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span>
                      <span className="font-medium text-gray-700">{ex.sets}</span> sets
                    </span>
                    {ex.reps != null && (
                      <span>
                        <span className="font-medium text-gray-700">{ex.reps}</span> reps
                      </span>
                    )}
                    {ex.weight != null && (
                      <span>
                        <span className="font-medium text-gray-700">{ex.weight}</span>{' '}
                        {ex.weightUnit ?? 'lbs'}
                      </span>
                    )}
                    {ex.duration != null && (
                      <span>
                        <span className="font-medium text-gray-700">{ex.duration}</span>s
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleClone}
          className="flex-1 rounded-lg bg-indigo-500 py-3 text-center font-semibold text-white hover:bg-indigo-600 transition-colors"
        >
          Clone to My Workouts
        </button>
        {isOwn && (
          <>
            <Link
              href={`/workouts/builder?templateId=${template.id}`}
              className="flex-1 rounded-lg border border-indigo-500 py-3 text-center font-semibold text-indigo-500 hover:bg-indigo-50 transition-colors"
            >
              Edit
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg border border-red-300 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
