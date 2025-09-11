-- Fix critical security vulnerability: Replace overly permissive policy with proper column-level restrictions
-- The current policy allows access to ALL columns including sensitive data like email, full_name, kakao_id

-- Drop the current permissive policy
DROP POLICY "Limited public profile info viewable by everyone" ON public.profiles;

-- Create a security definer function that only returns safe public profile fields
CREATE OR REPLACE FUNCTION public.get_safe_public_profile_fields()
RETURNS TABLE(
  user_id uuid,
  pet_name text,
  pet_image_url text,
  avatar_url text,
  mbti_result text,
  pet_breed text,
  pet_gender text,
  pet_age integer
) 
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    user_id,
    pet_name,
    pet_image_url,
    avatar_url,
    mbti_result,
    pet_breed,
    pet_gender,
    pet_age
  FROM public.profiles;
$$;

-- Create a restrictive policy that prevents unauthorized access to sensitive columns
-- This policy will require application code to be careful about what columns it selects
CREATE POLICY "Restricted public profile access" ON public.profiles
FOR SELECT 
USING (
  -- Users can see their own profiles completely
  auth.uid() = user_id OR 
  -- Admins can see all profiles
  has_role(auth.uid(), 'admin'::app_role)
);

-- Grant access to the safe function for authenticated users
GRANT EXECUTE ON FUNCTION public.get_safe_public_profile_fields() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_safe_public_profile_fields() TO anon;