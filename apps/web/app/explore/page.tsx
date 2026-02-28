'use client';

import { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Category, type Exercise, type MuscleGroup, getFilteredExercises, muscleGroupLabel } from '@myworkouts/shared';
import { useExerciseStore } from '../../lib/exercise-store';
import { BodyMapWeb } from './body-map-web';
import { workoutsPath } from '../../lib/routes';
import { loadExercisesWithFallback } from '../../lib/exercises';

const CATEGORIES = [
  { value: null, label: 'All' },
  { value: Category.Strength, label: 'Strength' },
  { value: Category.Cardio, label: 'Cardio' },
  { value: Category.Mobility, label: 'Mobility' },
  { value: Category.Fascia, label: 'Fascia' },
  { value: Category.Recovery, label: 'Recovery' },
  { value: Category.Flexibility, label: 'Flexibility' },
  { value: Category.Balance, label: 'Balance' },
] as const;

const difficultyDots: Record<string, string> = {
  beginner: '\u25CF\u25CB\u25CB',
  intermediate: '\u25CF\u25CF\u25CB',
  advanced: '\u25CF\u25CF\u25CF',
};

function formatMuscleGroups(groups: string[], max = 3): string {
  const labels = groups.map((g) =>
    g.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
  if (labels.length <= max) return labels.join(', ');
  return labels.slice(0, max).join(', ') + ` +${labels.length - max} more`;
}

function categoryIcon(category: string): string {
  const icons: Record<string, string> = {
    strength: '\uD83D\uDCAA',
    cardio: '\uD83C\uDFC3',
    mobility: '\uD83E\uDDD8',
    fascia: '\uD83E\uDEE8',
    recovery: '\uD83D\uDE4F',
    flexibility: '\uD83E\uDD38',
    balance: '\u2696\uFE0F',
  };
  return icons[category] ?? '\uD83C\uDFCB\uFE0F';
}

export default function ExplorePage() {
  const router = useRouter();
  const store = useExerciseStore();
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(store.exercises.length === 0);

  const filtered = useMemo(() => getFilteredExercises(store), [
    store.exercises,
    store.selectedMuscles,
    store.selectedCategory,
    store.searchQuery,
  ]);

  // Load exercises on mount
  useEffect(() => {
    let active = true;

    if (store.exercises.length > 0) {
      setLoading(false);
      return () => {
        active = false;
      };
    }

    void (async () => {
      const exercises = await loadExercisesWithFallback();
      if (!active) return;
      store.setExercises(exercises);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  // Debounced search
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => {
        store.setSearchQuery(value);
      }, 300);
    },
    [store]
  );

  // Count exercises per category for pills
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    let base = store.exercises;
    if (store.selectedMuscles.length > 0) {
      base = base.filter((e) =>
        store.selectedMuscles.some((m) => e.muscle_groups.includes(m))
      );
    }
    for (const e of base) {
      counts[e.category] = (counts[e.category] ?? 0) + 1;
    }
    counts['all'] = base.length;
    return counts;
  }, [store.exercises, store.selectedMuscles]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Explore</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column: Body Map */}
        <div className="lg:w-[340px] flex-shrink-0">
          <BodyMapWeb
            selectedMuscles={store.selectedMuscles}
            onToggleMuscle={store.toggleMuscle}
            onClearMuscles={store.clearMuscles}
          />
        </div>

        {/* Right Column: Filters + Exercise List */}
        <div className="flex-1 min-w-0">
          {/* Category Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
            {CATEGORIES.map((cat) => {
              const isActive = store.selectedCategory === cat.value;
              const count = cat.value === null
                ? categoryCounts['all'] ?? 0
                : categoryCounts[cat.value] ?? 0;
              return (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => store.setCategory(isActive ? null : cat.value)}
                  className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors flex-shrink-0 ${
                    isActive
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search exercises..."
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>

          {/* Exercise List */}
          <div className="space-y-2">
            {!loading && filtered.length === 0 && (
              <p className="py-8 text-center text-gray-400">
                No exercises match your filters.
              </p>
            )}
            {loading && (
              <p className="py-8 text-center text-gray-400">Loading exercises...</p>
            )}
            {filtered.map((exercise) => (
              <button
                key={exercise.id}
                type="button"
                onClick={() => router.push(workoutsPath(`/exercise/${exercise.id}`))}
                className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left hover:border-indigo-200 hover:shadow-sm transition-all"
              >
                {/* Thumbnail */}
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xl">
                  {exercise.thumbnail_url ? (
                    <img
                      src={exercise.thumbnail_url}
                      alt={exercise.name}
                      className="h-full w-full rounded-lg object-cover"
                    />
                  ) : (
                    categoryIcon(exercise.category)
                  )}
                </div>
                {/* Text */}
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-900">{exercise.name}</div>
                  <div className="text-xs text-gray-500">
                    {exercise.category.charAt(0).toUpperCase() + exercise.category.slice(1)}
                    {' \u00B7 '}
                    {difficultyDots[exercise.difficulty]} {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatMuscleGroups(exercise.muscle_groups)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
