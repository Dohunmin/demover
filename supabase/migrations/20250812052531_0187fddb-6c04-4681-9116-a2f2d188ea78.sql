-- 관리자가 모든 프로필을 볼 수 있도록 하는 RLS 정책 추가
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));