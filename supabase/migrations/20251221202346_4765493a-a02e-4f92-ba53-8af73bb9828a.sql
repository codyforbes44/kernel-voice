-- Add voice_provider column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS voice_provider TEXT DEFAULT 'elevenlabs' 
CHECK (voice_provider IN ('elevenlabs', 'grok'));