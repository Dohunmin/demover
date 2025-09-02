-- Create travel_records table for user travel logs
CREATE TABLE public.travel_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  location_name TEXT NOT NULL,
  location_address TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  visit_date DATE NOT NULL,
  memo TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.travel_records ENABLE ROW LEVEL SECURITY;

-- Create policies for travel records
CREATE POLICY "Users can view their own travel records" 
ON public.travel_records 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own travel records" 
ON public.travel_records 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own travel records" 
ON public.travel_records 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own travel records" 
ON public.travel_records 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage bucket for travel record images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('travel-records', 'travel-records', true);

-- Create storage policies for travel record images
CREATE POLICY "Users can view travel record images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'travel-records');

CREATE POLICY "Users can upload their own travel record images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'travel-records' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own travel record images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'travel-records' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own travel record images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'travel-records' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_travel_records_updated_at
BEFORE UPDATE ON public.travel_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();