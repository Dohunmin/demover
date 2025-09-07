-- Add rating and public visibility columns to travel_records table
ALTER TABLE public.travel_records 
ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN is_public BOOLEAN DEFAULT false;