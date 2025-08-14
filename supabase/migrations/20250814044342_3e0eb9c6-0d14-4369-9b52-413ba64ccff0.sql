-- Set default value for id column in profiles table to auto-generate UUIDs
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();