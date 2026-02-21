-- Create storage bucket for form recordings
-- Private bucket — access controlled via RLS policies

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recordings',
  'recordings',
  FALSE,
  104857600,  -- 100 MB max per video
  ARRAY['video/webm', 'video/mp4', 'video/quicktime']
);

-- Users can upload recordings to their own folder
CREATE POLICY "Users can upload own recordings"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'recordings'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- Users can read their own recordings
CREATE POLICY "Users can read own recordings"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'recordings'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- Coaches can read their client recordings
CREATE POLICY "Coaches can read client recordings"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'recordings'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (storage.foldername(name))[1]::UUID
      AND users.coach_id = auth.uid()
    )
  );

-- Users can delete their own recordings
CREATE POLICY "Users can delete own recordings"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'recordings'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );
