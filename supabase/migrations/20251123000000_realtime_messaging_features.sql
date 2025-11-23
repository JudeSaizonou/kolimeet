-- Migration: Améliorer la messagerie pour un fonctionnement temps réel type WhatsApp
-- Date: 2025-11-23
-- Description: Ajoute read_at, delivered_at, et améliore le système de typing

-- 1. Ajouter les colonnes pour les read receipts
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- 2. Mettre à jour les messages existants
-- Les messages déjà marqués is_read=true auront read_at = created_at
UPDATE public.messages 
SET read_at = created_at,
    delivered_at = created_at
WHERE is_read = true AND read_at IS NULL;

-- Les messages non lus sont considérés comme délivrés
UPDATE public.messages 
SET delivered_at = created_at
WHERE delivered_at IS NULL;

-- 3. Créer un index pour optimiser les requêtes de messages non lus
CREATE INDEX IF NOT EXISTS idx_messages_unread 
ON public.messages(thread_id, sender_id, read_at) 
WHERE read_at IS NULL;

-- 4. Fonction pour marquer un message comme lu
CREATE OR REPLACE FUNCTION mark_message_as_read(message_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.messages
  SET read_at = now()
  WHERE id = message_id
    AND read_at IS NULL;
END;
$$;

-- 5. Fonction pour marquer tous les messages d'un thread comme lus
CREATE OR REPLACE FUNCTION mark_thread_messages_as_read(p_thread_id UUID, p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.messages
  SET read_at = now()
  WHERE thread_id = p_thread_id
    AND sender_id != p_user_id
    AND read_at IS NULL;
END;
$$;

-- 6. Améliorer la table typing_status (si elle existe)
-- Ajouter un timestamp pour nettoyer automatiquement les statuts obsolètes
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'typing_status') THEN
    ALTER TABLE public.typing_status 
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
    
    -- Créer un index pour optimiser le nettoyage
    CREATE INDEX IF NOT EXISTS idx_typing_status_cleanup 
    ON public.typing_status(updated_at);
  END IF;
END $$;

-- 7. Fonction pour nettoyer les statuts de typing obsolètes (>10 secondes)
DROP TRIGGER IF EXISTS cleanup_typing_status_trigger ON public.typing_status;
DROP FUNCTION IF EXISTS cleanup_old_typing_status();

CREATE OR REPLACE FUNCTION cleanup_old_typing_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.typing_status
  WHERE updated_at < now() - interval '10 seconds';
END;
$$;

-- 8. Trigger pour mettre à jour updated_at sur typing_status
DROP TRIGGER IF EXISTS update_typing_status_timestamp ON public.typing_status;

CREATE OR REPLACE FUNCTION update_typing_status_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'typing_status') THEN
    CREATE TRIGGER update_typing_status_timestamp
    BEFORE UPDATE ON public.typing_status
    FOR EACH ROW
    EXECUTE FUNCTION update_typing_status_timestamp();
  END IF;
END $$;

-- 9. Fonction pour obtenir le nombre de messages non lus par thread
CREATE OR REPLACE FUNCTION get_unread_count_by_thread(p_user_id UUID)
RETURNS TABLE (
  thread_id UUID,
  unread_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.thread_id,
    COUNT(*)::BIGINT as unread_count
  FROM public.messages m
  WHERE m.sender_id != p_user_id
    AND m.read_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.threads t
      WHERE t.id = m.thread_id
        AND p_user_id IN (t.created_by, t.other_user_id)
    )
  GROUP BY m.thread_id;
END;
$$;

-- 10. Vue pour les statistiques de messages par thread
CREATE OR REPLACE VIEW thread_message_stats AS
WITH last_messages AS (
  SELECT
    m.*,
    ROW_NUMBER() OVER (PARTITION BY m.thread_id ORDER BY m.created_at DESC, m.id DESC) AS rn
  FROM public.messages m
),
thread_stats AS (
  SELECT 
    t.id as thread_id,
    COUNT(m.id) as total_messages,
    COUNT(m.id) FILTER (WHERE m.read_at IS NULL) as unread_messages,
    MAX(m.created_at) as last_message_at
  FROM public.threads t
  LEFT JOIN public.messages m ON m.thread_id = t.id
  GROUP BY t.id
)
SELECT 
  ts.thread_id,
  ts.total_messages,
  ts.unread_messages,
  ts.last_message_at,
  lm.content as last_message_content
FROM thread_stats ts
LEFT JOIN last_messages lm 
  ON lm.thread_id = ts.thread_id AND lm.rn = 1;

-- 11. Commenter les nouvelles colonnes et fonctions
COMMENT ON COLUMN public.messages.delivered_at IS 'Timestamp when message was delivered to recipient device';
COMMENT ON COLUMN public.messages.read_at IS 'Timestamp when message was read by recipient';
COMMENT ON FUNCTION mark_message_as_read IS 'Mark a single message as read';
COMMENT ON FUNCTION mark_thread_messages_as_read IS 'Mark all unread messages in a thread as read for a user';
COMMENT ON FUNCTION get_unread_count_by_thread IS 'Get count of unread messages per thread for a user';
COMMENT ON VIEW thread_message_stats IS 'Statistics about messages in each thread';

-- 12. Grants pour les fonctions
GRANT EXECUTE ON FUNCTION mark_message_as_read TO authenticated;
GRANT EXECUTE ON FUNCTION mark_thread_messages_as_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_count_by_thread TO authenticated;
GRANT SELECT ON thread_message_stats TO authenticated;
