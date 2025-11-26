# 📦 Guide de Backfill - Correspondances de Colis/Trajets Existants

## 🎯 Objectif

Ce guide détaille la procédure pour générer les correspondances (matches) entre **tous les colis et trajets existants** dans la base de données, avant que le système de matching automatique ne soit activé.

---

## ⚠️ Pré-requis

### 1. Vérifications Techniques

**Base de données:**
- ✅ Migrations `20251125235959` et `20251126000001` appliquées
- ✅ Table `parcel_matches` existe
- ✅ Vue `parcel_matches_detailed` existe
- ✅ Triggers `auto_generate_parcel_matches` et `auto_generate_trip_matches` actifs

**Vérifier via SQL:**
```sql
-- Vérifier les tables
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('parcel_matches', 'parcels', 'trips');

-- Vérifier les triggers
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname LIKE '%match%';
```

### 2. Données Disponibles

**Compter les éléments à traiter:**
```sql
-- Colis actifs
SELECT COUNT(*) FROM parcels WHERE status = 'active';

-- Trajets actifs  
SELECT COUNT(*) FROM trips WHERE status = 'active';

-- Estimation de matches possibles
SELECT 
  (SELECT COUNT(*) FROM parcels WHERE status = 'active') * 
  (SELECT COUNT(*) FROM trips WHERE status = 'active') 
  AS max_possible_matches;
```

### 3. Estimations de Temps

| Nombre de Colis | Nombre de Trajets | Temps Estimé | Matches Max |
|-----------------|-------------------|--------------|-------------|
| 10              | 10                | < 1 seconde  | 100         |
| 100             | 100               | ~5 secondes  | 10,000      |
| 500             | 500               | ~30 secondes | 250,000     |
| 1,000           | 1,000             | ~2 minutes   | 1,000,000   |
| 5,000+          | 5,000+            | ~10+ minutes | 25,000,000+ |

⚠️ **Note:** Le temps réel dépend des ressources Supabase et de la complexité des routes.

---

## 🚀 Procédure d'Exécution

### Étape 1: Dry Run (Simulation)

**Toujours commencer par un dry run pour estimer l'impact.**

```sql
-- Exécuter dans le SQL Editor Supabase
SELECT backfill_parcel_matches(
  p_dry_run := TRUE,     -- Mode simulation
  p_batch_size := 100    -- 100 items par batch
);
```

**Résultat attendu:**
```json
{
  "success": true,
  "dry_run": true,
  "duration_seconds": 5,
  "total_parcels": 150,
  "total_trips": 200,
  "matches_created": 4500,  // Estimation
  "matches_skipped": 25500,
  "errors": 0,
  "batch_size": 100
}
```

**Analyser le résultat:**
- ✅ `success: true` → Tout est OK
- ⚠️ `errors > 0` → Vérifier les logs pour identifier les problèmes
- 📊 `matches_created` → Nombre estimé de matches qui seront créés

---

### Étape 2: Backup (Recommandé)

**Créer une sauvegarde avant le backfill:**

```sql
-- Créer une table de backup
CREATE TABLE parcel_matches_backup_20241126 AS 
SELECT * FROM parcel_matches;

-- Vérifier le backup
SELECT COUNT(*) FROM parcel_matches_backup_20241126;
```

---

### Étape 3: Exécution Production

**Une fois le dry run validé, exécuter en mode production:**

```sql
-- ⚠️ Ceci va créer réellement les matches dans la base de données
SELECT backfill_parcel_matches(
  p_dry_run := FALSE,    -- Mode production
  p_batch_size := 100    -- Ajuster si nécessaire
);
```

**Suivi en temps réel:**
Le script affiche la progression dans les logs:
```
╔════════════════════════════════════════════════════════════════╗
║  BACKFILL PARCEL MATCHES - DÉMARRAGE                          ║
╚════════════════════════════════════════════════════════════════╝

⚙️  Mode: PRODUCTION
📦 Batch size: 100
🕐 Heure de démarrage: 2024-11-26 10:00:00

📊 Statistiques:
   • Colis actifs: 150
   • Trajets actifs: 200
   • Nombre de batchs: 2
   • Matches max possibles: 30000

🚀 Début du traitement par batch...

📦 Batch 1/2 - Processing parcel abc123... (from: Paris, to: Cotonou)
   ⭐ Excellent match trouvé: score=95 (parcel abc123 → trip def456)
📦 Batch 2/2 - Processing parcel xyz789... (from: Lyon, to: Dakar)

╔════════════════════════════════════════════════════════════════╗
║  BACKFILL TERMINÉ                                              ║
╚════════════════════════════════════════════════════════════════╝

📊 Résumé:
   • Matches créés: 4500
   • Matches ignorés: 25500
   • Erreurs: 0
   • Durée: 8 secondes
```

---

### Étape 4: Validation

**Exécuter la validation automatique:**

```sql
SELECT validate_backfill_results();
```

**Résultat attendu:**
```json
{
  "total_matches": 4500,
  "duplicates": 0,           // DOIT être 0
  "invalid_scores": 0,       // DOIT être 0
  "invalid_status": 0,       // DOIT être 0
  "orphan_parcels": 0,       // DOIT être 0
  "orphan_trips": 0,         // DOIT être 0
  "is_valid": true           // DOIT être true
}
```

**Validation manuelle supplémentaire:**

```sql
-- Voir le fichier scripts/validate-backfill.sql pour plus de requêtes

-- 1. Distribution des scores
SELECT 
  CASE 
    WHEN match_score >= 90 THEN '⭐ Excellent (90-100%)'
    WHEN match_score >= 70 THEN '🔵 Bon (70-89%)'
    WHEN match_score >= 50 THEN '🟡 Acceptable (50-69%)'
  END as score_range,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM parcel_matches), 2) as percentage
FROM parcel_matches
GROUP BY score_range
ORDER BY MIN(match_score) DESC;

-- 2. Top 10 meilleurs matches
SELECT 
  pm.match_score,
  p.from_city || ' → ' || p.to_city as parcel_route,
  t.from_city || ' → ' || t.to_city as trip_route,
  p.weight_kg || 'kg' as weight,
  t.date_departure
FROM parcel_matches pm
JOIN parcels p ON p.id = pm.parcel_id
JOIN trips t ON t.id = pm.trip_id
ORDER BY pm.match_score DESC
LIMIT 10;
```

---

## ✅ Checklist de Validation

Cocher chaque élément avant de considérer le backfill comme réussi:

- [ ] **Dry run exécuté** avec succès (errors = 0)
- [ ] **Backup créé** (si applicable)
- [ ] **Production exécutée** sans erreurs
- [ ] **Validation automatique** retourne `is_valid: true`
- [ ] **Aucun doublon** détecté
- [ ] **Tous les scores** sont entre 50 et 100
- [ ] **Aucun orphelin** (références vers colis/trajets inexistants)
- [ ] **Distribution des scores** cohérente (majoritairement 50-89%)
- [ ] **Top matches** vérifiés manuellement (routes logiques)
- [ ] **Temps d'exécution** raisonnable (< estimation)

---

## 🔥 Problèmes Courants & Solutions

### Problème 1: Timeout pendant l'exécution

**Symptômes:**
```
ERROR: timeout exceeded
```

**Solutions:**
1. Réduire le `batch_size`:
   ```sql
   SELECT backfill_parcel_matches(FALSE, 50);  -- Au lieu de 100
   ```

2. Exécuter par tranches (colis récents d'abord):
   ```sql
   -- Créer une fonction pour traiter uniquement les N derniers colis
   CREATE FUNCTION backfill_recent_parcels(p_limit INTEGER)
   RETURNS JSON AS $$
   BEGIN
     -- Logique similaire mais avec LIMIT sur la boucle
   END;
   $$ LANGUAGE plpgsql;
   ```

---

### Problème 2: Erreurs durant le traitement

**Symptômes:**
```
📊 Résumé:
   • Erreurs: 25
```

**Solutions:**
1. Consulter les logs détaillés:
   ```sql
   -- Les erreurs sont affichées dans les NOTICE
   -- Chercher les lignes commençant par "❌ Erreur"
   ```

2. Identifier les colis/trajets problématiques:
   ```sql
   -- Vérifier les colis avec données incomplètes
   SELECT id, from_country, to_country, from_city, to_city
   FROM parcels
   WHERE status = 'active'
     AND (from_country IS NULL OR to_country IS NULL);
   ```

3. Corriger les données et relancer

---

### Problème 3: Doublons détectés

**Symptômes:**
```json
{
  "duplicates": 150
}
```

**Solutions:**
```sql
-- Supprimer les doublons (garder le plus ancien)
DELETE FROM parcel_matches
WHERE id NOT IN (
  SELECT DISTINCT ON (parcel_id, trip_id) id
  FROM parcel_matches
  ORDER BY parcel_id, trip_id, created_at
);

-- Re-valider
SELECT validate_backfill_results();
```

---

### Problème 4: Scores invalides

**Symptômes:**
```json
{
  "invalid_scores": 45
}
```

**Solutions:**
```sql
-- Identifier les scores invalides
SELECT id, match_score, parcel_id, trip_id
FROM parcel_matches
WHERE match_score < 50 OR match_score > 100;

-- Recalculer les scores
UPDATE parcel_matches pm
SET match_score = calculate_match_score(pm.parcel_id, pm.trip_id)
WHERE match_score < 50 OR match_score > 100;

-- Supprimer ceux qui restent < 50
DELETE FROM parcel_matches WHERE match_score < 50;
```

---

## 🔄 Plan de Rollback

### Rollback Complet (Annuler tout)

**Si le backfill a échoué ou produit des résultats incorrects:**

```sql
-- Option 1: Utiliser la fonction de rollback
SELECT remove_all_backfilled_matches();

-- Option 2: Restaurer depuis le backup
TRUNCATE parcel_matches;
INSERT INTO parcel_matches SELECT * FROM parcel_matches_backup_20241126;

-- Vérifier
SELECT COUNT(*) FROM parcel_matches;
```

### Rollback Partiel (Annuler les récents uniquement)

**Si vous voulez garder les anciens matches:**

```sql
-- Supprimer les matches créés dans la dernière heure
DELETE FROM parcel_matches 
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Ou supprimer ceux créés après une date spécifique
DELETE FROM parcel_matches 
WHERE created_at > '2024-11-26 10:00:00';
```

**Voir le fichier `scripts/rollback-backfill.sql` pour plus d'options.**

---

## 📊 Monitoring Post-Backfill

### Métriques à Surveiller

**Dashboard Supabase > Database > Performance**
- Temps de réponse des requêtes sur `parcel_matches`
- Utilisation du stockage (table + index)
- Nombre de scans séquentiels (doit être bas)

**Requêtes de monitoring:**

```sql
-- Croissance de la table
SELECT 
  pg_size_pretty(pg_total_relation_size('parcel_matches')) as total_size,
  pg_size_pretty(pg_relation_size('parcel_matches')) as table_size,
  pg_size_pretty(pg_indexes_size('parcel_matches')) as indexes_size;

-- Performance des index
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'parcel_matches'
ORDER BY idx_scan DESC;

-- Requêtes lentes
SELECT 
  query,
  mean_exec_time::INTEGER as avg_ms,
  calls
FROM pg_stat_statements
WHERE query LIKE '%parcel_matches%'
ORDER BY mean_exec_time DESC
LIMIT 5;
```

---

## 🎓 FAQ

### Q1: Dois-je exécuter le backfill pour chaque nouvel utilisateur?

**Non.** Le backfill est une opération **unique** pour matcher les données existantes. Les nouveaux colis/trajets seront automatiquement matchés par les triggers.

---

### Q2: Combien de temps les matches restent-ils valides?

Les matches expirent automatiquement si:
- La date de départ du trajet est passée
- La deadline du colis est dépassée

Utiliser la fonction `cleanup_expired_matches()` régulièrement (via cron job).

---

### Q3: Que se passe-t-il si j'exécute le backfill deux fois?

**Rien de grave.** La migration est **idempotente** grâce à la contrainte `UNIQUE(parcel_id, trip_id)`. Les doublons sont automatiquement ignorés.

---

### Q4: Puis-je annuler le backfill après exécution?

**Oui**, via la fonction de rollback:
```sql
SELECT remove_all_backfilled_matches();
```

Ou restaurer depuis le backup si créé.

---

### Q5: Le backfill envoie-t-il des notifications aux utilisateurs?

**Non.** Pour éviter de spammer les utilisateurs avec des centaines de notifications, le backfill **ne déclenche PAS** le trigger `notify_on_new_match`. Seuls les **nouveaux** matches (après le backfill) génèrent des notifications.

---

## 📞 Support

**En cas de problème:**
- 📖 Consulter ce guide
- 🔍 Vérifier `scripts/validate-backfill.sql`
- 🔄 Utiliser `scripts/rollback-backfill.sql` si nécessaire
- 💬 Contacter l'équipe technique

**Logs Supabase:**
Dashboard > Database > Logs > Postgres Logs

---

## ✅ Résumé de la Procédure

1. ✅ Vérifier les pré-requis (tables, triggers, données)
2. ✅ Exécuter un **dry run** pour estimation
3. ✅ Créer un **backup** (recommandé)
4. ✅ Exécuter en **production**
5. ✅ **Valider** les résultats (automatique + manuel)
6. ✅ Vérifier la **checklist de validation**
7. ✅ Configurer le **monitoring**
8. ✅ (Optionnel) Configurer un **cron job** de nettoyage

**Temps total estimé:** 10-30 minutes (selon la taille des données)

---

**Bon backfill ! 🚀**
