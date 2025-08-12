-- 프로필 이미지 저장을 위한 스토리지 버킷 생성
INSERT INTO storage.buckets (id, name, public) VALUES ('pet-profiles', 'pet-profiles', true);

-- profiles 테이블에 pet_image_url 컬럼 추가
ALTER TABLE public.profiles ADD COLUMN pet_image_url TEXT;

-- 스토리지 정책 생성
CREATE POLICY "Users can view pet profile images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'pet-profiles');

CREATE POLICY "Users can upload their own pet profile images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'pet-profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own pet profile images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'pet-profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own pet profile images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'pet-profiles' AND auth.uid()::text = (storage.foldername(name))[1]);