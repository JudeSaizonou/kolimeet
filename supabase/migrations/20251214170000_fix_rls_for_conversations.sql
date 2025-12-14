-- Migration: Permettre l'accès aux annonces dans les conversations
-- Les annonces expirées doivent rester visibles dans les conversations mais pas dans l'Explorer

-- Supprimer les anciennes policies restrictives
DROP POLICY IF EXISTS "Anyone can view open trips" ON public.trips;
DROP POLICY IF EXISTS "Anyone can view open parcels" ON public.parcels;

-- Nouvelle policy pour les trips: 
-- - Visible dans l'Explorer si open ET date future
-- - Toujours visible pour le propriétaire
-- - Toujours visible pour les admins
-- - Toujours visible si l'utilisateur a un thread lié à ce trip
CREATE POLICY "View trips policy"
  ON public.trips FOR SELECT
  USING (
    -- Annonces ouvertes avec date future (pour l'Explorer)
    (status = 'open' AND date_departure >= CURRENT_DATE)
    -- Propriétaire peut toujours voir ses annonces
    OR auth.uid() = user_id 
    -- Admin peut tout voir
    OR public.has_role(auth.uid(), 'admin')
    -- Utilisateurs ayant un thread lié peuvent voir (pour les conversations)
    OR EXISTS (
      SELECT 1 FROM public.threads t
      WHERE t.related_type = 'trip'
        AND t.related_id = trips.id
        AND (t.created_by = auth.uid() OR t.other_user_id = auth.uid())
    )
  );

-- Nouvelle policy pour les parcels:
-- - Visible dans l'Explorer si open ET deadline future
-- - Toujours visible pour le propriétaire
-- - Toujours visible pour les admins
-- - Toujours visible si l'utilisateur a un thread lié à ce parcel
CREATE POLICY "View parcels policy"
  ON public.parcels FOR SELECT
  USING (
    -- Annonces ouvertes avec deadline future (pour l'Explorer)
    (status = 'open' AND deadline >= CURRENT_DATE)
    -- Propriétaire peut toujours voir ses annonces
    OR auth.uid() = user_id 
    -- Admin peut tout voir
    OR public.has_role(auth.uid(), 'admin')
    -- Utilisateurs ayant un thread lié peuvent voir (pour les conversations)
    OR EXISTS (
      SELECT 1 FROM public.threads t
      WHERE t.related_type = 'parcel'
        AND t.related_id = parcels.id
        AND (t.created_by = auth.uid() OR t.other_user_id = auth.uid())
    )
  );

-- Commentaires pour documentation
COMMENT ON POLICY "View trips policy" ON public.trips IS 
  'Permet de voir les trips: ouverts+futurs pour Explorer, toujours pour propriétaire/admin/conversations';
COMMENT ON POLICY "View parcels policy" ON public.parcels IS 
  'Permet de voir les parcels: ouverts+futurs pour Explorer, toujours pour propriétaire/admin/conversations';
