-- Create a storage bucket specifically for community posts
INSERT INTO storage.buckets (id, name, public) VALUES ('community-posts', 'community-posts', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for community post images
CREATE POLICY "Community post images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'community-posts');

CREATE POLICY "Users can upload their own community post images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'community-posts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own community post images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'community-posts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own community post images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'community-posts' AND auth.uid()::text = (storage.foldername(name))[1]);