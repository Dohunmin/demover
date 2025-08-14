-- 1. Fix existing profile with null user_id for the new user
UPDATE public.profiles 
SET user_id = id 
WHERE id = '665fb98a-b74b-48cc-931d-046f162a5678' AND user_id IS NULL;

-- 2. Add NOT NULL constraint to user_id to prevent future issues
ALTER TABLE public.profiles ALTER COLUMN user_id SET NOT NULL;

-- 3. Update handle_new_user function to ensure user_id is always set correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.id,  -- Ensure user_id is set to the same value as id
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name'
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = NEW.id,  -- Fix user_id if it was null
    email = NEW.email,
    full_name = NEW.raw_user_meta_data ->> 'full_name';
  
  -- Give default 'user' role to new signups
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;