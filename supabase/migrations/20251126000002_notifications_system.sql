-- Migration pour système de notifications de correspondances
-- Envoie des notifications quand de nouvelles correspondances sont trouvées

-- Note: La table notifications existe déjà, on ajoute juste les fonctions et triggers

-- Fonction pour notifier l'utilisateur d'une nouvelle correspondance
CREATE OR REPLACE FUNCTION notify_new_match()
RETURNS TRIGGER AS $$
DECLARE
  v_parcel_owner_id UUID;
  v_trip_owner_id UUID;
  v_notification_message TEXT;
  v_parcel_route TEXT;
  v_trip_route TEXT;
BEGIN
  -- Récupérer les propriétaires
  SELECT user_id INTO v_parcel_owner_id FROM parcels WHERE id = NEW.parcel_id;
  SELECT user_id INTO v_trip_owner_id FROM trips WHERE id = NEW.trip_id;
  
  -- Récupérer les routes pour le message
  SELECT from_city || ' → ' || to_city INTO v_parcel_route FROM parcels WHERE id = NEW.parcel_id;
  SELECT from_city || ' → ' || to_city INTO v_trip_route FROM trips WHERE id = NEW.trip_id;

  -- Notifier l'expéditeur du colis qu'un trajet correspond
  v_notification_message := 'Un nouveau trajet correspond à votre colis (' || v_parcel_route || '). Score de compatibilité : ' || NEW.match_score || '%';
  
  INSERT INTO notifications (user_id, type, title, message, related_type, related_id)
  VALUES (
    v_parcel_owner_id,
    'match',
    'Nouveau trajet disponible',
    v_notification_message,
    'parcel_match',
    NEW.id
  );

  -- Notifier le voyageur qu'un colis correspond à son trajet
  v_notification_message := 'Un nouveau colis correspond à votre trajet (' || v_trip_route || '). Score de compatibilité : ' || NEW.match_score || '%';
  
  INSERT INTO notifications (user_id, type, title, message, related_type, related_id)
  VALUES (
    v_trip_owner_id,
    'match',
    'Nouveau colis à transporter',
    v_notification_message,
    'parcel_match',
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour envoyer les notifications lors de nouvelles correspondances
DROP TRIGGER IF EXISTS notify_on_new_match ON parcel_matches;
CREATE TRIGGER notify_on_new_match
  AFTER INSERT ON parcel_matches
  FOR EACH ROW
  WHEN (NEW.match_score >= 50) -- Notifier seulement pour les bonnes correspondances
  EXECUTE FUNCTION notify_new_match();

-- Fonction pour nettoyer les anciennes correspondances expirées
CREATE OR REPLACE FUNCTION cleanup_expired_matches()
RETURNS void AS $$
BEGIN
  -- Marquer comme expirées les correspondances dont le trajet est passé
  UPDATE parcel_matches pm
  SET status = 'expired'
  FROM trips t
  WHERE pm.trip_id = t.id
    AND pm.status = 'pending'
    AND t.date_departure < CURRENT_DATE;

  -- Marquer comme expirées les correspondances dont la deadline du colis est dépassée
  UPDATE parcel_matches pm
  SET status = 'expired'
  FROM parcels p
  WHERE pm.parcel_id = p.id
    AND pm.status = 'pending'
    AND p.deadline < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- S'assurer que la table notifications existe avec les bonnes colonnes
DO $$ 
BEGIN
  -- Créer la table si elle n'existe pas
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    CREATE TABLE notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      related_type TEXT,
      related_id UUID,
      read BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;

  -- Ajouter les colonnes manquantes si nécessaire
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'related_type') THEN
    ALTER TABLE notifications ADD COLUMN related_type TEXT;
  END IF;

  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'related_id') THEN
    ALTER TABLE notifications ADD COLUMN related_id UUID;
  END IF;
END $$;

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- RLS pour les notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Fonction pour marquer une notification comme lue
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET read = true
  WHERE id = p_notification_id
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir le nombre de notifications non lues
CREATE OR REPLACE FUNCTION get_unread_notifications_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM notifications
    WHERE user_id = auth.uid()
      AND read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les notifications récentes
CREATE OR REPLACE FUNCTION get_recent_notifications(p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  type TEXT,
  title TEXT,
  message TEXT,
  related_type TEXT,
  related_id UUID,
  read BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.type,
    n.title,
    n.message,
    n.related_type,
    n.related_id,
    n.read,
    n.created_at
  FROM notifications n
  WHERE n.user_id = auth.uid()
  ORDER BY n.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions
GRANT SELECT, UPDATE ON notifications TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notifications_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_notifications(INTEGER) TO authenticated;

-- Commentaires
COMMENT ON TABLE notifications IS 'Table des notifications utilisateur';
COMMENT ON FUNCTION notify_new_match IS 'Envoie une notification quand une nouvelle correspondance est créée';
COMMENT ON FUNCTION cleanup_expired_matches IS 'Nettoie les correspondances expirées';
COMMENT ON FUNCTION mark_notification_read IS 'Marque une notification comme lue';
COMMENT ON FUNCTION get_unread_notifications_count IS 'Retourne le nombre de notifications non lues';
COMMENT ON FUNCTION get_recent_notifications IS 'Retourne les notifications récentes de l''utilisateur';

