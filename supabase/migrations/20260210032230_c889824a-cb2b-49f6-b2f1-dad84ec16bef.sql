
-- Fix 1: Move vector extension from public to extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION vector SET SCHEMA extensions;

-- Fix 2: Replace overly permissive widget_analytics INSERT policy
-- Drop the existing permissive policy
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.widget_analytics;

-- Create a more restrictive policy: only allow inserts where widget_id references a valid widget
CREATE POLICY "Authenticated users can insert analytics"
ON public.widget_analytics
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.widget_configs wc WHERE wc.id = widget_id
  )
);

-- Also allow anon inserts (widgets are embedded on external sites) but validate widget exists
CREATE POLICY "Anon can insert analytics for valid widgets"
ON public.widget_analytics
FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.widget_configs wc WHERE wc.id = widget_id AND wc.is_active = true
  )
);
