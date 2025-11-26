# 🚀 Déploiement en Production - Système de Matching

## Checklist Avant Déploiement

### 1. Migrations Base de Données ✅
Les migrations sont déjà appliquées sur Supabase Cloud.

**Vérification:**
```bash
npx supabase db diff --schema public
# Devrait afficher "No schema changes detected"
```

### 2. Variables d'Environnement ✅
Vérifier que `.env` contient:
```env
VITE_SUPABASE_PROJECT_ID="odzxqpaovgxcwqilildp"
VITE_SUPABASE_PUBLISHABLE_KEY="[CLÉ PUBLIQUE]"
VITE_SUPABASE_URL="https://odzxqpaovgxcwqilildp.supabase.co"
```

### 3. Build de Production

```bash
# Construire l'application
npm run build

# Tester le build localement
npm run preview
```

### 4. Déploiement Vercel

Si l'application est hébergée sur Vercel:

```bash
# Via CLI Vercel
vercel --prod

# Ou via Git push (si configuré)
git add .
git commit -m "feat: système de matching automatique complet"
git push origin main
```

**Variables d'environnement Vercel:**
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_PUBLISHABLE_KEY`
- ✅ `VITE_OAUTH_REDIRECT_PROD`

---

## Post-Déploiement

### 1. Vérification Santé du Système

#### A. Tester les Triggers
```sql
-- Dans Supabase SQL Editor
-- Créer un colis test
INSERT INTO parcels (user_id, from_country, from_city, to_country, to_city, weight_kg, size, type, deadline)
VALUES (
  '[VOTRE_USER_ID]',
  'France',
  'Paris',
  'Bénin',
  'Cotonou',
  5,
  'medium',
  'documents',
  CURRENT_DATE + INTERVAL '10 days'
)
RETURNING id;

-- Vérifier que les correspondances sont créées automatiquement
SELECT COUNT(*) FROM parcel_matches 
WHERE parcel_id = '[ID_DU_COLIS_TEST]';
-- Devrait retourner > 0 si des trajets compatibles existent

-- Nettoyer
DELETE FROM parcels WHERE id = '[ID_DU_COLIS_TEST]';
```

#### B. Tester les Notifications
```sql
-- Vérifier qu'il y a des notifications
SELECT COUNT(*) FROM notifications 
WHERE type = 'match' 
AND created_at > NOW() - INTERVAL '24 hours';

-- Vérifier une notification spécifique
SELECT * FROM notifications 
ORDER BY created_at DESC 
LIMIT 5;
```

#### C. Vérifier les Index
```sql
-- Tous les index doivent exister
SELECT indexname FROM pg_indexes 
WHERE tablename = 'parcel_matches';

-- Devrait retourner:
-- idx_parcel_matches_parcel_id
-- idx_parcel_matches_trip_id
-- idx_parcel_matches_score
-- idx_parcel_matches_status
-- idx_parcel_matches_created_at
```

### 2. Monitoring

#### Métriques à Surveiller

**Supabase Dashboard > Database > Performance**
- Temps de réponse moyen: < 100ms
- Nombre de requêtes/seconde
- Utilisation CPU/RAM

**Requêtes SQL pour Analytics:**
```sql
-- Nombre total de correspondances créées
SELECT COUNT(*) as total_matches FROM parcel_matches;

-- Distribution des scores
SELECT 
  CASE 
    WHEN match_score >= 90 THEN 'Excellent (90-100%)'
    WHEN match_score >= 70 THEN 'Bon (70-89%)'
    WHEN match_score >= 50 THEN 'Acceptable (50-69%)'
  END as score_range,
  COUNT(*) as count
FROM parcel_matches
GROUP BY score_range;

-- Taux de conversion (accepté vs total)
SELECT 
  COUNT(CASE WHEN status = 'accepted' THEN 1 END) * 100.0 / COUNT(*) as acceptance_rate
FROM parcel_matches;

-- Top 10 routes avec le plus de matches
SELECT 
  pmd.parcel_from_city || ' → ' || pmd.parcel_to_city as route,
  COUNT(*) as match_count,
  AVG(pmd.match_score) as avg_score
FROM parcel_matches_detailed pmd
GROUP BY route
ORDER BY match_count DESC
LIMIT 10;
```

### 3. Maintenance Automatique

#### Job de Nettoyage des Matches Expirés

Créer une Edge Function Supabase qui s'exécute quotidiennement:

```bash
# Créer la fonction
npx supabase functions new cleanup-expired-matches
```

**Fichier: `supabase/functions/cleanup-expired-matches/index.ts`**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Appeler la fonction de nettoyage
    const { error } = await supabaseClient.rpc('cleanup_expired_matches')
    
    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, message: 'Cleanup completed' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

**Déployer la fonction:**
```bash
npx supabase functions deploy cleanup-expired-matches
```

**Configurer le Cron (via Supabase Dashboard):**
```
Nom: cleanup-expired-matches
Fréquence: 0 2 * * * (tous les jours à 2h du matin)
Fonction: cleanup-expired-matches
```

---

## Optimisations de Performance

### 1. Index Supplémentaires (si nécessaire)

Si vous observez des requêtes lentes:

```sql
-- Index composite pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_parcel_matches_user_parcels 
ON parcel_matches(parcel_id, status, match_score DESC)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_parcel_matches_user_trips 
ON parcel_matches(trip_id, status, match_score DESC)
WHERE status = 'pending';
```

### 2. Cache Côté Client

Si vous avez beaucoup d'utilisateurs, ajoutez du cache React Query:

```typescript
// src/hooks/useNotifications.ts
import { useQuery } from '@tanstack/react-query';

export const useNotifications = () => {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: loadMatchNotifications,
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60 * 5, // 5 minutes
  });
  
  // ...
};
```

### 3. Pagination des Suggestions

Si un utilisateur a beaucoup de matches:

```typescript
// src/components/matching/MatchingSuggestions.tsx
const [page, setPage] = useState(0);
const ITEMS_PER_PAGE = 5;

// Afficher avec pagination
const displayedMatches = matches.slice(
  page * ITEMS_PER_PAGE, 
  (page + 1) * ITEMS_PER_PAGE
);
```

---

## Rollback Plan

Si un problème survient en production:

### Rollback des Migrations

```bash
# Lister les migrations appliquées
npx supabase db remote commit

# Rollback vers une migration spécifique
npx supabase db reset --db-url $DATABASE_URL
```

### Rollback du Code

```bash
# Via Git
git revert HEAD
git push origin main

# Via Vercel
vercel rollback
```

### Désactiver Temporairement le Matching

```sql
-- Désactiver les triggers
ALTER TABLE parcels DISABLE TRIGGER auto_generate_parcel_matches;
ALTER TABLE trips DISABLE TRIGGER auto_generate_trip_matches;

-- Réactiver plus tard
ALTER TABLE parcels ENABLE TRIGGER auto_generate_parcel_matches;
ALTER TABLE trips ENABLE TRIGGER auto_generate_trip_matches;
```

---

## Tests de Charge (Recommandé)

### Scénario de Test

1. **Créer 100 colis**
2. **Créer 100 trajets**
3. **Vérifier:**
   - Temps de création < 1s par item
   - Toutes les correspondances créées
   - Notifications envoyées

### Script de Test

```sql
-- Générer des colis de test
DO $$
DECLARE
  i INTEGER;
BEGIN
  FOR i IN 1..100 LOOP
    INSERT INTO parcels (
      user_id, 
      from_country, 
      from_city, 
      to_country, 
      to_city, 
      weight_kg, 
      size, 
      type, 
      deadline
    )
    VALUES (
      '[VOTRE_USER_ID]',
      'France',
      'Paris',
      'Bénin',
      'Cotonou',
      FLOOR(RANDOM() * 20 + 1),
      'medium',
      'documents',
      CURRENT_DATE + (RANDOM() * 30)::INTEGER
    );
  END LOOP;
END $$;

-- Vérifier le temps d'exécution
SELECT 
  COUNT(*) as total_matches,
  AVG(match_score) as avg_score,
  MAX(created_at) - MIN(created_at) as time_span
FROM parcel_matches
WHERE created_at > NOW() - INTERVAL '5 minutes';
```

---

## Alertes & Monitoring

### Créer des Alertes Supabase

**Dashboard > Settings > Alerts**

1. **Trigger Failed**
   ```
   Condition: pg_stat_user_triggers errors > 0
   Action: Email + Slack
   ```

2. **High Query Time**
   ```
   Condition: avg_query_time > 500ms
   Action: Email
   ```

3. **Database Storage**
   ```
   Condition: storage > 80%
   Action: Email
   ```

### Logs à Surveiller

```sql
-- Requêtes lentes
SELECT 
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Erreurs récentes
SELECT * FROM pg_stat_database_conflicts
WHERE datname = 'postgres';
```

---

## Communication Utilisateurs

### Annonce du Feature

**Email aux utilisateurs:**
```
Sujet: 🎉 Nouveau : Suggestions de correspondances automatiques !

Bonjour,

Nous avons ajouté une nouvelle fonctionnalité à Kolimeet :

✨ Suggestions automatiques de trajets/colis compatibles
🔔 Notifications en temps réel
🎯 Scores de compatibilité (50-100%)

Plus besoin de chercher manuellement ! Nous vous proposons 
automatiquement les meilleures correspondances.

Testez dès maintenant en publiant un colis ou un trajet.

L'équipe Kolimeet
```

### FAQ à Ajouter

**Q: Comment fonctionne le score de compatibilité ?**  
R: Le score est basé sur la route (même pays), les villes (bonus si identiques) et la date. Un score de 100% signifie un match parfait.

**Q: Pourquoi je ne reçois pas de suggestions ?**  
R: Il n'y a peut-être aucun trajet/colis compatible pour le moment. Vérifiez que votre deadline/date de départ est correcte.

**Q: Comment contacter quelqu'un depuis une suggestion ?**  
R: Cliquez sur "Contacter" dans la carte de suggestion. Une conversation sera automatiquement créée.

---

## Checklist Finale de Déploiement

- [ ] Migrations appliquées sur Supabase Cloud
- [ ] Types TypeScript régénérés
- [ ] Build de production réussi (`npm run build`)
- [ ] Variables d'environnement configurées sur Vercel
- [ ] Tests manuels effectués (voir QUICK_TEST_GUIDE.md)
- [ ] Edge Function de nettoyage déployée
- [ ] Cron job configuré (nettoyage quotidien)
- [ ] Alerts Supabase configurées
- [ ] Documentation partagée avec l'équipe
- [ ] Annonce utilisateurs envoyée
- [ ] FAQ mise à jour

---

## Contacts Support

**En cas de problème:**
- 📧 Email: [votre-email]
- 💬 Slack: #tech-support
- 📖 Documentation: [lien vers docs]

**Supabase Support:**
- Dashboard: https://supabase.com/dashboard/support
- Discord: https://discord.supabase.com

---

**Déployé le:** [DATE]  
**Version:** 2.0.0 - Matching System  
**Responsable:** [VOTRE NOM]

🎉 **Bon déploiement !**
