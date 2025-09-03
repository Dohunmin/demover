-- profiles 테이블에 카카오 관련 필드 추가
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS kakao_id text,
ADD COLUMN IF NOT EXISTS provider text DEFAULT 'email',
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS birthyear integer;

-- handle_new_user 함수 업데이트 - 카카오 로그인 데이터도 처리
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
      NEW.raw_user_meta_data ->> 'nickname'
    ),
    NEW.raw_user_meta_data ->> 'profile_image',
    NEW.raw_user_meta_data ->> 'kakao_id',
    COALESCE(
      NEW.raw_user_meta_data ->> 'provider',
      'email'
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
      profiles.full_name
    ),
    avatar_url = COALESCE(
      NEW.raw_user_meta_data ->> 'profile_image',
      profiles.avatar_url
    ),
    kakao_id = COALESCE(
      NEW.raw_user_meta_data ->> 'kakao_id',
      profiles.kakao_id
    ),
    provider = COALESCE(
      NEW.raw_user_meta_data ->> 'provider',
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
$function$;