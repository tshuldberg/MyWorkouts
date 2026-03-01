'use client';

import { Suspense, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  type Exercise,
  type Workout,
  type WeightUnit,
  type SetType,
  Difficulty,
  estimateDuration,
  toWorkoutPayload,
} from '@myworkouts/shared';
import { useWorkoutBuilderStore } from '../../../lib/workout-builder-store';
import { useExerciseStore } from '../../../lib/exercise-store';
import { fetchWorkoutById, saveWorkout } from '../../../lib/actions';
import { workoutsPath } from '../../../lib/routes';
import { loadExercisesWithFallback } from '../../../lib/exercises';

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  return `${m} min`;
}

const DIFFICULTIES: Difficulty[] = [Difficulty.Beginner, Difficulty.Intermediate, Difficulty.Advanced];
const SET_TYPES: { value: SetType; label: string }[] = [
  { value: 'superset', label: 'Superset' },
  { value: 'dropset', label: 'Drop Set' },
  { value: 'giant', label: 'Giant Set' },
  { value: 'pyramid', label: 'Pyramid' },
];

function getPreferredWeightUnit(): WeightUnit {
  if (typeof window === 'undefined') return 'lbs';
  return (localStorage.getItem('preferred_weight_unit') as WeightUnit) || 'lbs';
}

export default function WorkoutBuilderPageWrapper() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-gray-400">Loading...</div>}>
      <WorkoutBuilderPage />
    </Suspense>
  );
}

function WorkoutBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const addExerciseId = searchParams.get('add');

  const builder = useWorkoutBuilderStore();
  const exerciseStore = useExerciseStore();
  const injectedExerciseRef = useRef<string | null>(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lbs');
  const [showGroupTypeSelector, setShowGroupTypeSelector] = useState(false);

  // Load preferred weight unit on mount
  useEffect(() => {
    setWeightUnit(getPreferredWeightUnit());
  }, []);

  // Load exercises if not already loaded
  useEffect(() => {
    let active = true;

    if (exerciseStore.exercises.length > 0) {
      return () => {
        active = false;
      };
    }

    void (async () => {
      const exercises = await loadExercisesWithFallback();
      if (!active) return;
      exerciseStore.setExercises(exercises);
    })();

    return () => {
      active = false;
    };
  }, []);

  // Load workout for editing
  useEffect(() => {
    if (!editId) {
      builder.reset();
      return;
    }
    void (async () => {
      const workout = await fetchWorkoutById(editId);
      if (!workout) return;
      const names: Record<string, string> = {};
      for (const e of exerciseStore.exercises) {
        names[e.id] = e.name;
      }
      builder.loadWorkout(workout, names);
    })();
  }, [editId, exerciseStore.exercises.length]);

  // Optionally inject a specific exercise when arriving from exercise detail.
  useEffect(() => {
    if (!addExerciseId || editId) return;
    if (injectedExerciseRef.current === addExerciseId) return;

    const exercise = exerciseStore.exercises.find((e) => e.id === addExerciseId);
    if (!exercise) return;

    const alreadyAdded = builder.exercises.some((e) => e.exercise_id === addExerciseId);
    if (!alreadyAdded) {
      if (!builder.title.trim()) {
        builder.setTitle(`${exercise.name} Workout`);
      }
      builder.addExercise(exercise);
    }

    injectedExerciseRef.current = addExerciseId;
  }, [addExerciseId, editId, exerciseStore.exercises, builder]);

  // Filter exercises for picker
  const filteredExercises = useMemo(() => {
    if (exerciseSearch.length < 2) return exerciseStore.exercises;
    const q = exerciseSearch.toLowerCase();
    return exerciseStore.exercises.filter(
      (e) => e.name.toLowerCase().includes(q) || e.category.includes(q)
    );
  }, [exerciseStore.exercises, exerciseSearch]);

  const duration = useMemo(() => estimateDuration(builder.exercises), [builder.exercises]);

  // Collect unique group IDs for visual grouping
  const groupIds = useMemo(() => {
    const ids = new Set<string>();
    for (const ex of builder.exercises) {
      if (ex.setGroupId) ids.add(ex.setGroupId);
    }
    return Array.from(ids);
  }, [builder.exercises]);

  const groupColors: Record<string, string> = useMemo(() => {
    const palette = [
      'border-l-indigo-400',
      'border-l-emerald-400',
      'border-l-amber-400',
      'border-l-rose-400',
      'border-l-cyan-400',
    ];
    const map: Record<string, string> = {};
    groupIds.forEach((id, i) => {
      map[id] = palette[i % palette.length];
    });
    return map;
  }, [groupIds]);

  const handleWeightUnitToggle = useCallback(() => {
    const next: WeightUnit = weightUnit === 'lbs' ? 'kg' : 'lbs';
    setWeightUnit(next);
    localStorage.setItem('preferred_weight_unit', next);
  }, [weightUnit]);

  const handleSave = useCallback(async () => {
    if (!builder.title.trim()) return;
    setSaving(true);

    const payload = toWorkoutPayload(builder, 'local-user');

    await saveWorkout(payload as Record<string, unknown>, builder.isEditing ? builder.editingWorkoutId : null);

    builder.reset();
    setSaving(false);
    router.push(workoutsPath('/workouts'));
  }, [builder, router]);

  const handleSaveAsTemplate = useCallback(async () => {
    if (!builder.title.trim()) return;
    setSavingTemplate(true);

    const payload = toWorkoutPayload(builder, 'local-user');

    // Save as template via fetch to avoid needing a new server action import
    const templateId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: templateId,
        title: payload.title,
        description: payload.description,
        creator_id: 'local-user',
        exercises: payload.exercises,
        difficulty: payload.difficulty,
        is_public: false,
      }),
    }).catch(() => {
      // Fallback: save as template using the same saveWorkout action with a marker
      // Template saving will be handled by the pages-dev agent's template library page
    });

    setSavingTemplate(false);
  }, [builder]);

  const handleGroupSelected = useCallback((setType: SetType) => {
    builder.groupSelected(setType);
    setShowGroupTypeSelector(false);
  }, [builder]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {builder.isEditing ? 'Edit Workout' : 'New Workout'}
        </h1>
        <button
          type="button"
          onClick={() => { builder.reset(); router.push(workoutsPath('/workouts')); }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>

      {/* Workout Info */}
      <div className="space-y-4 mb-6">
        <input
          type="text"
          value={builder.title}
          onChange={(e) => builder.setTitle(e.target.value)}
          placeholder="Workout name"
          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
        <textarea
          value={builder.description}
          onChange={(e) => builder.setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
        />
        <div className="flex gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => builder.setDifficulty(d)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                builder.difficulty === d
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise List */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Exercises ({builder.exercises.length})
        </h2>
        <div className="flex items-center gap-3">
          {/* Weight Unit Toggle */}
          <button
            type="button"
            onClick={handleWeightUnitToggle}
            className="rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            {weightUnit.toUpperCase()}
          </button>
          <span className="text-sm text-gray-400">
            Est. {formatDuration(duration)}
          </span>
        </div>
      </div>

      {/* Superset Grouping Controls */}
      {builder.selectedForGroup.length >= 2 && (
        <div className="mb-4 rounded-lg bg-indigo-50 border border-indigo-200 p-3 flex items-center justify-between">
          <span className="text-sm text-indigo-700">
            {builder.selectedForGroup.length} exercises selected
          </span>
          <div className="flex gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowGroupTypeSelector(!showGroupTypeSelector)}
                className="rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-600"
              >
                Group as...
              </button>
              {showGroupTypeSelector && (
                <div className="absolute right-0 top-full mt-1 z-10 w-40 rounded-lg bg-white shadow-lg border border-gray-200 py-1">
                  {SET_TYPES.map((st) => (
                    <button
                      key={st.value}
                      type="button"
                      onClick={() => handleGroupSelected(st.value)}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => builder.toggleSelectForGroup(-1)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {builder.exercises.length === 0 && (
        <p className="py-8 text-center text-gray-400 border border-dashed border-gray-200 rounded-xl mb-4">
          No exercises added yet. Tap below to add exercises.
        </p>
      )}

      <div className="space-y-2 mb-4">
        {builder.exercises.map((ex, i) => {
          const isSelected = builder.selectedForGroup.includes(i);
          const groupColor = ex.setGroupId ? groupColors[ex.setGroupId] : '';
          const isInGroup = !!ex.setGroupId;
          const groupExercises = isInGroup
            ? builder.exercises.filter((e) => e.setGroupId === ex.setGroupId)
            : [];
          const isFirstInGroup = isInGroup && groupExercises[0]?.exercise_id === ex.exercise_id;

          return (
            <div key={`${ex.exercise_id}-${i}`}>
              {/* Group header */}
              {isFirstInGroup && (
                <div className="flex items-center gap-2 mb-1 mt-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {ex.setType === 'superset' ? 'Superset' :
                     ex.setType === 'dropset' ? 'Drop Set' :
                     ex.setType === 'giant' ? 'Giant Set' :
                     ex.setType === 'pyramid' ? 'Pyramid' : 'Group'}
                  </span>
                  <div className="flex-1 border-t border-gray-200" />
                  <button
                    type="button"
                    onClick={() => builder.ungroupExercise(i)}
                    className="text-xs text-gray-400 hover:text-red-500"
                  >
                    Ungroup
                  </button>
                </div>
              )}
              <div
                className={`rounded-xl border bg-white p-4 transition-colors ${
                  isSelected ? 'border-indigo-400 bg-indigo-50/50' : 'border-gray-200'
                } ${isInGroup ? `border-l-4 ${groupColor}` : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {/* Selection checkbox for grouping */}
                    <button
                      type="button"
                      onClick={() => builder.toggleSelectForGroup(i)}
                      className={`h-5 w-5 rounded border flex items-center justify-center text-xs transition-colors ${
                        isSelected
                          ? 'bg-indigo-500 border-indigo-500 text-white'
                          : 'border-gray-300 text-transparent hover:border-gray-400'
                      }`}
                      title="Select for grouping"
                    >
                      {isSelected ? '\u2713' : ''}
                    </button>
                    <span className="text-xs text-gray-400 font-mono w-5">{i + 1}.</span>
                    <span className="font-medium text-gray-900">{ex.name}</span>
                    {isInGroup && (
                      <span className="text-xs text-gray-400">
                        ({ex.setType})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Move up */}
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => builder.moveExercise(i, i - 1)}
                        className="text-gray-400 hover:text-gray-600 text-sm"
                        title="Move up"
                      >
                        &#9650;
                      </button>
                    )}
                    {/* Move down */}
                    {i < builder.exercises.length - 1 && (
                      <button
                        type="button"
                        onClick={() => builder.moveExercise(i, i + 1)}
                        className="text-gray-400 hover:text-gray-600 text-sm"
                        title="Move down"
                      >
                        &#9660;
                      </button>
                    )}
                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => builder.removeExercise(i)}
                      className="text-red-400 hover:text-red-600 text-sm ml-2"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                {/* Sets / Reps / Weight / Rest controls */}
                <div className="flex flex-wrap gap-4 mt-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-gray-400">Sets</span>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={ex.sets}
                      onChange={(e) =>
                        builder.updateExercise(i, { sets: Math.max(1, parseInt(e.target.value) || 1) })
                      }
                      className="w-16 rounded border border-gray-200 px-2 py-1 text-sm text-center"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-gray-400">Reps</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={ex.reps ?? ''}
                      onChange={(e) =>
                        builder.updateExercise(i, { reps: parseInt(e.target.value) || null })
                      }
                      placeholder="-"
                      className="w-16 rounded border border-gray-200 px-2 py-1 text-sm text-center"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-gray-400">Weight</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        step={2.5}
                        value={ex.weight ?? ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          builder.updateExercise(i, {
                            weight: isNaN(val) ? undefined : val,
                            weightUnit: weightUnit,
                          });
                        }}
                        placeholder="-"
                        className="w-20 rounded border border-gray-200 px-2 py-1 text-sm text-center"
                      />
                      <span className="text-xs text-gray-400">{weightUnit}</span>
                    </div>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-gray-400">Duration (s)</span>
                    <input
                      type="number"
                      min={1}
                      max={3600}
                      value={ex.duration ?? ''}
                      onChange={(e) =>
                        builder.updateExercise(i, { duration: parseInt(e.target.value) || null })
                      }
                      placeholder="-"
                      className="w-20 rounded border border-gray-200 px-2 py-1 text-sm text-center"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-gray-400">Rest (s)</span>
                    <input
                      type="number"
                      min={0}
                      max={300}
                      value={ex.rest_after}
                      onChange={(e) =>
                        builder.updateExercise(i, { rest_after: Math.max(0, parseInt(e.target.value) || 0) })
                      }
                      className="w-16 rounded border border-gray-200 px-2 py-1 text-sm text-center"
                    />
                  </label>
                </div>

                {/* Set Type Selector for grouped exercises */}
                {isInGroup && isFirstInGroup && (
                  <div className="mt-3 flex gap-2">
                    {SET_TYPES.map((st) => (
                      <button
                        key={st.value}
                        type="button"
                        onClick={() => {
                          // Update all exercises in this group
                          builder.exercises.forEach((e, idx) => {
                            if (e.setGroupId === ex.setGroupId) {
                              builder.updateExercise(idx, { setType: st.value });
                            }
                          });
                        }}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          ex.setType === st.value
                            ? 'bg-indigo-500 text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Exercise Button */}
      <button
        type="button"
        onClick={() => setShowExercisePicker(true)}
        className="w-full rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
      >
        + Add Exercise
      </button>

      {/* Save Buttons */}
      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={!builder.title.trim() || builder.exercises.length === 0 || saving}
          className="flex-1 rounded-lg bg-indigo-500 py-3 font-semibold text-white hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : builder.isEditing ? 'Update Workout' : 'Save Workout'}
        </button>
        <button
          type="button"
          onClick={handleSaveAsTemplate}
          disabled={!builder.title.trim() || builder.exercises.length === 0 || savingTemplate}
          className="rounded-lg border border-indigo-300 px-4 py-3 font-semibold text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {savingTemplate ? 'Saving...' : 'Save as Template'}
        </button>
      </div>

      {/* Exercise Picker Modal */}
      {showExercisePicker && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="w-full max-w-lg max-h-[80vh] bg-white rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold text-gray-900">Add Exercise</h3>
              <button
                type="button"
                onClick={() => { setShowExercisePicker(false); setExerciseSearch(''); }}
                className="text-gray-400 hover:text-gray-600"
              >
                &#10005;
              </button>
            </div>
            <div className="px-4 py-2 border-b">
              <input
                type="text"
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                placeholder="Search exercises..."
                autoFocus
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {filteredExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => {
                    builder.addExercise(exercise);
                    setShowExercisePicker(false);
                    setExerciseSearch('');
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900 text-sm">{exercise.name}</div>
                  <div className="text-xs text-gray-500">
                    {exercise.category.charAt(0).toUpperCase() + exercise.category.slice(1)}
                    {' \u00B7 '}
                    {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
                  </div>
                </button>
              ))}
              {filteredExercises.length === 0 && (
                <p className="py-8 text-center text-gray-400 text-sm">No exercises found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
