-- Table pour stocker qui est en train d'écrire
CREATE TABLE IF NOT EXISTS typing_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(thread_id, user_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_typing_status_thread_id ON typing_status(thread_id);
CREATE INDEX IF NOT EXISTS idx_typing_status_user_id ON typing_status(user_id);

-- RLS policies
ALTER TABLE typing_status ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir le typing status de leur thread
CREATE POLICY "Users can view typing status in their threads"
ON typing_status FOR SELECT
USING (
  thread_id IN (
    SELECT id FROM threads 
    WHERE created_by = auth.uid() OR other_user_id = auth.uid()
  )
);

-- Les utilisateurs peuvent mettre à jour leur propre typing status
CREATE POLICY "Users can update their own typing status"
ON typing_status FOR ALL
USING (user_id = auth.uid());

-- Fonction pour nettoyer automatiquement les anciens typing status
CREATE OR REPLACE FUNCTION cleanup_old_typing_status()
RETURNS trigger AS $$
BEGIN
  DELETE FROM typing_status
  WHERE updated_at < NOW() - INTERVAL '10 seconds'
    AND is_typing = true;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour nettoyer périodiquement
CREATE TRIGGER cleanup_typing_status_trigger
AFTER INSERT OR UPDATE ON typing_status
EXECUTE FUNCTION cleanup_old_typing_status();
