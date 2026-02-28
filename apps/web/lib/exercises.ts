import { type Exercise, getDefaultExercises } from '@myworkouts/shared';

const fallbackExercises = [...getDefaultExercises()].sort((a, b) =>
  a.name.localeCompare(b.name),
);

const fallbackById = new Map(fallbackExercises.map((exercise) => [exercise.id, exercise]));

/**
 * Load exercises. In SQLite mode this returns the default catalog directly
 * (the DB seed also uses this catalog). Client components use this for
 * immediate in-memory access without a server round-trip.
 */
export async function loadExercisesWithFallback(): Promise<Exercise[]> {
  return fallbackExercises;
}

export function findFallbackExercise(id: string): Exercise | null {
  return fallbackById.get(id) ?? null;
}
