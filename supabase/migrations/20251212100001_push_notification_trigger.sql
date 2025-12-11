-- Fonction pour envoyer une notification push lors d'un nouveau message
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  sender_name TEXT;
  thread_record RECORD;
  notification_payload JSONB;
BEGIN
  -- Récupérer les infos du thread
  SELECT * INTO thread_record FROM threads WHERE id = NEW.thread_id;
  
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  
  -- Déterminer le destinataire (l'autre utilisateur du thread)
  IF NEW.sender_id = thread_record.created_by THEN
    recipient_id := thread_record.other_user_id;
  ELSE
    recipient_id := thread_record.created_by;
  END IF;
  
  -- Ne pas notifier si l'expéditeur = destinataire (cas improbable)
  IF NEW.sender_id = recipient_id THEN
    RETURN NEW;
  END IF;
  
  -- Récupérer le nom de l'expéditeur
  SELECT full_name INTO sender_name 
  FROM profiles 
  WHERE user_id = NEW.sender_id;
  
  -- Vérifier si l'utilisateur a activé les notifications push pour les messages
  IF EXISTS (
    SELECT 1 FROM notification_preferences 
    WHERE user_id = recipient_id 
    AND push_enabled = true 
    AND push_messages = true
  ) OR NOT EXISTS (
    SELECT 1 FROM notification_preferences WHERE user_id = recipient_id
  ) THEN
    -- Préparer le payload de notification
    notification_payload := jsonb_build_object(
      'title', COALESCE(sender_name, 'Nouveau message'),
      'body', CASE 
        WHEN LENGTH(NEW.content) > 100 THEN SUBSTRING(NEW.content, 1, 97) || '...'
        ELSE NEW.content
      END,
      'tag', 'message-' || NEW.thread_id,
      'data', jsonb_build_object(
        'url', '/messages/' || NEW.thread_id,
        'thread_id', NEW.thread_id,
        'sender_id', NEW.sender_id,
        'type', 'message'
      ),
      'actions', jsonb_build_array(
        jsonb_build_object('action', 'reply', 'title', 'Répondre'),
        jsonb_build_object('action', 'dismiss', 'title', 'Ignorer')
      ),
      'requireInteraction', false
    );
    
    -- Appeler la Edge Function pour envoyer la notification
    -- Note: Ceci nécessite pg_net extension pour les appels HTTP
    -- Alternative: utiliser un webhook ou une queue
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'user_id', recipient_id,
        'payload', notification_payload
      )
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log l'erreur mais ne pas bloquer l'insertion du message
  RAISE WARNING 'Erreur notification push: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger (s'il n'existe pas)
DROP TRIGGER IF EXISTS on_new_message_push_notification ON messages;
CREATE TRIGGER on_new_message_push_notification
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- Note: Ce trigger utilise pg_net qui doit être activé dans Supabase
-- Si pg_net n'est pas disponible, une alternative est d'utiliser 
-- un webhook côté client ou de poll régulièrement
