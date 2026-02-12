
-- Create anonymize_old_analytics() function for data lifecycle management
CREATE OR REPLACE FUNCTION public.anonymize_old_analytics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  anonymized_count integer;
  deleted_conversations_count integer;
BEGIN
  -- Anonymize widget_analytics rows older than 90 days
  UPDATE widget_analytics
  SET session_id = NULL, referrer_domain = NULL
  WHERE created_at < now() - interval '90 days'
    AND (session_id IS NOT NULL OR referrer_domain IS NOT NULL);
  GET DIAGNOSTICS anonymized_count = ROW_COUNT;

  -- Delete orphaned guest conversations older than 30 days
  DELETE FROM messages
  WHERE conversation_id IN (
    SELECT id FROM conversations
    WHERE user_id IS NULL AND created_at < now() - interval '30 days'
  );

  DELETE FROM conversations
  WHERE user_id IS NULL AND created_at < now() - interval '30 days';
  GET DIAGNOSTICS deleted_conversations_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'anonymized_analytics', anonymized_count,
    'deleted_conversations', deleted_conversations_count,
    'run_at', now()
  );
END;
$$;
