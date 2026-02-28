import { getDefaultExercises } from '@myworkouts/shared';
import type { DatabaseAdapter } from '../database';

export function seedExerciseLibrary(db: DatabaseAdapter): number {
  const existing = db.query<{ c: number }>(
    'SELECT COUNT(*) as c FROM exercises',
  )[0]?.c ?? 0;
  if (existing > 0) return 0;

  const exercises = getDefaultExercises();
  const createdAt = new Date().toISOString();

  db.transaction(() => {
    for (const ex of exercises) {
      db.execute(
        `INSERT INTO exercises (
          id, name, description, category, muscle_groups, difficulty,
          video_url, thumbnail_url, audio_cues, is_premium, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ex.id,
          ex.name,
          ex.description,
          ex.category,
          JSON.stringify(ex.muscle_groups),
          ex.difficulty,
          ex.video_url,
          ex.thumbnail_url,
          JSON.stringify(ex.audio_cues),
          ex.is_premium ? 1 : 0,
          ex.created_at ?? createdAt,
        ],
      );
    }
  });

  return exercises.length;
}

export function seedDefaultUser(db: DatabaseAdapter): void {
  const existing = db.query<{ c: number }>(
    "SELECT COUNT(*) as c FROM users WHERE id = 'local-user'",
  )[0]?.c ?? 0;
  if (existing > 0) return;

  db.execute(
    `INSERT INTO users (id, email, display_name, subscription_tier, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      'local-user',
      'user@myworkouts.local',
      'Local User',
      'premium',
      new Date().toISOString(),
    ],
  );
}
