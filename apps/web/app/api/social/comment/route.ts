import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../lib/database';

const LOCAL_USER_ID = 'local-user';

export async function GET(req: NextRequest) {
  const db = getDb();
  const postId = req.nextUrl.searchParams.get('post_id');
  if (!postId) {
    return NextResponse.json({ error: 'post_id required' }, { status: 400 });
  }

  const comments = db.query(
    `SELECT c.*, u.display_name as user_display_name, u.avatar_url as user_avatar_url
     FROM social_comments c
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.post_id = ?
     ORDER BY c.created_at ASC`,
    [postId],
  );

  return NextResponse.json(comments);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  db.execute(
    'INSERT INTO social_comments (id, user_id, post_id, body, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, LOCAL_USER_ID, body.post_id, body.body, new Date().toISOString()],
  );

  return NextResponse.json({ id }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const db = getDb();
  const body = await req.json();

  db.execute('DELETE FROM social_comments WHERE id = ? AND user_id = ?', [
    body.id,
    LOCAL_USER_ID,
  ]);

  return NextResponse.json({ ok: true });
}
