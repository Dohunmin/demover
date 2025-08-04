-- Fix security warnings by setting search_path for functions
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate functions with proper search_path setting
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, pet_name, pet_age, pet_gender, pet_breed)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'pet_name',
    (NEW.raw_user_meta_data ->> 'pet_age')::INTEGER,
    NEW.raw_user_meta_data ->> 'pet_gender',
    NEW.raw_user_meta_data ->> 'pet_breed'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;