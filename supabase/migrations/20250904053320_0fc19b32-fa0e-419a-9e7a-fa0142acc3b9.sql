-- Create travel_bookmarks table for storing favorite travel places
CREATE TABLE public.travel_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_id TEXT NOT NULL,
  title TEXT NOT NULL,
  addr1 TEXT,
  addr2 TEXT,
  image_url TEXT,
  tel TEXT,
  mapx TEXT,
  mapy TEXT,
  areacode TEXT,
  sigungucode TEXT,
  content_type_id TEXT,
  bookmark_type TEXT NOT NULL CHECK (bookmark_type IN ('general', 'pet')) DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_id)
);

-- Enable Row Level Security
ALTER TABLE public.travel_bookmarks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for travel_bookmarks
CREATE POLICY "Users can view their own travel bookmarks"
ON public.travel_bookmarks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own travel bookmarks"
ON public.travel_bookmarks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own travel bookmarks"
ON public.travel_bookmarks
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own travel bookmarks"
ON public.travel_bookmarks
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_travel_bookmarks_updated_at
BEFORE UPDATE ON public.travel_bookmarks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();