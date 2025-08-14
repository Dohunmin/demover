-- Remove the default value from id column since it should match auth.users.id
ALTER TABLE public.profiles ALTER COLUMN id DROP DEFAULT;

-- Update the code to properly handle the id field
-- The id should be set to user.id, not auto-generated