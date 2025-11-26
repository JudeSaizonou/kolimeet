# Système de Correspondances Automatiques (Auto-Matching)

## Vue d'ensemble

Le système de correspondances automatiques permet de mettre en relation intelligemment les colis et les trajets selon leur compatibilité de route, date et capacité.

## Architecture

### 1. Base de Données

#### Table `parcel_matches`
Stocke les correspondances entre colis et trajets avec un score de compatibilité.

```sql
- id: UUID (primary key)
- parcel_id: UUID (référence vers parcels)
- trip_id: UUID (référence vers trips)
- match_score: INTEGER (0-100)
- status: TEXT (pending, accepted, rejected, expired)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### Vue `parcel_matches_detailed`
Vue enrichie avec toutes les informations des colis et trajets pour faciliter l'affichage.

### 2. Algorithme de Matching

Le score de compatibilité est calculé selon:

```
Score de base = 50 (route compatible)

Bonus ville départ identique = +20
Bonus ville arrivée identique = +20
Bonus date proche (≤7 jours) = +10

Score maximum = 100
Score minimum = 50
```

**Critères de compatibilité:**
- Même pays de départ et d'arrivée
- Date de départ du trajet ≤ deadline du colis
- Poids du colis ≤ capacité disponible du trajet

### 3. Triggers Automatiques

#### `auto_generate_parcel_matches`
- Déclenché: Après insertion d'un nouveau colis
- Action: Génère automatiquement les correspondances avec les trajets compatibles

#### `auto_generate_trip_matches`
- Déclenché: Après insertion d'un nouveau trajet
- Action: Génère automatiquement les correspondances avec les colis compatibles

#### `notify_on_new_match`
- Déclenché: Après insertion d'une correspondance avec score ≥ 50
- Action: Crée une notification pour le propriétaire du colis ET du trajet

### 4. Fonctions SQL

#### `generate_parcel_matches(p_parcel_id UUID)`
Génère toutes les correspondances possibles pour un colis donné.

#### `generate_trip_matches(p_trip_id UUID)`
Génère toutes les correspondances possibles pour un trajet donné.

#### `get_parcel_top_matches(p_parcel_id UUID, p_limit INTEGER)`
Retourne les N meilleures correspondances pour un colis, triées par score.

#### `get_trip_top_matches(p_trip_id UUID, p_limit INTEGER)`
Retourne les N meilleures correspondances pour un trajet, triées par score.

#### `cleanup_expired_matches()`
Marque comme expirées les correspondances dont:
- La date de départ du trajet est passée
- La deadline du colis est dépassée

## Composants React

### 1. `MatchingSuggestions`
**Fichier:** `src/components/matching/MatchingSuggestions.tsx`

Affiche les meilleures correspondances pour un colis ou un trajet.

**Props:**
- `type`: "parcel" | "trip"
- `itemId`: UUID du colis ou trajet
- `maxSuggestions`: Nombre max de suggestions (défaut: 5)

**Fonctionnalités:**
- Affichage des scores avec code couleur:
  - Vert (≥90%): Excellent match
  - Bleu (≥70%): Bon match
  - Jaune (≥50%): Match acceptable
- Bouton "Contacter" pour initier une conversation
- Bouton "Voir le détail" pour naviguer vers la page complète
- Animation et design glassmorphique

**Intégration:**
```tsx
// Dans ParcelDetail.tsx
<MatchingSuggestions type="parcel" itemId={parcelId} maxSuggestions={5} />

// Dans TripDetail.tsx
<MatchingSuggestions type="trip" itemId={tripId} maxSuggestions={5} />
```

### 2. `NotificationBell`
**Fichier:** `src/components/notifications/NotificationBell.tsx`

Bell icon avec dropdown affichant les nouvelles correspondances.

**Fonctionnalités:**
- Badge avec nombre de notifications non lues
- Animation pulse pour attirer l'attention
- Dropdown avec liste des notifications
- Bouton "Tout marquer comme lu"
- Navigation vers la page de détail au clic

**Intégration:**
```tsx
// Dans Navigation.tsx
<NotificationBell />
```

### 3. `useNotifications` Hook
**Fichier:** `src/hooks/useNotifications.ts`

Hook pour gérer l'état des notifications.

**Retour:**
- `notifications`: Notification[] - Liste des notifications
- `unreadCount`: number - Nombre de notifications non lues
- `loading`: boolean - État de chargement
- `markAsRead(id)`: Fonction pour marquer comme lu
- `markAllAsRead()`: Fonction pour tout marquer comme lu
- `refreshNotifications()`: Fonction pour recharger

**Utilisation:**
```tsx
const { 
  notifications, 
  unreadCount, 
  loading, 
  markAsRead,
  markAllAsRead 
} = useNotifications();
```

## Flux Complet

### Scénario 1: Publication d'un nouveau colis

1. **Utilisateur publie un colis**
   - Page: `/publier/colis`
   - Formulaire soumis → INSERT dans `parcels`

2. **Trigger `auto_generate_parcel_matches`**
   - Exécute automatiquement `generate_parcel_matches()`
   - Trouve tous les trajets compatibles
   - Calcule les scores
   - INSERT dans `parcel_matches`

3. **Trigger `notify_on_new_match`** (pour chaque match ≥50%)
   - INSERT dans `notifications` pour:
     - Le propriétaire du colis
     - Le propriétaire du trajet

4. **Affichage des suggestions**
   - Page: `/colis/:id`
   - Composant `MatchingSuggestions` charge et affiche les top 5

5. **Notification en temps réel**
   - `NotificationBell` reçoit la notification
   - Badge s'affiche avec le nombre
   - Animation pulse

### Scénario 2: Publication d'un nouveau trajet

1. **Utilisateur publie un trajet**
   - Page: `/publier/trajet`
   - Formulaire soumis → INSERT dans `trips`

2. **Trigger `auto_generate_trip_matches`**
   - Exécute automatiquement `generate_trip_matches()`
   - Trouve tous les colis compatibles
   - Calcule les scores
   - INSERT dans `parcel_matches`

3. **Trigger `notify_on_new_match`**
   - Notifications créées pour les propriétaires

4. **Affichage des suggestions**
   - Page: `/trajet/:id`
   - Composant `MatchingSuggestions` affiche les colis compatibles

### Scénario 3: Contact depuis une suggestion

1. **Utilisateur clique "Contacter"**
   - Composant: `MatchingSuggestions`
   - Fonction: `handleContact()`

2. **Création du thread de conversation**
   - INSERT dans `threads` (si n'existe pas)
   - Redirection vers `/messages/:threadId`

3. **Marquer la correspondance comme vue**
   - UPDATE `parcel_matches` SET status = 'accepted'
   - Notification supprimée de la liste

## Migrations SQL

### Ordre d'application

1. **20251125235959_create_parcel_matches_table.sql**
   - Crée la table `parcel_matches`
   - Définit les index et RLS policies

2. **20251126000001_auto_matching_system.sql**
   - Crée les fonctions de matching
   - Crée la vue `parcel_matches_detailed`
   - Crée les triggers automatiques

3. **20251126000002_notifications_system.sql**
   - Crée les fonctions de notification
   - Crée le trigger `notify_on_new_match`
   - Définit les RLS policies pour notifications

### Application

```bash
# Via Supabase CLI (recommandé)
npx supabase link --project-ref <PROJECT_ID>
npx supabase db push

# Ou via le script
./scripts/apply-migrations.sh
```

## Tests

### Test Manuel

1. **Créer un trajet**
   ```
   Paris → Cotonou
   Date: 10/12/2024
   Capacité: 20kg
   ```

2. **Créer un colis compatible**
   ```
   Paris → Cotonou
   Poids: 5kg
   Deadline: 15/12/2024
   ```

3. **Vérifier**
   - ✅ Correspondance automatique créée
   - ✅ Score calculé (90-100% si villes identiques)
   - ✅ Notification créée pour les deux utilisateurs
   - ✅ Suggestions affichées sur les pages détail
   - ✅ Badge dans NotificationBell

### Test Base de Données

```sql
-- Vérifier les correspondances créées
SELECT * FROM parcel_matches_detailed 
ORDER BY match_score DESC 
LIMIT 10;

-- Vérifier les notifications
SELECT * FROM notifications 
WHERE type = 'match' 
ORDER BY created_at DESC;

-- Tester la fonction de matching
SELECT generate_parcel_matches('<PARCEL_UUID>');
SELECT get_parcel_top_matches('<PARCEL_UUID>', 5);
```

## Nettoyage et Maintenance

### Fonction de nettoyage automatique

```sql
-- Exécuter périodiquement (via cron ou edge function)
SELECT cleanup_expired_matches();
```

Cette fonction:
- Marque comme `expired` les correspondances avec date dépassée
- Empêche l'affichage de correspondances obsolètes

### Optimisation des performances

Les index créés assurent des requêtes rapides:
- `idx_parcel_matches_parcel_id`
- `idx_parcel_matches_trip_id`
- `idx_parcel_matches_score`
- `idx_parcel_matches_status`
- `idx_parcel_matches_created_at`

## Sécurité (RLS)

### Policies `parcel_matches`

1. **Users can view matches for their parcels**
   - Utilisateurs voient les correspondances de leurs propres colis/trajets

2. **System can insert matches**
   - Les triggers peuvent créer des correspondances

3. **Users can update their matches**
   - Utilisateurs peuvent changer le status (accepter/refuser)

### Policies `notifications`

1. **Users can view own notifications**
   - Utilisateurs voient uniquement leurs notifications

2. **System can insert notifications**
   - Les triggers peuvent créer des notifications

3. **Users can update own notifications**
   - Utilisateurs peuvent marquer comme lu

## Améliorations Futures

### Court terme
- [ ] Filtrer par score minimum (dropdown)
- [ ] Ajouter bouton "Ignorer cette suggestion"
- [ ] Historique des correspondances rejetées

### Moyen terme
- [ ] Machine Learning pour améliorer les scores
- [ ] Notifications push (Web Push API)
- [ ] Email digest quotidien des nouvelles correspondances

### Long terme
- [ ] Algorithme de routage multi-étapes
- [ ] Suggestions de regroupement de colis
- [ ] Prix suggéré basé sur l'historique

## Troubleshooting

### Les correspondances ne se créent pas

1. Vérifier que les triggers sont actifs:
```sql
SELECT * FROM pg_trigger 
WHERE tgname LIKE '%match%';
```

2. Vérifier les logs d'erreur:
```sql
-- Exécuter manuellement la fonction
SELECT generate_parcel_matches('<PARCEL_UUID>');
```

### Les notifications n'apparaissent pas

1. Vérifier la table notifications:
```sql
SELECT * FROM notifications 
WHERE user_id = '<USER_UUID>' 
ORDER BY created_at DESC;
```

2. Vérifier les RLS policies:
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'notifications';
```

### Les types TypeScript ne sont pas à jour

```bash
# Régénérer les types
npx supabase gen types typescript --project-id <PROJECT_ID> > src/integrations/supabase/types.ts

# Redémarrer le serveur de développement
npm run dev
```

## Support

Pour toute question ou problème:
1. Consulter les logs Supabase
2. Vérifier les migrations appliquées
3. Tester les fonctions SQL manuellement
4. Vérifier les RLS policies
