-- Add area_code column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN area_code TEXT DEFAULT '6';

-- Update existing user's area_code to 6 as mentioned
UPDATE public.profiles 
SET area_code = '6' 
WHERE user_id = 'e7cd20af-1d7c-4f68-b23d-1be14299f2d3';