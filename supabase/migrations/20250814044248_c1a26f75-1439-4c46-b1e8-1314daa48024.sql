-- Add unique constraint to user_id in profiles table to support upsert operations
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);