-- Migration: Update last_message_at automatically on threads
-- Date: 2025-11-24
-- Description: Trigger pour mettre à jour last_message_at automatiquement quand un message est ajouté

-- 1. Fonction pour mettre à jour last_message_at
CREATE OR REPLACE FUNCTION update_thread_last_message_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the last_message_at timestamp for the thread
  UPDATE public.threads
  SET last_message_at = NEW.created_at
  WHERE id = NEW.thread_id;
  
  RETURN NEW;
END;
$$;

-- 2. Drop le trigger s'il existe déjà
DROP TRIGGER IF EXISTS trigger_update_thread_last_message_at ON public.messages;

-- 3. Créer le trigger qui s'exécute après chaque INSERT de message
CREATE TRIGGER trigger_update_thread_last_message_at
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION update_thread_last_message_at();

-- 4. Commenter
COMMENT ON FUNCTION update_thread_last_message_at IS 'Automatically update thread last_message_at when a new message is inserted';
COMMENT ON TRIGGER trigger_update_thread_last_message_at ON public.messages IS 'Trigger to update thread last_message_at on new message';

-- 5. Mettre à jour les threads existants avec le dernier message
DO $$
DECLARE
  thread_record RECORD;
  latest_message_time TIMESTAMPTZ;
BEGIN
  FOR thread_record IN SELECT id FROM public.threads LOOP
    SELECT MAX(created_at) INTO latest_message_time
    FROM public.messages
    WHERE thread_id = thread_record.id;
    
    IF latest_message_time IS NOT NULL THEN
      UPDATE public.threads
      SET last_message_at = latest_message_time
      WHERE id = thread_record.id;
    END IF;
  END LOOP;
END $$;
