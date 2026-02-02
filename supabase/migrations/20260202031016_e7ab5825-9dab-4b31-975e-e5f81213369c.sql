-- Create table for custom system prompt presets
CREATE TABLE public.custom_prompt_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  first_message TEXT,
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_prompt_presets ENABLE ROW LEVEL SECURITY;

-- Users can view their own presets
CREATE POLICY "Users can view their own presets"
ON public.custom_prompt_presets
FOR SELECT
USING (auth.uid() = user_id);

-- Users can view shared presets
CREATE POLICY "Users can view shared presets"
ON public.custom_prompt_presets
FOR SELECT
USING (is_shared = true);

-- Users can create their own presets
CREATE POLICY "Users can create their own presets"
ON public.custom_prompt_presets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own presets
CREATE POLICY "Users can update their own presets"
ON public.custom_prompt_presets
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own presets
CREATE POLICY "Users can delete their own presets"
ON public.custom_prompt_presets
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can manage all presets
CREATE POLICY "Admins can manage all presets"
ON public.custom_prompt_presets
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_custom_prompt_presets_updated_at
BEFORE UPDATE ON public.custom_prompt_presets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();