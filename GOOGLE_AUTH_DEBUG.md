# 🔧 Configuration OAuth Google - Vérification

## ✅ Modifications Appliquées

1. **Page de callback améliorée** (`src/pages/auth/Callback.tsx`)
   - Attente correcte de l'échange de tokens
   - Gestion d'erreurs améliorée
   - Logs de débogage
   - Messages toast pour l'utilisateur

2. **Hook useAuth amélioré** (`src/hooks/useAuth.ts`)
   - Logs de débogage pour l'URL de redirection
   - Paramètres OAuth supplémentaires

## 🔍 À Vérifier dans Supabase Dashboard

Pour que l'authentification Google fonctionne, vous devez vérifier dans votre Supabase Dashboard :

### 1. URL de Redirection Autorisée

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet **Kolimeet**
3. Allez dans **Authentication** > **URL Configuration**
4. Dans **Redirect URLs**, vérifiez que ces URLs sont présentes :
   ```
   http://localhost:5173/auth/callback
   http://localhost:5173/*
   ```
   
   Si votre app est déployée, ajoutez aussi :
   ```
   https://votre-domaine.com/auth/callback
   https://votre-domaine.com/*
   ```

### 2. Provider Google Activé

1. Dans **Authentication** > **Providers**
2. Vérifiez que **Google** est **activé** (toggle vert)
3. Vérifiez que vous avez configuré :
   - Client ID
   - Client Secret

### 3. Site URL

1. Dans **Authentication** > **URL Configuration**
2. Vérifiez que le **Site URL** est :
   ```
   http://localhost:5173
   ```
   (ou votre domaine en production)

## 🧪 Test de Connexion

1. **Ouvrez la console du navigateur** (F12)
2. Allez sur `/auth/login`
3. Cliquez sur "Continuer avec Google"
4. **Surveillez les logs** dans la console :
   - "Google OAuth redirect URL: http://localhost:5173/auth/callback"
   - Après la redirection Google, vous devriez voir :
     - "User authenticated: email@example.com"
     - "Redirecting to onboarding" ou "Redirecting to home"

## ❌ Si ça ne fonctionne toujours pas

### Vérifiez dans la console :

**Erreur possible 1 : "redirect_uri_mismatch"**
- **Solution** : L'URL de redirection n'est pas autorisée dans Google Cloud Console
- Allez sur https://console.cloud.google.com
- Credentials > OAuth 2.0 Client IDs
- Ajoutez `http://localhost:5173/auth/callback` dans "Authorized redirect URIs"

**Erreur possible 2 : "Invalid redirect URL"**
- **Solution** : L'URL n'est pas dans les Redirect URLs de Supabase
- Ajoutez-la dans Supabase Dashboard > Authentication > URL Configuration

**Erreur possible 3 : "No session found"**
- **Solution** : Le cookie de session n'est pas créé
- Vérifiez que votre domaine n'a pas de problèmes de cookies tiers
- En développement local, utilisez `http://localhost` au lieu de `http://127.0.0.1`

## 📝 Logs à Partager

Si le problème persiste, partagez ces informations :

1. Les logs de la console lors du clic sur "Continuer avec Google"
2. Les logs après la redirection depuis Google
3. L'URL complète dans la barre d'adresse après la redirection
4. Les erreurs éventuelles dans l'onglet Network (Réseau) des DevTools

---

Après ces vérifications, l'authentification Google devrait fonctionner ! 🎉
