-- Create user_features table for tracking optional feature upgrades
CREATE TABLE public.user_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  granted_by UUID,
  granted_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, feature_key)
);

-- Enable RLS
ALTER TABLE public.user_features ENABLE ROW LEVEL SECURITY;

-- Users can view their own features
CREATE POLICY "Users can view own features"
ON public.user_features FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all features
CREATE POLICY "Admins can view all features"
ON public.user_features FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage features
CREATE POLICY "Admins can manage features"
ON public.user_features FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update profiles default voice_provider to 'openai'
ALTER TABLE public.profiles 
ALTER COLUMN voice_provider SET DEFAULT 'openai';