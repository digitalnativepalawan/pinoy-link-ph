
DROP POLICY "Anyone can record a click" ON public.clicks;

CREATE POLICY "Anyone can record a valid click"
  ON public.clicks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.links l
      WHERE l.id = clicks.link_id
        AND l.profile_id = clicks.profile_id
    )
  );
