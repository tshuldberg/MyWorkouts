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

  // Get posts with like/comment counts
  const posts = db.query<Record<string, unknown>>(
    `SELECT
      p.*,
      u.display_name as user_display_name,
      u.avatar_url as user_avatar_url,
      (SELECT COUNT(*) FROM social_likes WHERE post_id = p.id) as like_count,
      (SELECT COUNT(*) FROM social_comments WHERE post_id = p.id) as comment_count,
      (SELECT COUNT(*) FROM social_likes WHERE post_id = p.id AND user_id = ?) as user_liked
    FROM social_posts p
    LEFT JOIN users u ON u.id = p.user_id
    ORDER BY p.created_at DESC
    LIMIT 50`,
    [LOCAL_USER_ID],
  );

  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  ensureUser();
  const db = getDb();
  const body = await req.json();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  db.execute(
    'INSERT INTO social_posts (id, user_id, session_id, content, created_at) VALUES (?, ?, ?, ?, ?)',
    [
      id,
      LOCAL_USER_ID,
      body.session_id || null,
      JSON.stringify(body.content),
      new Date().toISOString(),
    ],
  );

  return NextResponse.json({ id }, { status: 201 });
}
