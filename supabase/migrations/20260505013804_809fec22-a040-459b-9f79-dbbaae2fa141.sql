
DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Backgrounds are publicly viewable" ON storage.objects;

CREATE POLICY "Avatar files are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars' AND name LIKE '%/avatar.jpg');

CREATE POLICY "Background files are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'backgrounds' AND name LIKE '%/bg.jpg');
