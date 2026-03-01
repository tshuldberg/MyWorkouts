import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../lib/database';

const LOCAL_USER_ID = 'local-user';

function ensureUser() {
  const db = getDb();
  const rows = db.query<{ id: string }>('SELECT id FROM users WHERE id = ?', [LOCAL_USER_ID]);
  if (rows.length === 0) {
    db.execute(
      'INSERT INTO users (id, email, display_name, subscription_tier) VALUES (?, ?, ?, ?)',
      [LOCAL_USER_ID, 'local@myworkouts.app', 'You', 'premium'],
    );
  }
}

export async function GET() {
  ensureUser();
  const db = getDb();
  const rows = db.query(
    'SELECT * FROM progress_photos WHERE user_id = ? ORDER BY taken_at DESC',
    [LOCAL_USER_ID],
  );
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  ensureUser();
  const db = getDb();
  const body = await req.json();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  db.execute(
    'INSERT INTO progress_photos (id, user_id, photo_uri, view_type, notes, taken_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, LOCAL_USER_ID, body.photo_uri, body.view_type, body.notes, body.taken_at],
  );

  return NextResponse.json({ id }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  ensureUser();
  const db = getDb();
  const body = await req.json();

  db.execute('DELETE FROM progress_photos WHERE id = ? AND user_id = ?', [
    body.id,
    LOCAL_USER_ID,
  ]);

  return NextResponse.json({ ok: true });
}
