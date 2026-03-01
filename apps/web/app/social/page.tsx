'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface SocialPostRow {
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

export default function SocialPage() {
  const [posts, setPosts] = useState<SocialPostRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/social');
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Refetch on window focus (replaces realtime in local mode)
  useEffect(() => {
    const handleFocus = () => fetchPosts();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchPosts]);

  const handleLike = async (postId: string) => {
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              user_liked: p.user_liked ? 0 : 1,
              like_count: p.user_liked ? p.like_count - 1 : p.like_count + 1,
            }
          : p,
      ),
    );

    await fetch('/api/social/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId }),
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Social Feed</h1>
        <Link
          href="/social/followers"
          className="text-sm text-indigo-500 hover:text-indigo-700"
        >
          Following
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-400 py-8 text-center">
            No posts yet. Share a workout to get started!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onRefresh={fetchPosts}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({
  post,
  onLike,
  onRefresh,
}: {
  post: SocialPostRow;
  onLike: (id: string) => void;
  onRefresh: () => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

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

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/social/comment?post_id=${post.id}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } finally {
      setLoadingComments(false);
    }
  };

  const toggleComments = () => {
    if (!showComments) fetchComments();
    setShowComments(!showComments);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    await fetch('/api/social/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: post.id, body: commentText.trim() }),
    });

    setCommentText('');
    fetchComments();
    onRefresh();
  };

  const handleDeleteComment = async (commentId: string) => {
    await fetch('/api/social/comment', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: commentId }),
    });
    fetchComments();
    onRefresh();
  };

  const timeAgo = getTimeAgo(post.created_at);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-2">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-600">
          {(post.user_display_name || 'U').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            {post.user_display_name || 'User'}
          </p>
          <p className="text-xs text-gray-400">{timeAgo}</p>
        </div>
      </div>

      {/* Workout summary */}
      <div className="px-4 pb-3">
        <Link
          href={`/social/${post.id}`}
          className="text-sm font-semibold text-gray-900 hover:text-indigo-600"
        >
          {summary.title}
        </Link>
        {summary.caption && (
          <p className="text-sm text-gray-600 mt-1">{summary.caption}</p>
        )}

        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
          {summary.duration > 0 && (
            <span>{Math.round(summary.duration / 60)} min</span>
          )}
          {summary.exerciseCount > 0 && (
            <span>{summary.exerciseCount} exercises</span>
          )}
          {summary.totalSets > 0 && <span>{summary.totalSets} sets</span>}
          {summary.totalReps > 0 && <span>{summary.totalReps} reps</span>}
          {summary.totalVolume > 0 && (
            <span>{summary.totalVolume.toLocaleString()} lbs volume</span>
          )}
        </div>

        {summary.prsHit && summary.prsHit.length > 0 && (
          <div className="mt-2">
            {summary.prsHit.map((pr, i) => (
              <span
                key={i}
                className="inline-block mr-1 mb-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700"
              >
                PR: {pr}
              </span>
            ))}
          </div>
        )}

        {summary.muscleGroups && summary.muscleGroups.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {summary.muscleGroups.map((mg) => (
              <span
                key={mg}
                className="inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 capitalize"
              >
                {mg.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-100">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-1 text-sm ${
            post.user_liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.723.723 0 01-.692 0h-.002z" />
          </svg>
          {post.like_count > 0 && <span>{post.like_count}</span>}
        </button>

        <button
          onClick={toggleComments}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path
              fillRule="evenodd"
              d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902 1.168.188 2.352.327 3.55.414.28.02.521.18.642.413l1.713 3.293a.75.75 0 001.33 0l1.713-3.293a.783.783 0 01.642-.413 41.102 41.102 0 003.55-.414c1.437-.231 2.43-1.49 2.43-2.902V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0010 2zM6.75 6a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 2.5a.75.75 0 000 1.5h3.5a.75.75 0 000-1.5h-3.5z"
              clipRule="evenodd"
            />
          </svg>
          {post.comment_count > 0 && <span>{post.comment_count}</span>}
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3">
          {loadingComments ? (
            <p className="text-xs text-gray-400">Loading comments...</p>
          ) : (
            <>
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500 flex-shrink-0">
                    {(c.user_display_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-medium text-gray-900">
                        {c.user_display_name || 'User'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {getTimeAgo(c.created_at)}
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
            </>
          )}

          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
