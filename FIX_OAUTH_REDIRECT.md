# 🔴 PROBLÈME: Redirection vers localhost:3000 en production

## Le problème

Quand vous vous connectez avec Google en production sur Vercel, Supabase redirige vers `http://localhost:3000` au lieu de `https://kolimeet.vercel.app`.

## La cause

La configuration **Site URL** et **Redirect URLs** dans Supabase Dashboard pointe vers localhost.

## ✅ SOLUTION IMMÉDIATE

### Étape 1 : Mettre à jour Site URL dans Supabase

1. Allez sur : https://supabase.com/dashboard/project/odzxqpaovgxcwqilildp/auth/url-configuration

2. Dans **Site URL**, remplacez par :
   ```
   https://kolimeet.vercel.app
   ```

3. Cliquez sur **Save**

### Étape 2 : Configurer les Redirect URLs

Toujours sur la même page, dans **Redirect URLs**, ajoutez :

```
http://localhost:8080/*
https://kolimeet.vercel.app/*
```

⚠️ **Important** : Le `*` à la fin est important pour autoriser tous les chemins.

### Étape 3 : Vérifier la configuration Google OAuth

Dans la même page, section **External OAuth Providers** → **Google** :

Assurez-vous que :
- ✅ Google Provider est activé
- ✅ Client ID est configuré
- ✅ Client Secret est configuré

---

## 🔧 Configuration détaillée

### Dans Supabase Dashboard

**URL directe** : https://supabase.com/dashboard/project/odzxqpaovgxcwqilildp/settings/auth

#### Configuration URL

| Paramètre | Valeur |
|-----------|--------|
| **Site URL** | `https://kolimeet.vercel.app` |
| **Redirect URLs** | `http://localhost:8080/*`<br>`https://kolimeet.vercel.app/*` |

#### Configuration avancée (optionnel)

Si vous voulez être plus strict, vous pouvez spécifier les chemins exacts :

```
http://localhost:8080/auth/callback
http://localhost:8080/
https://kolimeet.vercel.app/auth/callback
https://kolimeet.vercel.app/
```

---

## 🧪 Test après configuration

1. **Attendez 1-2 minutes** après avoir sauvegardé (propagation)

2. **Ouvrez un onglet privé** (pour éviter le cache)

3. **Allez sur** : https://kolimeet.vercel.app

4. **Cliquez sur "Se connecter avec Google"**

5. **Vérifiez** que vous êtes redirigé vers `https://kolimeet.vercel.app` et non `localhost:3000`

---

## 📋 Checklist de vérification

Dans Supabase Dashboard (https://supabase.com/dashboard/project/odzxqpaovgxcwqilildp/auth/url-configuration) :

- [ ] Site URL = `https://kolimeet.vercel.app`
- [ ] Redirect URLs contient `https://kolimeet.vercel.app/*`
- [ ] Redirect URLs contient `http://localhost:8080/*` (pour dev)
- [ ] Configuration sauvegardée
- [ ] Google Provider activé dans OAuth Providers

Dans Google Cloud Console (https://console.cloud.google.com/apis/credentials) :

- [ ] `https://odzxqpaovgxcwqilildp.supabase.co/auth/v1/callback` présent
- [ ] `https://kolimeet.vercel.app/auth/callback` présent
- [ ] `http://localhost:8080/auth/callback` présent
- [ ] Changements sauvegardés

Dans Vercel (https://vercel.com/dashboard) :

- [ ] Variable `VITE_OAUTH_REDIRECT_PROD=https://kolimeet.vercel.app/auth/callback`
- [ ] Application déployée avec les bonnes variables

---

## 🆘 Si le problème persiste

### Vérifiez les logs

Dans votre console navigateur (F12), lors de la connexion Google :

```javascript
// Recherchez les logs de redirect
console.log('🔐 Google OAuth - Redirect URL:', ...)
console.log('🔐 Environment:', ...)
```

### Forcez le mode production

Dans votre `.env.production` (créez-le si nécessaire) :

```env
VITE_OAUTH_REDIRECT_OVERRIDE=https://kolimeet.vercel.app/auth/callback
```

Puis redéployez sur Vercel.

### Vérifiez la variable d'environnement

Sur Vercel, vérifiez que la variable est bien définie pour **Production** :

1. Vercel Dashboard → Settings → Environment Variables
2. Trouvez `VITE_OAUTH_REDIRECT_PROD`
3. Assurez-vous que l'environnement **Production** est coché

---

## 🎯 Résumé rapide

**3 endroits à vérifier :**

1. **Supabase** : Site URL = `https://kolimeet.vercel.app`
2. **Google Cloud** : Redirect URI contient `https://kolimeet.vercel.app/auth/callback`
3. **Vercel** : Variable d'environnement correcte

**Action immédiate :**

Allez sur https://supabase.com/dashboard/project/odzxqpaovgxcwqilildp/auth/url-configuration

Et changez **Site URL** vers `https://kolimeet.vercel.app`

Cela devrait résoudre le problème instantanément ! 🚀
