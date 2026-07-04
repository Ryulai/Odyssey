
CREATE POLICY "Users upload own daily sales evidence"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'daily-sales-evidence'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users read own daily sales evidence"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'daily-sales-evidence'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'manager')
      OR public.has_role(auth.uid(), 'director')
    )
  );

CREATE POLICY "Users delete own daily sales evidence"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'daily-sales-evidence'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
