CREATE TABLE public.saved_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  icon text DEFAULT '🤖',
  voice_provider text NOT NULL DEFAULT 'openai',
  voice_id text,
  provider_settings jsonb DEFAULT '{}',
  system_prompt text NOT NULL DEFAULT '',
  first_message text,
  is_shared boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.saved_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own agents"
  ON public.saved_agents FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view shared agents"
  ON public.saved_agents FOR SELECT
  USING (is_shared = true);

CREATE POLICY "Admins can manage all agents"
  ON public.saved_agents FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_saved_agents_updated_at
  BEFORE UPDATE ON public.saved_agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();