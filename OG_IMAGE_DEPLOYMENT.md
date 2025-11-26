# 🎨 Guide de déploiement des Open Graph Images

## ✅ Implémentation terminée

Le système de génération d'images Open Graph dynamiques est maintenant configuré avec Vercel OG Image.

## 📁 Fichiers créés

### Routes API Vercel OG
- `/api/og/trip.tsx` - Génère des images pour les trajets
- `/api/og/parcel.tsx` - Génère des images pour les colis

### Mises à jour
- `src/lib/utils/ogImage.ts` - Fonctions utilisant les nouvelles routes API
- `src/pages/TripDetail.tsx` - Intégration avec pays (from_country, to_country)
- `src/pages/ParcelDetail.tsx` - Intégration avec récompense (reward)
- `.env` - Ajout de `VITE_APP_URL`
- `.env.example` - Documentation de la variable

## 🚀 Déploiement sur Vercel

### 1. Configurer la variable d'environnement

Dans votre dashboard Vercel :
1. Allez dans **Settings** > **Environment Variables**
2. Ajoutez : `VITE_APP_URL` = `https://votre-domaine.vercel.app`
3. Cochez **Production**, **Preview**, et **Development**

### 2. Déployer

```bash
# Commit et push
git add .
git commit -m "feat: Add Vercel OG Image for social sharing"
git push origin main

# Ou déployer directement
vercel --prod
```

### 3. Vérifier que les routes API fonctionnent

Testez directement dans votre navigateur après déploiement :

```
https://votre-domaine.vercel.app/api/og/trip?from=Paris&to=Cotonou&fromCountry=France&toCountry=Bénin&date=1 janvier 2026&capacity=20&price=5
```

Vous devriez voir une belle image 1200x630px avec :
- Gradient violet en fond
- Logo Kolimeet en haut à gauche
- Carte blanche avec les villes et détails du trajet
- Design identique à vos TripCard

```
https://votre-domaine.vercel.app/api/og/parcel?from=Paris&to=Dakar&fromCountry=France&toCountry=Sénégal&weight=10&type=Documents&deadline=15 déc 2025&reward=50
```

Vous devriez voir une image verte avec les détails du colis.

## 🧪 Tester le partage social

### Test local (avant déploiement)

Pour tester en local avec les vrais crawlers Facebook/Twitter, utilisez **ngrok** :

```bash
# Installer ngrok
brew install ngrok  # macOS
# ou télécharger depuis https://ngrok.com

# Exposer votre serveur local
ngrok http 8080

# Ngrok vous donnera une URL HTTPS publique
# Exemple: https://abc123.ngrok.io
```

Puis mettez à jour `.env` temporairement :
```bash
VITE_APP_URL="https://abc123.ngrok.io"
```

Redémarrez votre serveur et testez avec Facebook Debugger.

### Test en production

Une fois déployé sur Vercel :

1. **Facebook Sharing Debugger**
   - https://developers.facebook.com/tools/debug/
   - Entrez : `https://votre-domaine.vercel.app/trips/[id-reel]`
   - Cliquez sur **Scrape Again** si l'image ne s'affiche pas immédiatement

2. **Twitter Card Validator**
   - https://cards-dev.twitter.com/validator
   - Entrez l'URL d'un trajet ou colis

3. **LinkedIn Post Inspector**
   - https://www.linkedin.com/post-inspector/
   - Vérifiez l'aperçu

4. **WhatsApp**
   - Envoyez le lien à vous-même
   - L'aperçu apparaît automatiquement

## 🎨 Personnalisation des images

Les images générées utilisent :
- **Trajets** : Gradient violet (#667eea → #764ba2)
- **Colis** : Gradient vert (#10b981 → #059669)

Pour personnaliser, éditez :
- `/api/og/trip.tsx` - Design des trajets
- `/api/og/parcel.tsx` - Design des colis

Vous pouvez modifier :
- Les couleurs du gradient
- La taille des polices
- Les emojis
- La disposition des éléments
- Le CTA (Call-to-Action)

## 📊 Format des images

Les images générées respectent :
- **Dimensions** : 1200x630px (ratio 1.91:1)
- **Format** : PNG
- **Taille** : ~100-200 KB
- **Compatible** : Facebook, Twitter, WhatsApp, LinkedIn, Telegram

## 🐛 Debugging

### L'image ne s'affiche pas

1. **Vérifiez que l'API fonctionne**
   ```bash
   curl -I https://votre-domaine.vercel.app/api/og/trip?from=Paris&to=Cotonou
   ```
   Devrait retourner `200 OK` avec `Content-Type: image/png`

2. **Inspectez les meta tags**
   - Ouvrez un trajet dans votre navigateur
   - Clic droit > "Afficher le code source de la page"
   - Cherchez `<meta property="og:image"`
   - L'URL doit pointer vers `/api/og/trip?...`

3. **Vérifiez les logs Vercel**
   - Dashboard Vercel > Deployments > Cliquez sur le dernier déploiement
   - Allez dans **Functions** > `/api/og/trip`
   - Regardez les logs pour les erreurs

### L'image est cassée ou affiche une erreur

1. **Vérifiez les paramètres**
   - Les villes contiennent-elles des caractères spéciaux ?
   - Les dates sont-elles au bon format ?

2. **Testez avec des valeurs par défaut**
   ```
   https://votre-domaine.vercel.app/api/og/trip
   ```
   (sans paramètres, utilise les valeurs par défaut)

### Facebook ne met pas à jour l'image

Facebook met en cache les Open Graph images pendant **plusieurs jours**.

**Solutions** :
1. Utilisez le Facebook Debugger : https://developers.facebook.com/tools/debug/
2. Cliquez sur **Scrape Again** pour forcer le rafraîchissement
3. Ajoutez un paramètre `?v=2` à l'URL pour contourner le cache

## 📈 Métriques de partage

Pour tracker les partages, vous pouvez :

1. **Ajouter UTM parameters**
   ```typescript
   const shareUrl = `${window.location.href}?utm_source=social&utm_medium=share&utm_campaign=og_image`;
   ```

2. **Analytics dans Vercel**
   - Dashboard Vercel > Analytics
   - Suivez les requêtes vers `/api/og/trip` et `/api/og/parcel`

3. **Supabase Analytics**
   - Créez une table `share_events`
   - Loggez chaque clic sur ShareButton

## 🎉 Résultat attendu

Quand vous partagez un lien sur :

### Facebook
![Image de prévisualisation avec design complet du trajet/colis]

### WhatsApp
![Aperçu automatique avec image et détails]

### Twitter
![Twitter Card avec large image]

### Stories Instagram/Facebook
![Image partageable optimisée pour mobile]

## 🔧 Configuration avancée

### Ajouter une photo du voyageur

Pour inclure l'avatar du voyageur dans l'image OG :

1. Modifiez `/api/og/trip.tsx`
2. Récupérez l'avatar URL depuis les paramètres
3. Utilisez une balise `<img>` dans le JSX

**Note** : Les images externes doivent être HTTPS et accessibles publiquement.

### Générer des images pour d'autres pages

Créez de nouvelles routes :
- `/api/og/profile.tsx` - Profil utilisateur
- `/api/og/home.tsx` - Page d'accueil
- `/api/og/explorer.tsx` - Page explorer

## 📚 Ressources

- [Vercel OG Image Documentation](https://vercel.com/docs/concepts/functions/edge-functions/og-image-generation)
- [Open Graph Protocol](https://ogp.me/)
- [Facebook Sharing Best Practices](https://developers.facebook.com/docs/sharing/webmasters)
- [Twitter Cards Guide](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)

## ✅ Checklist de déploiement

- [x] Routes API créées (`/api/og/trip.tsx`, `/api/og/parcel.tsx`)
- [x] `ogImage.ts` mis à jour pour utiliser les routes API
- [x] TripDetail.tsx et ParcelDetail.tsx mis à jour
- [x] Variable `VITE_APP_URL` ajoutée dans `.env`
- [ ] Variable `VITE_APP_URL` configurée dans Vercel
- [ ] Déploiement sur Vercel (`vercel --prod`)
- [ ] Test de l'API : `/api/og/trip?from=Paris&to=Cotonou`
- [ ] Test Facebook Debugger
- [ ] Test Twitter Card Validator
- [ ] Test partage WhatsApp
- [ ] Vérification des meta tags dans le code source

Tout est prêt ! Il ne reste plus qu'à déployer sur Vercel. 🚀
