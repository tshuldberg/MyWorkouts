'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  type Exercise,
  MuscleGroup,
  muscleGroupLabel,
} from '@myworkouts/shared';
import { createClient } from '@/lib/supabase/client';

const Model = dynamic(() => import('react-body-highlighter'), { ssr: false });

// Map our MuscleGroup to the web library's slugs for the mini body map
const WEB_MUSCLE_GROUP_TO_SLUGS: Record<string, string[]> = {
  [MuscleGroup.Chest]: ['chest'],
  [MuscleGroup.Back]: ['upper-back', 'lower-back', 'trapezius'],
  [MuscleGroup.Shoulders]: ['front-deltoids', 'back-deltoids'],
  [MuscleGroup.Biceps]: ['biceps'],
  [MuscleGroup.Triceps]: ['triceps'],
  [MuscleGroup.Forearms]: ['forearm'],
  [MuscleGroup.Core]: ['abs', 'obliques'],
  [MuscleGroup.Quads]: ['quadriceps'],
  [MuscleGroup.Hamstrings]: ['hamstring'],
  [MuscleGroup.Glutes]: ['gluteal'],
  [MuscleGroup.Calves]: ['calves'],
  [MuscleGroup.HipFlexors]: ['adductor', 'abductors'],
  [MuscleGroup.Neck]: ['neck'],
  [MuscleGroup.FullBody]: [
    'chest', 'upper-back', 'lower-back', 'trapezius', 'front-deltoids',
    'back-deltoids', 'biceps', 'triceps', 'forearm', 'abs', 'obliques',
    'quadriceps', 'hamstring', 'gluteal', 'calves', 'adductor', 'abductors', 'neck',
  ],
};

const difficultyDots: Record<string, string> = {
  beginner: '\u25CF\u25CB\u25CB',
  intermediate: '\u25CF\u25CF\u25CB',
  advanced: '\u25CF\u25CF\u25CF',
};

function categoryLabel(cat: string): string {
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

function difficultyLabel(d: string): string {
  return d.charAt(0).toUpperCase() + d.slice(1);
}

export default function ExerciseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingWorkout, setStartingWorkout] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) setExercise(data as Exercise);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Exercise not found.</p>
        <button
          type="button"
          onClick={() => router.push('/explore')}
          className="text-indigo-500 hover:underline"
        >
          Back to Explore
        </button>
      </div>
    );
  }

  // Split muscle groups into primary (first) and secondary (rest)
  const primaryMuscles = exercise.muscle_groups.slice(0, 1);
  const secondaryMuscles = exercise.muscle_groups.slice(1);

  // Build highlight data for mini body maps
  const primaryHighlight = primaryMuscles.flatMap((m) => {
    const slugs = WEB_MUSCLE_GROUP_TO_SLUGS[m] ?? [];
    return slugs.map((slug) => ({ name: 'Primary', muscles: [slug], frequency: 2 }));
  });
  const secondaryHighlight = secondaryMuscles.flatMap((m) => {
    const slugs = WEB_MUSCLE_GROUP_TO_SLUGS[m] ?? [];
    return slugs.map((slug) => ({ name: 'Secondary', muscles: [slug], frequency: 1 }));
  });
  const allHighlight = [...primaryHighlight, ...secondaryHighlight];

  const handleAddToWorkout = () => {
    router.push(`/workouts/builder?add=${exercise.id}`);
  };

  const handleStartWorkout = async () => {
    setStartingWorkout(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/sign-in');
        return;
      }

      const payload = {
        title: `${exercise.name} Quick Start`,
        description: `Quick workout based on ${exercise.name}`,
        creator_id: user.id,
        difficulty: exercise.difficulty,
        exercises: [
          {
            exercise_id: exercise.id,
            sets: 3,
            reps: 10,
            duration: null,
            rest_after: 45,
            order: 0,
          },
        ],
        estimated_duration: 180,
        is_premium: false,
      };

      const { data, error } = await (supabase.from('workouts') as any)
        .insert(payload)
        .select('id')
        .single();

      if (error || !data?.id) {
        router.push(`/workouts/builder?add=${exercise.id}`);
        return;
      }

      router.push(`/workout/${data.id}`);
    } finally {
      setStartingWorkout(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back
      </button>

      {/* Video Placeholder */}
      <div className="mb-6 flex h-56 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
        <div className="flex flex-col items-center gap-2">
          <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
          </svg>
          <span className="text-sm">Coach video coming soon</span>
        </div>
      </div>

      {/* Exercise Name */}
      <h1 className="text-3xl font-bold text-gray-900">{exercise.name}</h1>
      <p className="mt-1 text-sm text-gray-500">
        {categoryLabel(exercise.category)} {' \u00B7 '} {difficultyDots[exercise.difficulty]} {difficultyLabel(exercise.difficulty)}
      </p>

      {/* Primary / Secondary Muscles */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Primary</h3>
          <ul className="mt-1 space-y-0.5">
            {primaryMuscles.map((m) => (
              <li key={m} className="text-sm text-gray-700">{muscleGroupLabel(m as MuscleGroup)}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Secondary</h3>
          <ul className="mt-1 space-y-0.5">
            {secondaryMuscles.length > 0 ? (
              secondaryMuscles.map((m) => (
                <li key={m} className="text-sm text-gray-700">{muscleGroupLabel(m as MuscleGroup)}</li>
              ))
            ) : (
              <li className="text-sm text-gray-400">None</li>
            )}
          </ul>
        </div>
      </div>

      {/* Mini Body Map (read-only) */}
      <div className="mt-6 flex gap-4 justify-center">
        <div className="w-32">
          <p className="text-center text-xs text-gray-400 mb-1">Front</p>
          <Model
            type="anterior"
            data={allHighlight as any}
            bodyColor="#E5E7EB"
            highlightedColors={['#A5B4FC', '#6366F1']}
            style={{ width: '100%', pointerEvents: 'none' }}
          />
        </div>
        <div className="w-32">
          <p className="text-center text-xs text-gray-400 mb-1">Back</p>
          <Model
            type="posterior"
            data={allHighlight as any}
            bodyColor="#E5E7EB"
            highlightedColors={['#A5B4FC', '#6366F1']}
            style={{ width: '100%', pointerEvents: 'none' }}
          />
        </div>
      </div>

      {/* Description */}
      <div className="mt-6">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Description</h3>
        <p className="mt-1 text-sm leading-relaxed text-gray-700">{exercise.description}</p>
      </div>

      {/* Action Buttons (stubs) */}
      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={handleStartWorkout}
          disabled={startingWorkout}
          className="flex-1 rounded-lg bg-indigo-500 py-3 text-center font-semibold text-white hover:bg-indigo-600 transition-colors"
        >
          {startingWorkout ? 'Starting...' : 'Start Workout'}
        </button>
        <button
          type="button"
          onClick={handleAddToWorkout}
          className="flex-1 rounded-lg border border-indigo-500 py-3 text-center font-semibold text-indigo-500 hover:bg-indigo-50 transition-colors"
        >
          Add to Workout
        </button>
      </div>
    </div>
  );
}
