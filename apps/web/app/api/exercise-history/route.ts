import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../lib/database';

export async function GET(request: NextRequest) {
  const exerciseId = request.nextUrl.searchParams.get('exerciseId');
  if (!exerciseId) {
    return NextResponse.json([], { status: 400 });
  }

  const db = getDb();
  const rows = db.query<Record<string, unknown>>(
    `SELECT * FROM exercise_1rm_history
     WHERE exercise_id = ?
     ORDER BY recorded_at ASC`,
    [exerciseId],
  );

  return NextResponse.json(rows);
}
