# Système de Messagerie Temps Réel - Améliorations

## 🎯 Objectifs Atteints

### 1. ✅ Messages en Temps Réel
- Les messages sont synchronisés instantanément via Supabase Realtime
- Subscription active sur la table `messages` pour les événements INSERT, UPDATE, DELETE
- Les nouveaux messages apparaissent immédiatement sans rafraîchissement

### 2. ✅ Notifications de Messages Non Lus
- **Pastille rouge avec compteur** affichée sur l'icône Messagerie
- Visible dans :
  - Navigation desktop (lien "Messagerie")
  - Dropdown menu (mobile/desktop)
  - Menu mobile
- Le compteur s'anime avec `animate-pulse` pour attirer l'attention
- Affiche "9+" si plus de 9 messages non lus

### 3. ✅ Suppression Automatique de la Pastille
- La pastille disparaît automatiquement quand les messages sont lus
- Utilisation de `read_at` (timestamp) au lieu de `is_read` (boolean)
- Mise à jour en temps réel du compteur

## 🔧 Composants Modifiés

### Nouveaux Fichiers

#### `/src/hooks/useUnreadCount.ts`
Hook personnalisé pour gérer le compteur global de messages non lus.

**Fonctionnalités :**
- Compte tous les messages non lus (où `read_at IS NULL`)
- S'abonne aux changements en temps réel
- Incrémente le compteur quand un nouveau message arrive
- Décrémente le compteur quand un message est marqué comme lu

**Code clé :**
```typescript
const { count } = await supabase
  .from("messages")
  .select("*", { count: "exact", head: true })
  .is("read_at", null)
  .neq("sender_id", user.id);
```

#### `/supabase/migrations/20251124000000_update_thread_last_message.sql`
Migration pour mettre à jour automatiquement `last_message_at` sur les threads.

**Fonctionnalités :**
- Trigger SQL qui s'exécute après chaque INSERT dans `messages`
- Met à jour `last_message_at` du thread correspondant
- Garantit que la liste des conversations est toujours triée correctement
- Mise à jour des threads existants avec les dates correctes

**Trigger :**
```sql
CREATE TRIGGER trigger_update_thread_last_message_at
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION update_thread_last_message_at();
```

### Fichiers Modifiés

#### `/src/hooks/useMessages.ts`
- Amélioration du marquage automatique des messages comme lus
- Utilise la fonction SQL `mark_message_as_read`
- Met à jour l'état local avec `read_at` après marquage
- Meilleure gestion des subscriptions Realtime

**Changements :**
```typescript
// Avant
.eq("is_read", false)

// Après
.is("read_at", null)
```

#### `/src/hooks/useThreads.ts`
- Mise à jour pour utiliser `read_at` au lieu de `is_read`
- **Amélioration majeure des subscriptions Realtime**
- Canal unique par utilisateur : `threads-updates-${user.id}`
- Vérification de propriété des threads avant refetch
- Vérification de propriété des messages avant refetch
- Logs détaillés pour debugging
- **Résout le problème de liste non actualisée en temps réel**

**Améliorations clés :**
```typescript
// Vérification que le message appartient à un thread de l'utilisateur
const { data: threadData } = await supabase
  .from("threads")
  .select("id, created_by, other_user_id")
  .eq("id", newMessage.thread_id)
  .single();

if (threadData && (threadData.created_by === user.id || threadData.other_user_id === user.id)) {
  fetchThreads(); // Rafraîchir la liste
}
```

#### `/src/components/layout/Navigation.tsx`
- Import et utilisation de `useUnreadCount`
- Ajout de la pastille de notification sur le lien "Messagerie"
- Pastille avec position absolue et animation pulse
- Badge dans le dropdown menu

**Code de la pastille :**
```tsx
{unreadCount > 0 && (
  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
    {unreadCount > 9 ? '9+' : unreadCount}
  </span>
)}
```

#### `/src/components/layout/MobileMenu.tsx`
- Import et utilisation de `useUnreadCount`
- Ajout de la pastille sur le lien Messagerie mobile
- Badge inline avec le texte

## 📊 Flux de Données

### 1. Réception d'un Nouveau Message

```
Utilisateur A envoie message
    ↓
Supabase INSERT dans table messages
    ↓
Trigger SQL → UPDATE threads.last_message_at
    ↓
Realtime events déclenchés (INSERT messages + UPDATE threads)
    ↓
useMessages (Utilisateur B) → Ajoute message à la liste
    ↓
useThreads (Utilisateur B) → Vérifie propriété du thread → Refetch liste
    ↓
Liste des conversations mise à jour en temps réel
    ↓
mark_message_as_read appelée automatiquement
    ↓
Supabase UPDATE messages SET read_at = NOW()
    ↓
Realtime event UPDATE déclenché
    ↓
useUnreadCount → Décrémente compteur
useThreads → Refetch pour mise à jour des compteurs
```

### 2. Ouverture d'une Conversation

```
Utilisateur clique sur conversation
    ↓
MessageThread se charge
    ↓
useMessages.fetchMessages()
    ↓
mark_thread_messages_as_read() appelée
    ↓
Tous les messages non lus marqués avec read_at
    ↓
Realtime UPDATE events déclenchés
    ↓
useUnreadCount détecte les UPDATEs → Compteur décrémenté
useThreads détecte les UPDATEs → Liste mise à jour
    ↓
Pastille disparaît si compteur = 0
    ↓
Liste des conversations re-triée (si nécessaire)
```

### 3. Tri Automatique de la Liste

```
Nouveau message inséré
    ↓
Trigger update_thread_last_message_at
    ↓
UPDATE threads SET last_message_at = message.created_at
    ↓
Realtime UPDATE event sur table threads
    ↓
useThreads détecte l'event → Refetch
    ↓
Requête avec ORDER BY last_message_at DESC
    ↓
Liste automatiquement triée avec conversation récente en haut
```

## 🗄️ Base de Données

### Colonne `read_at`
- Type: `TIMESTAMPTZ`
- Nullable: `true`
- NULL = message non lu
- Timestamp = message lu à cette date/heure

### Fonction SQL: `mark_message_as_read`
```sql
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
```

### Fonction SQL: `mark_thread_messages_as_read`
```sql
CREATE OR REPLACE FUNCTION mark_thread_messages_as_read(
  p_thread_id UUID, 
  p_user_id UUID
)
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
```

## 🎨 Design de la Pastille

### Couleurs
- Fond: `bg-red-500`
- Texte: `text-white`
- Animation: `animate-pulse` (Tailwind)

### Tailles
- Desktop (lien): `h-5 w-5` avec position absolute
- Dropdown: `h-5 w-5` avec `ml-auto`
- Mobile: `h-5 w-5` inline

### Position
- Desktop: `absolute -top-2 -right-2`
- Dropdown/Mobile: `ml-auto` pour pousser à droite

## 🚀 Performance

### Optimisations
1. **Index sur `read_at`** : Requêtes de comptage ultra-rapides
2. **Batch queries** : useThreads récupère tous les compteurs en une fois
3. **Realtime ciblé** : Subscriptions filtrées par thread_id
4. **État local** : Évite les refetch inutiles

### Charge Réseau
- Subscription Realtime : ~1-2 KB/message
- Compteur initial : Query SQL simple (<1 KB)
- Updates : Seulement quand statut change

## 🧪 Tests Recommandés

### Scénarios à Tester

1. **Nouveau message**
   - [ ] Pastille apparaît immédiatement
   - [ ] Compteur s'incrémente
   - [ ] Animation pulse active

2. **Lecture de message**
   - [ ] Ouverture de conversation marque les messages
   - [ ] Compteur décrémente
   - [ ] Pastille disparaît si compteur = 0

3. **Multiples conversations**
   - [ ] Compteur agrège tous les messages non lus
   - [ ] Lecture d'une conversation ne touche pas les autres

4. **Temps réel**
   - [ ] Nouveaux messages apparaissent sans refresh
   - [ ] Compteur se met à jour en live
   - [ ] Fonctionne sur plusieurs onglets

5. **Connexion/Déconnexion**
   - [ ] Pastille n'apparaît pas si non connecté
   - [ ] Reset du compteur à la déconnexion

## 📝 Notes Importantes

### Migration Required
La migration `20251123000000_realtime_messaging_features.sql` doit être appliquée pour que tout fonctionne :
- Ajoute les colonnes `read_at` et `delivered_at`
- Crée les fonctions SQL nécessaires
- Ajoute les index d'optimisation

### Compatibilité
- ✅ Mobile-first design
- ✅ Desktop responsive
- ✅ Dark mode compatible
- ✅ Accessibilité (aria-labels possibles)

### Limitations Connues
- Maximum affiché : "9+" (évite les badges trop larges)
- Realtime nécessite connexion WebSocket active
- Compteur global (pas par conversation dans le badge)

## 🔮 Améliorations Futures Possibles

1. **Notifications Push** (PWA)
   - Service Worker pour notifications
   - Badge sur l'icône de l'app

2. **Son de notification**
   - Audio feedback sur nouveau message
   - Paramètre pour désactiver

3. **Compteur par conversation**
   - Badge sur chaque ThreadCard
   - Déjà disponible via `unread_count` dans useThreads

4. **Indicateur "En train d'écrire"**
   - Déjà implémenté via useTypingStatus
   - Peut être amélioré visuellement

5. **Statistiques de lecture**
   - Heure de lecture affichée
   - "Vu à XX:XX" comme WhatsApp
