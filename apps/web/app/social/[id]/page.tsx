'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface PostDetail {
  id: string;
  user_id: string;
  session_id: string | null;
  content: string;
  created_at: string;
  user_display_name: string | null;
  user_avatar_url: string | null;
  like_count: number;
  comment_count: number;
  user_liked: number;
}

interface WorkoutSummary {
  title: string;
  duration: number;
  exerciseCount: number;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  prsHit: string[];
  muscleGroups: string[];
  caption?: string;
}

interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  body: string;
  created_at: string;
  user_display_name: string | null;
  user_avatar_url: string | null;
}

export default function PostDetailPage() {
  const params = useParams();
  const postId = params.id as string;

  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');

  const fetchPost = useCallback(async () => {
    try {
      const res = await fetch('/api/social');
      if (res.ok) {
        const posts: PostDetail[] = await res.json();
        const found = posts.find((p) => p.id === postId) || null;
        setPost(found);
      }
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const fetchComments = useCallback(async () => {
    const res = await fetch(`/api/social/comment?post_id=${postId}`);
    if (res.ok) {
      const data = await res.json();
      setComments(data);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [fetchPost, fetchComments]);

  const handleLike = async () => {
    if (!post) return;
    setPost({
      ...post,
      user_liked: post.user_liked ? 0 : 1,
      like_count: post.user_liked ? post.like_count - 1 : post.like_count + 1,
    });

    await fetch('/api/social/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId }),
    });
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    await fetch('/api/social/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, body: commentText.trim() }),
    });

    setCommentText('');
    fetchComments();
    fetchPost();
  };

  const handleDeleteComment = async (commentId: string) => {
    await fetch('/api/social/comment', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: commentId }),
    });
    fetchComments();
    fetchPost();
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <p className="text-gray-500">Post not found.</p>
        <Link href="/social" className="text-sm text-indigo-500 hover:underline">
          Back to feed
        </Link>
      </div>
    );
  }

  let summary: WorkoutSummary;
  try {
    summary = typeof post.content === 'string' ? JSON.parse(post.content) : post.content;
  } catch {
    summary = {
      title: 'Workout',
      duration: 0,
      exerciseCount: 0,
      totalSets: 0,
      totalReps: 0,
      totalVolume: 0,
      prsHit: [],
      muscleGroups: [],
    };
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href="/social"
        className="text-sm text-indigo-500 hover:text-indigo-700 mb-4 inline-block"
      >
        &larr; Back to feed
      </Link>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 pb-2">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-600">
            {(post.user_display_name || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {post.user_display_name || 'User'}
            </p>
            <p className="text-xs text-gray-400">
              {new Date(post.created_at).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        {/* Workout Summary */}
        <div className="px-4 pb-4">
          <h2 className="text-lg font-bold text-gray-900">{summary.title}</h2>
          {summary.caption && (
            <p className="text-sm text-gray-600 mt-1">{summary.caption}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
            {summary.duration > 0 && (
              <SummaryCard label="Duration" value={`${Math.round(summary.duration / 60)} min`} />
            )}
            {summary.exerciseCount > 0 && (
              <SummaryCard label="Exercises" value={String(summary.exerciseCount)} />
            )}
            {summary.totalSets > 0 && (
              <SummaryCard label="Sets" value={String(summary.totalSets)} />
            )}
            {summary.totalReps > 0 && (
              <SummaryCard label="Reps" value={String(summary.totalReps)} />
            )}
            {summary.totalVolume > 0 && (
              <SummaryCard label="Volume" value={`${summary.totalVolume.toLocaleString()} lbs`} />
            )}
          </div>

          {summary.prsHit && summary.prsHit.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Personal Records</p>
              {summary.prsHit.map((pr, i) => (
                <span
                  key={i}
                  className="inline-block mr-1 mb-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700"
                >
                  {pr}
                </span>
              ))}
            </div>
          )}

          {summary.muscleGroups && summary.muscleGroups.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Muscle Groups</p>
              <div className="flex flex-wrap gap-1">
                {summary.muscleGroups.map((mg) => (
                  <span
                    key={mg}
                    className="inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 capitalize"
                  >
                    {mg.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Like button */}
        <div className="flex items-center gap-4 px-4 py-3 border-t border-gray-100">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 text-sm ${
              post.user_liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.723.723 0 01-.692 0h-.002z" />
            </svg>
            <span>{post.like_count} {post.like_count === 1 ? 'like' : 'likes'}</span>
          </button>
          <span className="text-sm text-gray-400">
            {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </span>
        </div>

        {/* Comments */}
        <div className="border-t border-gray-100 px-4 py-3 space-y-3">
          {comments.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">No comments yet.</p>
          )}

          {comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500 flex-shrink-0">
                {(c.user_display_name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-medium text-gray-900">
                    {c.user_display_name || 'User'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(c.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{c.body}</p>
              </div>
              {c.user_id === 'local-user' && (
                <button
                  onClick={() => handleDeleteComment(c.id)}
                  className="text-xs text-red-400 hover:text-red-600 flex-shrink-0"
                >
                  Delete
                </button>
              )}
            </div>
          ))}

          <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
            >
              Post
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-bold text-gray-900">{value}</div>
    </div>
  );
}
