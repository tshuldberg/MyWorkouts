import { MuscleGroup } from '../types/index';

export interface MuscleGroupDefinition {
  id: MuscleGroup;
  label: string;
  region: 'upper' | 'core' | 'lower';
  side: 'front' | 'back' | 'both';
}

export const MUSCLE_GROUPS: MuscleGroupDefinition[] = [
  { id: MuscleGroup.Chest, label: 'Chest', region: 'upper', side: 'front' },
  { id: MuscleGroup.Back, label: 'Back', region: 'upper', side: 'back' },
  { id: MuscleGroup.Shoulders, label: 'Shoulders', region: 'upper', side: 'both' },
  { id: MuscleGroup.Biceps, label: 'Biceps', region: 'upper', side: 'front' },
  { id: MuscleGroup.Triceps, label: 'Triceps', region: 'upper', side: 'back' },
  { id: MuscleGroup.Forearms, label: 'Forearms', region: 'upper', side: 'both' },
  { id: MuscleGroup.Core, label: 'Core', region: 'core', side: 'front' },
  { id: MuscleGroup.Quads, label: 'Quadriceps', region: 'lower', side: 'front' },
  { id: MuscleGroup.Hamstrings, label: 'Hamstrings', region: 'lower', side: 'back' },
  { id: MuscleGroup.Glutes, label: 'Glutes', region: 'lower', side: 'back' },
  { id: MuscleGroup.Calves, label: 'Calves', region: 'lower', side: 'back' },
  { id: MuscleGroup.HipFlexors, label: 'Hip Flexors', region: 'lower', side: 'front' },
  { id: MuscleGroup.Neck, label: 'Neck', region: 'upper', side: 'both' },
  { id: MuscleGroup.FullBody, label: 'Full Body', region: 'core', side: 'both' },
];

// ── Body Map Library Slug Mappings ──
// Maps react-native-body-highlighter / react-body-highlighter slugs
// to our MuscleGroup enum.

export const SLUG_TO_MUSCLE_GROUP: Record<string, MuscleGroup> = {
  'chest': MuscleGroup.Chest,
  'upper-back': MuscleGroup.Back,
  'lower-back': MuscleGroup.Back,
  'deltoids': MuscleGroup.Shoulders,
  'biceps': MuscleGroup.Biceps,
  'triceps': MuscleGroup.Triceps,
  'forearm': MuscleGroup.Forearms,
  'abs': MuscleGroup.Core,
  'obliques': MuscleGroup.Core,
  'quadriceps': MuscleGroup.Quads,
  'hamstring': MuscleGroup.Hamstrings,
  'gluteal': MuscleGroup.Glutes,
  'calves': MuscleGroup.Calves,
  'adductors': MuscleGroup.HipFlexors,
  'neck': MuscleGroup.Neck,
};

export const MUSCLE_GROUP_TO_SLUGS: Record<MuscleGroup, string[]> = {
  [MuscleGroup.Chest]: ['chest'],
  [MuscleGroup.Back]: ['upper-back', 'lower-back'],
  [MuscleGroup.Shoulders]: ['deltoids'],
  [MuscleGroup.Biceps]: ['biceps'],
  [MuscleGroup.Triceps]: ['triceps'],
  [MuscleGroup.Forearms]: ['forearm'],
  [MuscleGroup.Core]: ['abs', 'obliques'],
  [MuscleGroup.Quads]: ['quadriceps'],
  [MuscleGroup.Hamstrings]: ['hamstring'],
  [MuscleGroup.Glutes]: ['gluteal'],
  [MuscleGroup.Calves]: ['calves'],
  [MuscleGroup.HipFlexors]: ['adductors'],
  [MuscleGroup.Neck]: ['neck'],
  [MuscleGroup.FullBody]: [
    'chest', 'upper-back', 'lower-back', 'deltoids', 'biceps', 'triceps',
    'forearm', 'abs', 'obliques', 'quadriceps', 'hamstring', 'gluteal',
    'calves', 'adductors', 'neck',
  ],
};

export function slugToMuscleGroup(slug: string): MuscleGroup | undefined {
  return SLUG_TO_MUSCLE_GROUP[slug];
}

export function muscleGroupToSlugs(group: MuscleGroup): string[] {
  return MUSCLE_GROUP_TO_SLUGS[group] ?? [];
}

export function muscleGroupLabel(group: MuscleGroup): string {
  return MUSCLE_GROUPS.find((g) => g.id === group)?.label ?? group;
}

// ── Body Map Highlight Data Builder ──
// Converts selected MuscleGroup[] into the data array expected by the body-highlighter libs.

export interface BodyHighlightDatum {
  slug: string;
  intensity: number;
  color?: string;
}

export function buildHighlightData(
  selectedGroups: MuscleGroup[],
  color = '#6366F1',
): BodyHighlightDatum[] {
  const data: BodyHighlightDatum[] = [];
  for (const group of selectedGroups) {
    for (const slug of muscleGroupToSlugs(group)) {
      data.push({ slug, intensity: 2, color });
    }
  }
  return data;
}

// ── Exercise Muscle Mapping (kept for backward compat) ──

export interface ExerciseMuscleMapping {
  exerciseName: string;
  primary: MuscleGroup[];
  secondary: MuscleGroup[];
}

export const EXERCISE_MUSCLE_MAPPINGS: ExerciseMuscleMapping[] = [
  { exerciseName: 'Push-up', primary: [MuscleGroup.Chest], secondary: [MuscleGroup.Triceps, MuscleGroup.Shoulders, MuscleGroup.Core] },
  { exerciseName: 'Pull-up', primary: [MuscleGroup.Back], secondary: [MuscleGroup.Biceps, MuscleGroup.Forearms] },
  { exerciseName: 'Squat', primary: [MuscleGroup.Quads, MuscleGroup.Glutes], secondary: [MuscleGroup.Hamstrings, MuscleGroup.Core] },
  { exerciseName: 'Deadlift', primary: [MuscleGroup.Back, MuscleGroup.Hamstrings, MuscleGroup.Glutes], secondary: [MuscleGroup.Core, MuscleGroup.Forearms] },
  { exerciseName: 'Plank', primary: [MuscleGroup.Core], secondary: [MuscleGroup.Shoulders] },
  { exerciseName: 'Lunge', primary: [MuscleGroup.Quads, MuscleGroup.Glutes], secondary: [MuscleGroup.Hamstrings, MuscleGroup.Core] },
  { exerciseName: 'Shoulder Press', primary: [MuscleGroup.Shoulders], secondary: [MuscleGroup.Triceps, MuscleGroup.Core] },
  { exerciseName: 'Bicep Curl', primary: [MuscleGroup.Biceps], secondary: [MuscleGroup.Forearms] },
  { exerciseName: 'Tricep Dip', primary: [MuscleGroup.Triceps], secondary: [MuscleGroup.Chest, MuscleGroup.Shoulders] },
  { exerciseName: 'Calf Raise', primary: [MuscleGroup.Calves], secondary: [] },
  { exerciseName: 'Hip Thrust', primary: [MuscleGroup.Glutes], secondary: [MuscleGroup.Hamstrings, MuscleGroup.Core] },
  { exerciseName: 'Burpee', primary: [MuscleGroup.FullBody], secondary: [MuscleGroup.Chest, MuscleGroup.Quads, MuscleGroup.Core] },
];

export function getExercisesForMuscleGroup(muscleGroup: MuscleGroup): ExerciseMuscleMapping[] {
  return EXERCISE_MUSCLE_MAPPINGS.filter(
    (m) => m.primary.includes(muscleGroup) || m.secondary.includes(muscleGroup)
  );
}

export function getMuscleGroupsByRegion(region: 'upper' | 'core' | 'lower'): MuscleGroupDefinition[] {
  return MUSCLE_GROUPS.filter((g) => g.region === region);
}
