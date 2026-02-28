'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { FormRecording, Exercise, CoachFeedback } from '@myworkouts/shared';
import { formatTime } from '@myworkouts/shared';
import { fetchFormRecordingById, fetchExerciseById } from '../../../lib/actions';
import { getRecordingUrl } from '../../../lib/recording-upload';
import { workoutsPath } from '../../../lib/routes';

export default function RecordingReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [recording, setRecording] = useState<FormRecording | null>(null);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    (async () => {
      // Load recording
      const rec = await fetchFormRecordingById(id);
      if (!rec) {
        setLoading(false);
        return;
      }
      setRecording(rec);

      // Load exercise info
      const ex = await fetchExerciseById(rec.exercise_id);
      if (ex) setExercise(ex);

      // Get video URL
      const url = await getRecordingUrl(rec.video_url);
      setVideoUrl(url);

      setLoading(false);
    })();
  }, [id]);

  // Track video time for timestamp markers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Loading recording...</p>
      </div>
    );
  }

  if (!recording) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Recording not found.</p>
        <button
          type="button"
          onClick={() => router.push(workoutsPath('/recordings'))}
          className="text-indigo-500 hover:underline"
        >
          Back to Recordings
        </button>
      </div>
    );
  }

  const durationSec = recording.timestamp_end - recording.timestamp_start;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => router.push(workoutsPath('/recordings'))}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &#x25C0; Back to Recordings
        </button>
        <h1 className="text-xl font-bold text-gray-900">
          {exercise?.name ?? 'Form Recording'}
        </h1>
        <span className="text-sm text-gray-400">
          {new Date(recording.created_at).toLocaleDateString()}
        </span>
      </div>

      {/* Video Player */}
      <div className="relative rounded-xl overflow-hidden bg-black mb-6">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            playsInline
            onTimeUpdate={handleTimeUpdate}
            className="w-full max-h-[60vh]"
          />
        ) : (
          <div className="flex h-64 items-center justify-center text-gray-500">
            Video unavailable
          </div>
        )}
      </div>

      {/* Recording Info */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl bg-gray-50 p-3 text-center">
          <p className="text-lg font-bold text-gray-900">{formatTime(durationSec * 1000)}</p>
          <p className="text-xs text-gray-500">Duration</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-3 text-center">
          <p className="text-lg font-bold text-gray-900">
            {exercise?.difficulty
              ? exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)
              : '-'}
          </p>
          <p className="text-xs text-gray-500">Difficulty</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-3 text-center">
          <p className="text-lg font-bold text-gray-900">{recording.coach_feedback.length}</p>
          <p className="text-xs text-gray-500">Coach Notes</p>
        </div>
      </div>

      {/* Side-by-Side Demo (if exercise has video) */}
      {exercise?.video_url && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Reference: Proper Form</h3>
          <div className="rounded-xl overflow-hidden bg-gray-100">
            <video
              src={exercise.video_url}
              controls
              playsInline
              loop
              muted
              className="w-full max-h-48 object-contain"
            />
          </div>
        </div>
      )}

      {/* Coach Feedback Timeline */}
      {recording.coach_feedback.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Coach Feedback</h3>
          <div className="space-y-2">
            {recording.coach_feedback.map((fb: CoachFeedback, i: number) => (
              <button
                key={i}
                type="button"
                onClick={() => seekTo(fb.timestamp)}
                className={`w-full text-left rounded-lg border p-3 transition-colors ${
                  Math.abs(currentTime - fb.timestamp) < 2
                    ? 'border-indigo-300 bg-indigo-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-indigo-500">
                    {formatTime(fb.timestamp * 1000)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(fb.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{fb.comment}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {recording.coach_feedback.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center">
          <p className="text-gray-400 text-sm">
            No coach feedback yet. Your coach will be able to review this recording
            and leave timestamped feedback.
          </p>
        </div>
      )}
    </div>
  );
}
