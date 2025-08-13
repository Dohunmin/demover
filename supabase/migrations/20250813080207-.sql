-- Update profiles table to include pet information
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS pet_name TEXT,
ADD COLUMN IF NOT EXISTS pet_age INTEGER,
ADD COLUMN IF NOT EXISTS pet_gender TEXT,
ADD COLUMN IF NOT EXISTS pet_breed TEXT,
ADD COLUMN IF NOT EXISTS pet_image_url TEXT;

-- Create news_posts table
CREATE TABLE IF NOT EXISTS public.news_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('event', 'sale')),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  news_post_id UUID NOT NULL REFERENCES public.news_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, news_post_id)
);

-- Enable RLS on all tables
ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pet-profiles', 'pet-profiles', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('news-images', 'news-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for news_posts (public read, admin write)
CREATE POLICY "News posts are publicly readable" 
ON public.news_posts 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage news posts" 
ON public.news_posts 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for bookmarks (users can manage their own bookmarks)
CREATE POLICY "Users can view their own bookmarks" 
ON public.bookmarks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookmarks" 
ON public.bookmarks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" 
ON public.bookmarks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Storage policies for pet-profiles
CREATE POLICY "Pet profile images are publicly accessible" 
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

-- Storage policies for news-images
CREATE POLICY "News images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'news-images');

CREATE POLICY "Admins can upload news images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'news-images' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update news images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'news-images' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete news images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'news-images' AND public.has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at columns
CREATE TRIGGER update_news_posts_updated_at
BEFORE UPDATE ON public.news_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();