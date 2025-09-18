-- Add admin delete policy for community posts
CREATE POLICY "Admins can delete all community posts" 
ON public.community_posts 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'::app_role));