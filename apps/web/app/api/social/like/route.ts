import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../lib/database';

const LOCAL_USER_ID = 'local-user';

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { post_id } = body;

  // Check if already liked
  const existing = db.query<{ id: string }>(
    'SELECT id FROM social_likes WHERE user_id = ? AND post_id = ?',
    [LOCAL_USER_ID, post_id],
  );

  if (existing.length > 0) {
    // Unlike
    db.execute('DELETE FROM social_likes WHERE user_id = ? AND post_id = ?', [
      LOCAL_USER_ID,
      post_id,
    ]);
    return NextResponse.json({ liked: false });
  }

  // Like
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  db.execute(
    'INSERT INTO social_likes (id, user_id, post_id, created_at) VALUES (?, ?, ?, ?)',
    [id, LOCAL_USER_ID, post_id, new Date().toISOString()],
  );

  return NextResponse.json({ liked: true });
}
