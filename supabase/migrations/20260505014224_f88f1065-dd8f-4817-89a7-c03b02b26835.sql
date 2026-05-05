
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gcash_presets jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pasaload_network text;

INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Video files are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos' AND name LIKE '%/%');

CREATE POLICY "Users can upload own videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);
