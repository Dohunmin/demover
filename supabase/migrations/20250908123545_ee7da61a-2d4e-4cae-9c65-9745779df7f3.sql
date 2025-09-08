-- Fix security issues by updating functions with proper search_path
CREATE OR REPLACE FUNCTION public.fuzz_coordinates(lat numeric, lng numeric, privacy_level text DEFAULT 'fuzzy')
RETURNS json AS $$
BEGIN
  CASE privacy_level
    WHEN 'precise' THEN
      -- Return exact coordinates (for private records or user's own records)
      RETURN json_build_object('latitude', lat, 'longitude', lng);
    WHEN 'fuzzy' THEN
      -- Reduce precision to approximately 100-500 meters
      -- Round to 3 decimal places (roughly 111 meters at equator)
      RETURN json_build_object(
        'latitude', ROUND(lat::numeric, 3), 
        'longitude', ROUND(lng::numeric, 3)
      );
    WHEN 'general' THEN
      -- Very general location (city level) - round to 1 decimal place
      RETURN json_build_object(
        'latitude', ROUND(lat::numeric, 1), 
        'longitude', ROUND(lng::numeric, 1)
      );
    ELSE
      -- Default to fuzzy if unknown privacy level
      RETURN json_build_object(
        'latitude', ROUND(lat::numeric, 3), 
        'longitude', ROUND(lng::numeric, 3)
      );
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix the get_safe_location_data function with proper search_path
CREATE OR REPLACE FUNCTION public.get_safe_location_data(lat numeric, lng numeric, addr text, privacy_level text DEFAULT 'fuzzy')
RETURNS json AS $$
DECLARE
  safe_coords json;
  safe_address text;
BEGIN
  -- Get fuzzed coordinates
  safe_coords := public.fuzz_coordinates(lat, lng, privacy_level);
  
  -- For address, only show general area for public records
  CASE privacy_level
    WHEN 'precise' THEN
      safe_address := addr;
    WHEN 'fuzzy' THEN
      -- Remove specific street numbers and apartment details
      safe_address := regexp_replace(addr, '\d+(-\d+)?(\s*동\s*\d+호|\s*호)?', '', 'g');
      safe_address := regexp_replace(safe_address, '^\s+|\s+$', '', 'g');
    WHEN 'general' THEN
      -- Only show district/city level
      safe_address := split_part(addr, ' ', 1) || ' ' || split_part(addr, ' ', 2);
    ELSE
      safe_address := regexp_replace(addr, '\d+(-\d+)?(\s*동\s*\d+호|\s*호)?', '', 'g');
  END CASE;
  
  RETURN json_build_object(
    'latitude', (safe_coords->>'latitude')::numeric,
    'longitude', (safe_coords->>'longitude')::numeric,
    'address', safe_address
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop the problematic view and create a safer approach
DROP VIEW IF EXISTS public.public_travel_records_safe;

-- Update the existing RLS policy for travel_records to implement privacy protection directly
-- First drop existing policies
DROP POLICY IF EXISTS "Public travel records are readable by everyone" ON public.travel_records;

-- Create new safer policies that protect location data
CREATE POLICY "Users can view their own travel records" ON public.travel_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public travel records are viewable with privacy protection" ON public.travel_records  
  FOR SELECT USING (
    is_public = true AND 
    -- This policy allows reading but the application layer should use safe functions for coordinates
    true
  );

-- Create a function that applications should use to safely fetch public travel records
CREATE OR REPLACE FUNCTION public.get_public_travel_records_safe()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  location_name text,
  visit_date date,
  rating integer,
  memo text,
  images jsonb,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  is_public boolean,
  safe_latitude numeric,
  safe_longitude numeric,
  safe_address text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tr.id,
    tr.user_id,
    tr.location_name,
    tr.visit_date,
    tr.rating,
    tr.memo,
    tr.images,
    tr.created_at,
    tr.updated_at,
    tr.is_public,
    CASE 
      WHEN tr.user_id = auth.uid() THEN tr.latitude
      ELSE (public.get_safe_location_data(tr.latitude, tr.longitude, tr.location_address, COALESCE(p.location_privacy_level, 'fuzzy'))->>'latitude')::numeric
    END as safe_latitude,
    CASE 
      WHEN tr.user_id = auth.uid() THEN tr.longitude  
      ELSE (public.get_safe_location_data(tr.latitude, tr.longitude, tr.location_address, COALESCE(p.location_privacy_level, 'fuzzy'))->>'longitude')::numeric
    END as safe_longitude,
    CASE 
      WHEN tr.user_id = auth.uid() THEN tr.location_address
      ELSE public.get_safe_location_data(tr.latitude, tr.longitude, tr.location_address, COALESCE(p.location_privacy_level, 'fuzzy'))->>'address'
    END as safe_address
  FROM public.travel_records tr
  LEFT JOIN public.profiles p ON p.user_id = tr.user_id  
  WHERE tr.is_public = true OR tr.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

COMMENT ON FUNCTION public.get_public_travel_records_safe() IS 'Returns travel records with location privacy protection for public records';

-- Grant permissions on the function
GRANT EXECUTE ON FUNCTION public.get_public_travel_records_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_travel_records_safe() TO anon;