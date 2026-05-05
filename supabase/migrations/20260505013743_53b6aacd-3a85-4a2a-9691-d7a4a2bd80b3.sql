
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bg_image_url text;

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('backgrounds', 'backgrounds', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatars are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Backgrounds are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'backgrounds');

CREATE POLICY "Users can upload own background"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'backgrounds' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own background"
ON storage.objects FOR UPDATE
USING (bucket_id = 'backgrounds' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own background"
ON storage.objects FOR DELETE
USING (bucket_id = 'backgrounds' AND auth.uid()::text = (storage.foldername(name))[1]);
