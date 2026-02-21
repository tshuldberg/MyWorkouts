import { createClient } from '@/lib/supabase/client';

interface UploadResult {
  url: string;
  path: string;
}

/**
 * Upload a recording blob to Supabase Storage and create a form_recordings entry.
 */
export async function uploadRecording(
  blob: Blob,
  userId: string,
  sessionId: string,
  exerciseId: string,
  timestampStart: number,
  timestampEnd: number,
): Promise<UploadResult | null> {
  const supabase = createClient();
  const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
  const filename = `${userId}/${sessionId}/${exerciseId}-${Date.now()}.${ext}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('recordings')
    .upload(filename, blob, {
      contentType: blob.type,
      upsert: false,
    });

  if (uploadError) {
    console.error('Upload failed:', uploadError.message);
    return null;
  }

  // Get the URL
  const { data: urlData } = supabase.storage
    .from('recordings')
    .getPublicUrl(filename);

  // For private buckets, we use createSignedUrl instead
  const { data: signedData } = await supabase.storage
    .from('recordings')
    .createSignedUrl(filename, 3600); // 1-hour signed URL

  const videoUrl = signedData?.signedUrl ?? urlData.publicUrl;

  // Create form_recordings entry
  const { error: dbError } = await (supabase as any)
    .from('form_recordings')
    .insert({
      session_id: sessionId,
      video_url: filename, // Store the path, not the signed URL
      exercise_id: exerciseId,
      timestamp_start: timestampStart,
      timestamp_end: timestampEnd,
    });

  if (dbError) {
    console.error('DB insert failed:', dbError.message);
    return null;
  }

  return { url: videoUrl, path: filename };
}

/**
 * Get a fresh signed URL for a recording path.
 */
export async function getRecordingUrl(path: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.storage
    .from('recordings')
    .createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

/**
 * Delete a recording from storage and database.
 */
export async function deleteRecording(
  recordingId: string,
  storagePath: string,
): Promise<boolean> {
  const supabase = createClient();

  // Delete from storage
  await supabase.storage.from('recordings').remove([storagePath]);

  // Delete from database
  const { error } = await (supabase as any)
    .from('form_recordings')
    .delete()
    .eq('id', recordingId);

  return !error;
}
