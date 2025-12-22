-- Add input_mode column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS input_mode TEXT DEFAULT 'combined';