import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../lib/database';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { templateId } = body;

  if (!templateId) {
    return NextResponse.json({ error: 'Missing templateId' }, { status: 400 });
  }

  const db = getDb();

  // Fetch the template
  const template = db.query<Record<string, unknown>>(
    'SELECT * FROM routine_templates WHERE id = ? LIMIT 1',
    [templateId],
  )[0];

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  // Create a workout from the template
  const workoutId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  db.execute(
    `INSERT INTO workouts (id, title, description, creator_id, difficulty, exercises, estimated_duration, is_premium, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      workoutId,
      template.title as string,
      (template.description as string) ?? '',
      'local-user',
      template.difficulty as string,
      template.exercises as string,
      0,
      0,
      new Date().toISOString(),
    ],
  );

  // Increment clone count
  db.execute(
    'UPDATE routine_templates SET clone_count = clone_count + 1 WHERE id = ?',
    [templateId],
  );

  return NextResponse.json({ workoutId });
}
