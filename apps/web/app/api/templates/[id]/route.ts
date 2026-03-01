import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../lib/database';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getDb();
  const row = db.query<Record<string, unknown>>(
    'SELECT * FROM routine_templates WHERE id = ? LIMIT 1',
    [id],
  )[0];

  if (!row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(row);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getDb();
  db.execute('DELETE FROM routine_templates WHERE id = ?', [id]);
  return NextResponse.json({ ok: true });
}
