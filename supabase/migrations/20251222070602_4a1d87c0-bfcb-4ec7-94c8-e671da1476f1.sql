-- Add voice settings columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS openai_voice text DEFAULT 'alloy',
ADD COLUMN IF NOT EXISTS openai_settings jsonb DEFAULT '{"temperature": 0.8, "vadThreshold": 0.5, "silenceDuration": 500}'::jsonb,
ADD COLUMN IF NOT EXISTS grok_voice text DEFAULT 'Charon',
ADD COLUMN IF NOT EXISTS grok_settings jsonb DEFAULT '{"vadThreshold": 0.5, "silenceDuration": 200, "prefixPadding": 300}'::jsonb;