-- Add is_anonymous column to community_posts table
ALTER TABLE public.community_posts 
ADD COLUMN is_anonymous BOOLEAN DEFAULT false;

-- Add is_anonymous column to post_comments table  
ALTER TABLE public.post_comments 
ADD COLUMN is_anonymous BOOLEAN DEFAULT false;