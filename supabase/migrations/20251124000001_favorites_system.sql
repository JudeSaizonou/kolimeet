-- Migration: Système de favoris pour les annonces
-- Date: 2025-11-24
-- Description: Permet aux utilisateurs de mettre en favoris des trajets et colis

-- 1. Créer la table favorites
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('trip', 'parcel')),
  item_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Contrainte d'unicité : un utilisateur ne peut favoriser qu'une fois le même item
  UNIQUE(user_id, item_type, item_id)
);

-- 2. Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_item ON public.favorites(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON public.favorites(created_at DESC);

-- 3. Enable RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- 4. Policies RLS
-- Les utilisateurs peuvent voir leurs propres favoris
CREATE POLICY "Users can view their own favorites"
  ON public.favorites
  FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent ajouter leurs propres favoris
CREATE POLICY "Users can insert their own favorites"
  ON public.favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres favoris
CREATE POLICY "Users can delete their own favorites"
  ON public.favorites
  FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Fonction pour vérifier si un item est en favoris
CREATE OR REPLACE FUNCTION is_favorited(
  p_user_id UUID,
  p_item_type TEXT,
  p_item_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.favorites
    WHERE user_id = p_user_id
      AND item_type = p_item_type
      AND item_id = p_item_id
  );
END;
$$;

-- 6. Fonction pour compter les favoris d'un item
CREATE OR REPLACE FUNCTION count_favorites(
  p_item_type TEXT,
  p_item_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  favorite_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO favorite_count
  FROM public.favorites
  WHERE item_type = p_item_type
    AND item_id = p_item_id;
  
  RETURN favorite_count;
END;
$$;

-- 7. Vue pour les favoris avec détails des items
CREATE OR REPLACE VIEW favorites_with_details AS
SELECT 
  f.id,
  f.user_id,
  f.item_type,
  f.item_id,
  f.created_at,
  CASE 
    WHEN f.item_type = 'trip' THEN (
      SELECT json_build_object(
        'id', t.id,
        'from_city', t.from_city,
        'from_country', t.from_country,
        'to_city', t.to_city,
        'to_country', t.to_country,
        'date_departure', t.date_departure,
        'capacity_kg', t.capacity_kg,
        'capacity_available_kg', t.capacity_available_kg,
        'price_expect', t.price_expect,
        'status', t.status,
        'user_id', t.user_id
      )
      FROM public.trips t
      WHERE t.id = f.item_id
    )
    WHEN f.item_type = 'parcel' THEN (
      SELECT json_build_object(
        'id', p.id,
        'from_city', p.from_city,
        'from_country', p.from_country,
        'to_city', p.to_city,
        'to_country', p.to_country,
        'deadline', p.deadline,
        'type', p.type,
        'weight_kg', p.weight_kg,
        'size', p.size,
        'status', p.status,
        'user_id', p.user_id
      )
      FROM public.parcels p
      WHERE p.id = f.item_id
    )
  END as item_details
FROM public.favorites f;

-- 8. Grants
GRANT EXECUTE ON FUNCTION is_favorited TO authenticated;
GRANT EXECUTE ON FUNCTION count_favorites TO authenticated;
GRANT SELECT ON favorites_with_details TO authenticated;

-- 9. Commentaires
COMMENT ON TABLE public.favorites IS 'Table pour stocker les favoris des utilisateurs (trajets et colis)';
COMMENT ON COLUMN public.favorites.item_type IS 'Type de l''item: trip ou parcel';
COMMENT ON COLUMN public.favorites.item_id IS 'ID du trajet ou colis favori';
COMMENT ON FUNCTION is_favorited IS 'Vérifie si un item est en favoris pour un utilisateur';
COMMENT ON FUNCTION count_favorites IS 'Compte le nombre de favoris pour un item';
COMMENT ON VIEW favorites_with_details IS 'Vue avec les détails complets des favoris';
