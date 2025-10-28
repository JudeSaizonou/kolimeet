-- Add is_read column to messages table if it doesn't exist
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Add index for better performance on thread queries
CREATE INDEX IF NOT EXISTS idx_messages_thread_id_created_at 
ON public.messages(thread_id, created_at DESC);

-- Add index for unread messages count
CREATE INDEX IF NOT EXISTS idx_messages_is_read 
ON public.messages(thread_id, is_read) 
WHERE is_read = false;

-- Add unique constraint to prevent duplicate threads
CREATE UNIQUE INDEX IF NOT EXISTS idx_threads_unique_conversation 
ON public.threads(
  LEAST(created_by, other_user_id),
  GREATEST(created_by, other_user_id),
  related_id
);

-- Create function to update last_message_at on threads
CREATE OR REPLACE FUNCTION update_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.threads
  SET last_message_at = NEW.created_at
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to update last_message_at automatically
DROP TRIGGER IF EXISTS trigger_update_thread_last_message ON public.messages;
CREATE TRIGGER trigger_update_thread_last_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION update_thread_last_message();