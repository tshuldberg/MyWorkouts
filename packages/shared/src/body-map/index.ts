import { MuscleGroup } from '../types/index.js';

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
