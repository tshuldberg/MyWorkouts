'use client';

import { useState } from 'react';

export interface WorkoutSummaryData {
  title: string;
  duration: number;
  exerciseCount: number;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  prsHit: string[];
  muscleGroups: string[];
}

interface ShareWorkoutModalProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  summary: WorkoutSummaryData;
}

export default function ShareWorkoutModal({
  open,
  onClose,
  sessionId,
  summary,
}: ShareWorkoutModalProps) {
  const [caption, setCaption] = useState('');
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);

  if (!open) return null;

  const handleShare = async () => {
    setSharing(true);
    try {
      await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          content: {
            ...summary,
            caption: caption.trim() || undefined,
          },
        }),
      });
      setShared(true);
      setTimeout(() => {
        onClose();
        setShared(false);
        setCaption('');
      }, 1500);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl mx-4">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {shared ? 'Shared!' : 'Share Workout'}
          </h2>
        </div>

        {shared ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-6 h-6 text-green-600"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-600">Your workout has been shared to the feed.</p>
          </div>
        ) : (
          <>
            {/* Preview */}
            <div className="p-4">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-sm font-semibold text-gray-900">{summary.title}</p>
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
                    <span>{summary.totalVolume.toLocaleString()} lbs</span>
                  )}
                </div>
                {summary.prsHit.length > 0 && (
                  <div className="mt-2">
                    {summary.prsHit.map((pr, i) => (
                      <span
                        key={i}
                        className="inline-block mr-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700"
                      >
                        PR: {pr}
                      </span>
                    ))}
                  </div>
                )}
                {summary.muscleGroups.length > 0 && (
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

              {/* Caption input */}
              <div className="mt-3">
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption (optional)..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  maxLength={280}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 p-4 border-t border-gray-100">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Keep Private
              </button>
              <button
                onClick={handleShare}
                disabled={sharing}
                className="flex-1 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
              >
                {sharing ? 'Sharing...' : 'Share to Feed'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
