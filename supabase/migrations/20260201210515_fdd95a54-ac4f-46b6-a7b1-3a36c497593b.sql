-- Create admin_settings table for system configuration
CREATE TABLE public.admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid
);

-- Enable RLS on admin_settings
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage settings
CREATE POLICY "Admins can manage settings"
ON public.admin_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can view settings (for reading feature flags etc)
CREATE POLICY "Authenticated users can view settings"
ON public.admin_settings
FOR SELECT
USING (true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_admin_settings_updated_at
BEFORE UPDATE ON public.admin_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add performance indexes (only those that don't exist)
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON public.profiles(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);

-- Insert default admin settings
INSERT INTO public.admin_settings (key, value, description) VALUES
('voice_providers', '{"default": "elevenlabs", "enabled": ["elevenlabs", "openai"]}', 'Voice provider configuration'),
('ai_models', '{"default": "gpt-4o-mini", "enabled": ["gpt-4o", "gpt-4o-mini"]}', 'AI model configuration'),
('feature_flags', '{"guest_mode": true, "voice_assistant": true, "knowledge_base": true}', 'Feature toggles'),
('maintenance_mode', '{"enabled": false, "message": "System is under maintenance"}', 'Maintenance mode settings');