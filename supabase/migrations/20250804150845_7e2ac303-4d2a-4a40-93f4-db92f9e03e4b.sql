-- Fix pet_gender check constraint to match UI values
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_pet_gender_check;

-- Add new check constraint with English values
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_pet_gender_check 
CHECK (pet_gender IN ('male', 'female'));