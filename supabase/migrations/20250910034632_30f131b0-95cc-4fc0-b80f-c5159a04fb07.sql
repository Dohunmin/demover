-- 공개 프로필 정보 조회를 위한 RLS 정책 추가
CREATE POLICY "Public profile info is viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

-- 기존 정책과 충돌하지 않도록 기존 정책 수정
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- 새로운 정책들 생성
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));