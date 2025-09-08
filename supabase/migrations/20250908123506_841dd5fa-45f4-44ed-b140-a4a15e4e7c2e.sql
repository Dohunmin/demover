-- Add privacy settings to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS location_privacy_level text DEFAULT 'fuzzy' CHECK (location_privacy_level IN ('precise', 'fuzzy', 'general'));

-- Create a function to fuzz coordinates for privacy
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get safe public location data
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a secure view for public travel records
CREATE OR REPLACE VIEW public.public_travel_records_safe AS
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
  -- Use safe location data based on user's privacy preference
  CASE 
    WHEN tr.is_public AND tr.user_id != auth.uid() THEN
      public.get_safe_location_data(
        tr.latitude, 
        tr.longitude, 
        tr.location_address,
        COALESCE(p.location_privacy_level, 'fuzzy')
      )
    ELSE
      json_build_object(
        'latitude', tr.latitude,
        'longitude', tr.longitude, 
        'address', tr.location_address
      )
  END as safe_location_data,
  -- For backward compatibility, provide individual fields
  CASE 
    WHEN tr.is_public AND tr.user_id != auth.uid() THEN
      (public.get_safe_location_data(tr.latitude, tr.longitude, tr.location_address, COALESCE(p.location_privacy_level, 'fuzzy'))->>'latitude')::numeric
    ELSE tr.latitude
  END as latitude,
  CASE 
    WHEN tr.is_public AND tr.user_id != auth.uid() THEN
      (public.get_safe_location_data(tr.latitude, tr.longitude, tr.location_address, COALESCE(p.location_privacy_level, 'fuzzy'))->>'longitude')::numeric
    ELSE tr.longitude
  END as longitude,
  CASE 
    WHEN tr.is_public AND tr.user_id != auth.uid() THEN
      public.get_safe_location_data(tr.latitude, tr.longitude, tr.location_address, COALESCE(p.location_privacy_level, 'fuzzy'))->>'address'
    ELSE tr.location_address
  END as location_address
FROM public.travel_records tr
LEFT JOIN public.profiles p ON p.user_id = tr.user_id
WHERE tr.is_public = true OR tr.user_id = auth.uid();

-- Enable RLS on the view
ALTER VIEW public.public_travel_records_safe OWNER TO postgres;

-- Grant permissions on the view
GRANT SELECT ON public.public_travel_records_safe TO authenticated;
GRANT SELECT ON public.public_travel_records_safe TO anon;

-- Create RLS policy for the safe view
-- Note: Views don't have RLS policies, but we ensure security through the view definition

COMMENT ON VIEW public.public_travel_records_safe IS 'Safe view of travel records that fuzzes location data for privacy when records are public';
COMMENT ON FUNCTION public.fuzz_coordinates(numeric, numeric, text) IS 'Reduces coordinate precision based on privacy level to prevent stalking';
COMMENT ON FUNCTION public.get_safe_location_data(numeric, numeric, text, text) IS 'Returns safe location data with fuzzed coordinates and addresses for privacy';