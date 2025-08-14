-- Fix existing profiles with null user_id by setting user_id = id where user_id is null
UPDATE public.profiles 
SET user_id = id 
WHERE user_id IS NULL;