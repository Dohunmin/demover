-- Update handle_new_user function to properly save Kakao user info
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, 
    user_id,
    email,
    full_name,
    avatar_url,
    kakao_id,
    provider,
    gender,
    birthyear
  )
  VALUES (
    NEW.id, 
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'nickname',
      NEW.raw_user_meta_data ->> 'name'
    ),
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.raw_user_meta_data ->> 'sub',
    COALESCE(
      CASE 
        WHEN NEW.raw_user_meta_data ->> 'sub' IS NOT NULL THEN 'kakao'
        ELSE 'email'
      END
    ),
    NEW.raw_user_meta_data ->> 'gender',
    CAST(NEW.raw_user_meta_data ->> 'birthyear' AS integer)
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = NEW.id,
    email = NEW.email,
    full_name = COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'nickname',
      NEW.raw_user_meta_data ->> 'name',
      profiles.full_name
    ),
    avatar_url = COALESCE(
      NEW.raw_user_meta_data ->> 'avatar_url',
      profiles.avatar_url
    ),
    kakao_id = COALESCE(
      NEW.raw_user_meta_data ->> 'sub',
      profiles.kakao_id
    ),
    provider = COALESCE(
      CASE 
        WHEN NEW.raw_user_meta_data ->> 'sub' IS NOT NULL THEN 'kakao'
        ELSE 'email'
      END,
      profiles.provider
    ),
    gender = COALESCE(
      NEW.raw_user_meta_data ->> 'gender',
      profiles.gender
    ),
    birthyear = COALESCE(
      CAST(NEW.raw_user_meta_data ->> 'birthyear' AS integer),
      profiles.birthyear
    );
  
  -- Give default 'user' role to new signups
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$