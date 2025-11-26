# Déploiement Kolimeet sur Vercel

## 🚀 Guide de Déploiement Complet

### Prérequis

- Compte Vercel (gratuit) : https://vercel.com
- Compte GitHub avec le repo kolimeet
- Projet Supabase configuré : `odzxqpaovgxcwqilildp`

---

## 📋 Étape 1 : Préparer le projet

### 1.1 Vérifier les fichiers de configuration

✅ **vercel.json** - Déjà créé
✅ **package.json** - Scripts de build déjà configurés
✅ **.env.example** - Template des variables d'environnement

### 1.2 Commit et push vers GitHub

```bash
git add .
git commit -m "feat: configuration pour déploiement Vercel"
git push origin main
```

---

## 🌐 Étape 2 : Déployer sur Vercel

### 2.1 Créer le projet sur Vercel

1. Allez sur https://vercel.com/new
2. Cliquez sur **Import Git Repository**
3. Sélectionnez **GitHub** et autorisez Vercel
4. Trouvez et sélectionnez le repo **kolimeet**
5. Cliquez sur **Import**

### 2.2 Configuration du projet

**Framework Preset** : Vite
**Root Directory** : `./` (laisser par défaut)
**Build Command** : `bun run build` (ou `npm run build`)
**Output Directory** : `dist`
**Install Command** : `bun install` (ou `npm install`)

### 2.3 Variables d'environnement

Cliquez sur **Environment Variables** et ajoutez :

```env
VITE_SUPABASE_PROJECT_ID=odzxqpaovgxcwqilildp
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kenhxcGFvdmd4Y3dxaWxpbGRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTk0NjEsImV4cCI6MjA3OTQ3NTQ2MX0.0s2X8KdH6OicCa-OjcGVbloXgmzS7aNrpcfgXHtKJeI
VITE_SUPABASE_URL=https://odzxqpaovgxcwqilildp.supabase.co

VITE_OAUTH_REDIRECT_DEV=http://localhost:8080/auth/callback
VITE_OAUTH_REDIRECT_PROD=https://your-project.vercel.app/auth/callback
VITE_OAUTH_REDIRECT_OVERRIDE=
```

⚠️ **Important** : Vous mettrez à jour `VITE_OAUTH_REDIRECT_PROD` avec votre vraie URL Vercel après le premier déploiement.

### 2.4 Déployer

Cliquez sur **Deploy** et attendez ~2-3 minutes.

---

## 🔗 Étape 3 : Récupérer l'URL de production

Une fois déployé, Vercel vous donnera une URL comme :
```
https://kolimeet-xyz123.vercel.app
```

Ou si vous configurez un domaine custom :
```
https://kolimeet.com
```

---

## 🔄 Étape 4 : Mettre à jour les OAuth Redirect URLs

### 4.1 Mettre à jour Vercel Environment Variables

1. Dans Vercel Dashboard → Settings → Environment Variables
2. Modifiez `VITE_OAUTH_REDIRECT_PROD` :
   ```
   https://kolimeet-xyz123.vercel.app/auth/callback
   ```
3. Redéployez : Deployments → ⋯ → Redeploy

### 4.2 Mettre à jour Google Cloud Console

Allez sur https://console.cloud.google.com/apis/credentials

Dans **Authorized redirect URIs**, ajoutez/mettez à jour :

```
1. https://odzxqpaovgxcwqilildp.supabase.co/auth/v1/callback
2. http://localhost:8080/auth/callback
3. https://kolimeet-xyz123.vercel.app/auth/callback  ← NOUVELLE URL
```

### 4.3 Mettre à jour votre .env local

```bash
# Mettez à jour .env
VITE_OAUTH_REDIRECT_PROD="https://kolimeet-xyz123.vercel.app/auth/callback"

# Commit
git add .env
git commit -m "chore: update Vercel production URL"
git push
```

---

## 🎯 Étape 5 : Configuration du domaine custom (optionnel)

### 5.1 Ajouter un domaine

1. Dans Vercel Dashboard → Settings → Domains
2. Cliquez sur **Add**
3. Entrez votre domaine : `kolimeet.com`
4. Suivez les instructions DNS

### 5.2 Mettre à jour les OAuth URLs avec le domaine custom

Répétez l'étape 4 en remplaçant l'URL Vercel par votre domaine custom.

---

## ✅ Étape 6 : Vérification

### 6.1 Tests fonctionnels

- [ ] L'application se charge correctement
- [ ] Connexion/inscription fonctionne
- [ ] Google OAuth fonctionne
- [ ] Messages en temps réel fonctionnent
- [ ] Création de trajets/colis fonctionne
- [ ] Upload d'images fonctionne

### 6.2 Vérifier les variables d'environnement

Dans le navigateur, ouvrez la console (F12) et tapez :
```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
```

Vous devriez voir : `https://odzxqpaovgxcwqilildp.supabase.co`

---

## 🔧 Étape 7 : Configuration avancée

### 7.1 Déploiement continu (CI/CD)

Vercel déploie automatiquement :
- **Production** : Push sur `main` → https://kolimeet.vercel.app
- **Preview** : Pull requests → URLs temporaires

### 7.2 Variables d'environnement par branche

Production :
```env
VITE_OAUTH_REDIRECT_PROD=https://kolimeet.vercel.app/auth/callback
```

Preview (optionnel) :
```env
VITE_OAUTH_REDIRECT_PROD=https://kolimeet-git-${VERCEL_GIT_COMMIT_REF}.vercel.app/auth/callback
```

### 7.3 Headers de sécurité

Créez `vercel.json` avec :

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

---

## 📊 Monitoring et Analytics

### 7.4 Vercel Analytics

1. Dashboard → Analytics
2. Activez Web Analytics (gratuit)
3. Visualisez les performances en temps réel

### 7.5 Logs et Erreurs

- Dashboard → Deployments → Cliquez sur un déploiement
- Onglet **Build Logs** pour voir les logs de build
- Onglet **Runtime Logs** pour voir les erreurs en production

---

## 🚨 Troubleshooting

### Erreur de build

```bash
# Tester le build localement
bun run build

# Vérifier les erreurs TypeScript
bun run type-check
```

### Variables d'environnement manquantes

Dans Vercel Dashboard → Settings → Environment Variables
Vérifiez que toutes les variables sont présentes.

### OAuth ne fonctionne pas

1. Vérifiez l'URL dans Google Cloud Console
2. Attendez 5-10 minutes après modification
3. Vérifiez les variables Vercel
4. Redéployez

---

## 📝 Checklist Finale

### Configuration Vercel
- [ ] Projet importé depuis GitHub
- [ ] Variables d'environnement configurées
- [ ] Premier déploiement réussi
- [ ] URL de production récupérée

### Configuration OAuth
- [ ] URL Vercel ajoutée dans Google Cloud Console
- [ ] `VITE_OAUTH_REDIRECT_PROD` mise à jour
- [ ] Redéploiement effectué
- [ ] Test de connexion Google réussi

### Configuration Supabase
- [ ] Google Provider activé
- [ ] Client ID/Secret configurés
- [ ] Edge Functions déployées
- [ ] Secrets configurés

### Tests
- [ ] Application accessible en production
- [ ] Toutes les fonctionnalités testées
- [ ] Performance vérifiée (Lighthouse)
- [ ] SEO vérifié

---

## 🔗 Ressources

- **Dashboard Vercel** : https://vercel.com/dashboard
- **Documentation Vercel** : https://vercel.com/docs
- **Dashboard Supabase** : https://supabase.com/dashboard/project/odzxqpaovgxcwqilildp
- **Google Cloud Console** : https://console.cloud.google.com/apis/credentials

---

## 📞 Support

- **Vercel Support** : https://vercel.com/support
- **Vercel Community** : https://github.com/vercel/vercel/discussions
- **Supabase Discord** : https://discord.supabase.com

---

## 🎉 Prochaines étapes

Une fois le déploiement réussi :

1. **Domaine custom** : Configurez votre propre domaine
2. **Analytics** : Activez Vercel Analytics
3. **Monitoring** : Configurez Sentry ou similaire
4. **SEO** : Ajoutez meta tags et sitemap
5. **Performance** : Optimisez les images et le code

**Votre application est maintenant en production sur Vercel ! 🚀**
