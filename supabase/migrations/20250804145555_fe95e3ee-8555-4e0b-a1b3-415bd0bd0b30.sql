-- Add pet information columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN pet_name TEXT,
ADD COLUMN pet_type TEXT,
ADD COLUMN pet_age INTEGER,
ADD COLUMN pet_gender TEXT,
ADD COLUMN pet_breed TEXT;

-- Update the handle_new_user function to include pet information
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    display_name, 
    pet_name, 
    pet_type, 
    pet_age, 
    pet_gender, 
    pet_breed
  )
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'pet_name',
    new.raw_user_meta_data ->> 'pet_type',
    (new.raw_user_meta_data ->> 'pet_age')::INTEGER,
    new.raw_user_meta_data ->> 'pet_gender',
    new.raw_user_meta_data ->> 'pet_breed'
  );
  RETURN new;
END;
$$;