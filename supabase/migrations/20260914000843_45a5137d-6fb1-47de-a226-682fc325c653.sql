CREATE POLICY "Users can remove their own followers"
ON public.follows
FOR DELETE
TO authenticated
USING (following_id = auth.uid());