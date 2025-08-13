-- Add author_id column to news_posts table
ALTER TABLE public.news_posts 
ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;