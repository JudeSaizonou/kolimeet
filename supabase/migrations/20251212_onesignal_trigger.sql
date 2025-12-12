-- Migration: Trigger pour envoyer les notifications push via OneSignal
-- Quand un message est inséré, on appelle l'Edge Function send-onesignal-notification
-- Utilise supabase_functions.http_request (méthode officielle)

-- Supprimer l'ancien trigger et fonction s'ils existent
DROP TRIGGER IF EXISTS on_new_message_notify ON messages;
DROP FUNCTION IF EXISTS notify_new_message();

-- Fonction qui prépare le payload et appelle l'Edge Function
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  sender_name TEXT;
  thread_record RECORD;
  message_preview TEXT;
  payload JSONB;
BEGIN
  -- Récupérer les infos du thread
  SELECT created_by, other_user_id INTO thread_record
  FROM threads
  WHERE id = NEW.thread_id;

  -- Déterminer le destinataire (l'autre utilisateur du thread)
  IF thread_record.created_by = NEW.sender_id THEN
    recipient_id := thread_record.other_user_id;
  ELSE
    recipient_id := thread_record.created_by;
  END IF;

  -- Ne pas notifier si pas de destinataire
  IF recipient_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Récupérer le nom de l'expéditeur
  SELECT COALESCE(full_name, 'Quelqu''un') INTO sender_name
  FROM profiles
  WHERE user_id = NEW.sender_id;

  -- Préparer le preview du message
  message_preview := LEFT(NEW.content, 50);
  IF LENGTH(NEW.content) > 50 THEN
    message_preview := message_preview || '...';
  END IF;

  -- Construire le payload
  payload := jsonb_build_object(
    'recipientUserId', recipient_id::text,
    'title', sender_name,
    'message', message_preview,
    'url', '/messages/' || NEW.thread_id::text,
    'data', jsonb_build_object(
      'type', 'message',
      'thread_id', NEW.thread_id::text,
      'message_id', NEW.id::text
    )
  );

  -- Appeler l'Edge Function via supabase_functions.http_request
  -- Cette fonction est fournie par Supabase et gère l'authentification automatiquement
  PERFORM supabase_functions.http_request(
    'https://odzxqpaovgxcwqilildp.supabase.co/functions/v1/send-onesignal-notification',
    'POST',
    '{"Content-Type":"application/json"}',
    payload::text,
    '5000'
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log l'erreur mais ne bloque pas l'insertion du message
    RAISE WARNING 'Failed to send push notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger
CREATE TRIGGER on_new_message_notify
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION notify_new_message() TO postgres, service_role;
