-- Move sensitive birth_date out of the publicly readable profiles table
CREATE TABLE public.profile_private (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  birth_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profile_private TO authenticated;
GRANT ALL ON public.profile_private TO service_role;

ALTER TABLE public.profile_private ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_private owner read"
ON public.profile_private FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "profile_private owner insert"
ON public.profile_private FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profile_private owner update"
ON public.profile_private FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Copy existing data
INSERT INTO public.profile_private (user_id, birth_date)
SELECT id, birth_date FROM public.profiles WHERE birth_date IS NOT NULL;

-- Drop the publicly exposed column
ALTER TABLE public.profiles DROP COLUMN birth_date;