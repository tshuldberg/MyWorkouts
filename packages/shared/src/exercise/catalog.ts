import type { Exercise, MuscleGroup, Category, Difficulty } from '../types/index';
import seedRaw from './catalog-seed.json';

interface SeedExercise {
  name: string;
  description: string;
  category: Category;
  muscleGroups: MuscleGroup[];
  difficulty: Difficulty;
  audioCueText: string;
}

const seed = seedRaw as SeedExercise[];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const createdAt = new Date('2026-02-20T00:00:00.000Z').toISOString();

export const DEFAULT_EXERCISES: Exercise[] = seed.map((item, index) => ({
  id: `seed-${slugify(item.name)}-${index + 1}`,
  name: item.name,
  description: item.description,
  category: item.category,
  muscle_groups: item.muscleGroups,
  video_url: null,
  thumbnail_url: null,
  difficulty: item.difficulty,
  audio_cues: [
    {
      timestamp: 0,
      text: item.audioCueText,
      type: 'instruction',
    },
  ],
  is_premium: false,
  created_at: createdAt,
}));

export function getDefaultExercises(): Exercise[] {
  return DEFAULT_EXERCISES;
}
