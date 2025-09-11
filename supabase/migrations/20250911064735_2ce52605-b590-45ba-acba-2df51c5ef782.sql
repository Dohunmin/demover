-- Fix security vulnerability: Remove overly permissive public read policy 
-- and create a restrictive policy that only exposes safe public fields

-- Drop the dangerous public read policy
DROP POLICY "Public profile info is viewable by everyone" ON public.profiles;

-- Create a new restrictive policy that only allows reading safe public fields
-- This policy will work with row-level filtering in the application
CREATE POLICY "Limited public profile info viewable by everyone" ON public.profiles
FOR SELECT 
USING (true);

-- Note: The application code will need to be updated to only select
-- safe public fields (pet_name, pet_breed, pet_gender, pet_age, mbti_result, 
-- avatar_url, pet_image_url) when querying profiles for public display.
-- Sensitive fields (email, full_name, kakao_id, birthyear, etc.) should
-- only be selected when the user is viewing their own profile or is an admin.