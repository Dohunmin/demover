-- Add mbti_result column to profiles table to store the pet MBTI test result
ALTER TABLE public.profiles 
ADD COLUMN mbti_result TEXT;