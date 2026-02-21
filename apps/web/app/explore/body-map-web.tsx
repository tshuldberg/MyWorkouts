'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  MuscleGroup,
  MUSCLE_GROUP_TO_SLUGS,
  muscleGroupLabel,
} from '@myworkouts/shared';
import type { IMuscleStats } from 'react-body-highlighter';

// Dynamic import to avoid SSR issues with the SVG-based body highlighter
const Model = dynamic(() => import('react-body-highlighter'), { ssr: false });

// Map react-body-highlighter muscle slugs to our MuscleGroup enum.
// This library uses slightly different slugs than react-native-body-highlighter.
const WEB_SLUG_TO_MUSCLE_GROUP: Record<string, MuscleGroup> = {
  'chest': MuscleGroup.Chest,
  'upper-back': MuscleGroup.Back,
  'lower-back': MuscleGroup.Back,
  'front-deltoids': MuscleGroup.Shoulders,
  'back-deltoids': MuscleGroup.Shoulders,
  'biceps': MuscleGroup.Biceps,
  'triceps': MuscleGroup.Triceps,
  'forearm': MuscleGroup.Forearms,
  'abs': MuscleGroup.Core,
  'obliques': MuscleGroup.Core,
  'quadriceps': MuscleGroup.Quads,
  'hamstring': MuscleGroup.Hamstrings,
  'gluteal': MuscleGroup.Glutes,
  'calves': MuscleGroup.Calves,
  'adductor': MuscleGroup.HipFlexors,
  'abductors': MuscleGroup.HipFlexors,
  'neck': MuscleGroup.Neck,
  'trapezius': MuscleGroup.Back,
  'knees': MuscleGroup.Quads,
};

// Map our MuscleGroup to the web library's slug names for highlighting
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
};

interface BodyMapWebProps {
  selectedMuscles: MuscleGroup[];
  onToggleMuscle: (muscle: MuscleGroup) => void;
  onClearMuscles: () => void;
}

export function BodyMapWeb({ selectedMuscles, onToggleMuscle, onClearMuscles }: BodyMapWebProps) {
  const [side, setSide] = useState<'anterior' | 'posterior'>('anterior');

  const handleClick = useCallback(
    (muscleStats: IMuscleStats) => {
      const slug = muscleStats.muscle;
      const group = WEB_SLUG_TO_MUSCLE_GROUP[slug];
      if (group) {
        onToggleMuscle(group);
      }
    },
    [onToggleMuscle]
  );

  // Build highlight data for the library
  const highlightData = selectedMuscles.flatMap((group) => {
    const slugs = WEB_MUSCLE_GROUP_TO_SLUGS[group] ?? MUSCLE_GROUP_TO_SLUGS[group] ?? [];
    return slugs.map((slug) => ({
      name: muscleGroupLabel(group),
      muscles: [slug],
      frequency: 1,
    }));
  });

  return (
    <div className="flex flex-col items-center">
      {/* Front/Back Toggle */}
      <div className="mb-4 flex rounded-lg border border-gray-200 overflow-hidden">
        <button
          type="button"
          className={`px-6 py-2 text-sm font-medium transition-colors ${
            side === 'anterior'
              ? 'bg-indigo-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
          onClick={() => setSide('anterior')}
        >
          FRONT
        </button>
        <button
          type="button"
          className={`px-6 py-2 text-sm font-medium transition-colors ${
            side === 'posterior'
              ? 'bg-indigo-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
          onClick={() => setSide('posterior')}
        >
          BACK
        </button>
      </div>

      {/* Body Map SVG */}
      <div className="w-full max-w-[280px]">
        <Model
          type={side}
          data={highlightData as any}
          onClick={handleClick as any}
          bodyColor="#E5E7EB"
          highlightedColors={['#6366F1']}
          style={{ width: '100%', cursor: 'pointer' }}
        />
      </div>

      {/* Selected Muscles Chip Bar */}
      <div className="mt-4 flex flex-wrap items-center gap-2 min-h-[36px]">
        {selectedMuscles.length === 0 ? (
          <span className="text-sm text-gray-400">All Muscles</span>
        ) : (
          <>
            {selectedMuscles.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onToggleMuscle(m)}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700 hover:bg-indigo-200 transition-colors"
              >
                {muscleGroupLabel(m)}
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            ))}
            <button
              type="button"
              onClick={onClearMuscles}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Clear all
            </button>
          </>
        )}
      </div>
    </div>
  );
}
