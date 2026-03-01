import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/database';

export async function GET() {
  const db = getDb();
  const rows = db.query<Record<string, unknown>>(
    'SELECT * FROM routine_templates ORDER BY created_at DESC',
  );
  return NextResponse.json(rows);
}
