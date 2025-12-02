-- Enable realtime for messages table so clients can subscribe to new messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;