-- Create widget_configs table for storing widget configurations
CREATE TABLE public.widget_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  api_key text UNIQUE NOT NULL,
  name text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}',
  allowed_domains text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create widget_analytics table for tracking widget usage
CREATE TABLE public.widget_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id uuid REFERENCES public.widget_configs(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  referrer_domain text,
  session_id text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.widget_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for widget_configs
CREATE POLICY "Users can manage their own widgets"
  ON public.widget_configs FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all widgets"
  ON public.widget_configs FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS policies for widget_analytics
CREATE POLICY "Users can view analytics for their widgets"
  ON public.widget_analytics FOR SELECT
  USING (widget_id IN (SELECT id FROM public.widget_configs WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all analytics"
  ON public.widget_analytics FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert analytics via edge function"
  ON public.widget_analytics FOR INSERT
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_widget_configs_user_id ON public.widget_configs(user_id);
CREATE INDEX idx_widget_configs_api_key ON public.widget_configs(api_key);
CREATE INDEX idx_widget_analytics_widget_id ON public.widget_analytics(widget_id);
CREATE INDEX idx_widget_analytics_created_at ON public.widget_analytics(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_widget_configs_updated_at
  BEFORE UPDATE ON public.widget_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();