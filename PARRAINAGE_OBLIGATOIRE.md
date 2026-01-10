# Système de Parrainage Obligatoire pour Annonces

## 📋 Description

J'ai mis en place un système qui **oblige les utilisateurs à parrainer 2 personnes** avant que leurs annonces (trajets et colis) ne deviennent visibles par la communauté.

## ✨ Fonctionnalités

### 1. **Nouvelles annonces nécessitent 2 parrainages**
- Quand un utilisateur publie un trajet ou un colis, l'annonce est créée mais **n'est pas visible** par les autres utilisateurs
- L'utilisateur doit avoir **2 parrainages acceptés** pour que son annonce devienne visible
- L'utilisateur peut toujours voir ses propres annonces dans "Mes annonces"

### 2. **Déblocage automatique**
- Dès qu'un parrainage est accepté, le système met à jour automatiquement toutes les annonces de l'utilisateur
- Quand l'utilisateur atteint 2 parrainages acceptés, ses annonces deviennent automatiquement visibles

### 3. **Interface utilisateur**
- **Message à la publication** : "Parrainez 2 personne(s) pour rendre votre annonce visible"
- **Badge de statut** dans "Mes annonces" :
  - 🔒 "2 parrainage(s)" → Annonce non visible
  - 🔒 "1 parrainage(s)" → Annonce non visible (1/2 complété)
  - ✅ "Visible" → Annonce visible par la communauté

### 4. **Annonces existantes protégées**
- Les annonces déjà publiées restent visibles (requires_referrals = 0)
- Seules les **nouvelles annonces** nécessitent des parrainages

## 🗄️ Modifications Base de Données

### Migration créée : `20260110_referral_required_visibility.sql`

**Nouveaux champs dans `parcels` et `trips` :**
- `requires_referrals` (INTEGER) : Nombre de parrainages requis (défaut = 0, nouvelles annonces = 2)
- `verified_referrals_count` (INTEGER) : Nombre actuel de parrainages acceptés (auto-mis à jour)

**Nouvelles fonctions :**
- `is_listing_visible()` : Vérifie si une annonce est visible
- `update_user_listing_visibility()` : Trigger qui met à jour automatiquement les compteurs

**RLS Policies mises à jour :**
- Les annonces ne sont visibles que si `verified_referrals_count >= requires_referrals`
- L'utilisateur peut toujours voir ses propres annonces
- Les admins peuvent tout voir

## 📝 Modifications Code

### 1. [useParcels.ts](src/hooks/useParcels.ts)
- `createParcel()` compte les parrainages acceptés
- Initialise `requires_referrals = 2` et `verified_referrals_count = compteur`
- Message adapté selon visibilité

### 2. [useTrips.ts](src/hooks/useTrips.ts)
- `createTrip()` compte les parrainages acceptés
- Initialise `requires_referrals = 2` et `verified_referrals_count = compteur`
- Message adapté selon visibilité

### 3. [MyListings.tsx](src/pages/MyListings.tsx)
- Ajout des interfaces avec champs `requires_referrals` et `verified_referrals_count`
- Badge de visibilité affichant le statut
- Badges colorés : rouge si non visible, outline si visible

## 🚀 Déploiement

### Local (Supabase CLI)
```bash
# Démarrer Docker Desktop
# Puis appliquer la migration
supabase db reset --local
# ou
supabase migration up --local
```

### Production (Supabase Dashboard)
1. Aller dans le Dashboard Supabase
2. Database → Migrations
3. Créer une nouvelle migration avec le contenu de `20260110_referral_required_visibility.sql`
4. Appliquer la migration

OU utiliser la CLI :
```bash
supabase db push
```

## 🧪 Comment Tester

### Scénario 1 : Nouvelle annonce sans parrainages
1. Créer un compte utilisateur
2. Publier un trajet ou un colis
3. ✅ Message : "Parrainez 2 personne(s) pour rendre votre annonce visible"
4. ✅ Dans "Mes annonces" : Badge "🔒 2 parrainage(s)"
5. ✅ L'annonce n'apparaît PAS dans l'Explorer pour les autres utilisateurs
6. ✅ L'utilisateur voit sa propre annonce dans "Mes annonces"

### Scénario 2 : Premier parrainage accepté
1. Parrainer 1 personne (qui accepte)
2. ✅ Badge passe à "🔒 1 parrainage(s)"
3. ✅ L'annonce n'est toujours pas visible dans l'Explorer

### Scénario 3 : Deux parrainages acceptés
1. Parrainer une 2ème personne (qui accepte)
2. ✅ Badge passe à "✅ Visible"
3. ✅ L'annonce devient visible dans l'Explorer pour tout le monde

### Scénario 4 : Nouvelle annonce avec déjà 2 parrainages
1. Utilisateur ayant déjà 2+ parrainages acceptés
2. Publier un trajet ou un colis
3. ✅ Message : "Votre annonce est maintenant visible par la communauté"
4. ✅ Badge "✅ Visible"
5. ✅ Annonce immédiatement visible dans l'Explorer

### Scénario 5 : Annonces existantes
1. Annonces créées avant la migration
2. ✅ `requires_referrals = 0` → Toujours visibles
3. ✅ Pas de badge de parrainage affiché

## 🔍 Vérification SQL

### Voir les annonces et leur statut de visibilité
```sql
-- Trajets
SELECT 
  id, 
  from_city, 
  to_city, 
  requires_referrals, 
  verified_referrals_count,
  CASE 
    WHEN verified_referrals_count >= requires_referrals THEN 'VISIBLE'
    ELSE 'HIDDEN'
  END as visibility_status
FROM trips
WHERE user_id = 'USER_ID_HERE';

-- Colis
SELECT 
  id, 
  from_city, 
  to_city, 
  requires_referrals, 
  verified_referrals_count,
  CASE 
    WHEN verified_referrals_count >= requires_referrals THEN 'VISIBLE'
    ELSE 'HIDDEN'
  END as visibility_status
FROM parcels
WHERE user_id = 'USER_ID_HERE';
```

### Compter les parrainages acceptés
```sql
SELECT 
  referrer_id,
  COUNT(*) as accepted_referrals
FROM referrals
WHERE status = 'accepted'
GROUP BY referrer_id;
```

## 🎯 Flux Utilisateur

```
1. Utilisateur crée compte
   └─> 0 parrainages acceptés

2. Utilisateur publie annonce
   └─> Annonce créée avec requires_referrals=2, verified_referrals_count=0
   └─> Message: "Parrainez 2 personne(s)..."
   └─> Badge: 🔒 2 parrainage(s)
   └─> Visible uniquement par l'utilisateur

3. Utilisateur envoie demande parrainage à Alice
   └─> Alice accepte
   └─> TRIGGER met à jour verified_referrals_count=1 sur toutes annonces utilisateur
   └─> Badge: 🔒 1 parrainage(s)
   └─> Toujours non visible publiquement

4. Utilisateur envoie demande parrainage à Bob
   └─> Bob accepte
   └─> TRIGGER met à jour verified_referrals_count=2 sur toutes annonces utilisateur
   └─> Badge: ✅ Visible
   └─> Annonce devient visible dans l'Explorer

5. Utilisateur publie une nouvelle annonce
   └─> verified_referrals_count=2 (compteur actuel)
   └─> requires_referrals=2
   └─> Message: "Votre annonce est maintenant visible..."
   └─> Badge: ✅ Visible
   └─> Visible immédiatement dans l'Explorer
```

## 🔒 Sécurité (RLS)

Les Row Level Security policies garantissent :
- Utilisateurs ne peuvent voir QUE les annonces où `verified_referrals_count >= requires_referrals`
- Exception : propriétaire voit toujours ses propres annonces
- Exception : admins voient toutes les annonces

## ⚠️ Points d'Attention

1. **Trigger automatique** : Les compteurs se mettent à jour automatiquement, pas besoin d'action manuelle
2. **Performance** : Index créés sur `(user_id, verified_referrals_count, requires_referrals)` pour filtrage rapide
3. **Rétrocompatibilité** : Annonces existantes ont `requires_referrals=0` donc restent visibles
4. **Pas de vérification téléphone** : Le système de parrainage n'a plus de barrières (téléphone, ancienneté)

## 📊 Métriques à Suivre

- Taux de conversion : % utilisateurs qui atteignent 2 parrainages
- Délai moyen pour atteindre 2 parrainages
- % d'annonces visibles vs non visibles
- Taux d'abandon après publication d'annonce
