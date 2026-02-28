import { saveFormRecording, removeFormRecording } from './actions';

interface UploadResult {
  url: string;
  path: string;
}

/**
 * Store recording metadata locally. In SQLite mode we keep the blob URL as the
 * video reference (no cloud storage). The recording is playable only in the
 * current browser session since blob URLs are transient.
 */
export async function uploadRecording(
  blob: Blob,
  _userId: string,
  sessionId: string,
  exerciseId: string,
  timestampStart: number,
  timestampEnd: number,
): Promise<UploadResult | null> {
  // Create a local blob URL for playback
  const blobUrl = URL.createObjectURL(blob);

  // Store metadata in SQLite
  const id = await saveFormRecording({
    session_id: sessionId,
    exercise_id: exerciseId,
    video_url: blobUrl,
    timestamp_start: timestampStart,
    timestamp_end: timestampEnd,
  });

  if (!id) return null;

  return { url: blobUrl, path: blobUrl };
}

/**
 * Get a recording URL. In local mode blob URLs are already playable.
 */
export async function getRecordingUrl(path: string): Promise<string | null> {
  return path || null;
}

/**
 * Delete a recording from the database.
 */
export async function deleteRecording(
  recordingId: string,
  _storagePath: string,
): Promise<boolean> {
  await removeFormRecording(recordingId);
  return true;
}
