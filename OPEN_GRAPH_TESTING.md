# Guide de test des Open Graph et Twitter Cards

## 🎯 Objectif

Permettre aux utilisateurs de partager des trajets et colis sur les réseaux sociaux avec des prévisualisations riches (images + détails).

## ✅ Implémentation

### Composants créés

1. **`SEO.tsx`** - Composant pour les meta tags Open Graph et Twitter Cards
2. **`ogImage.ts`** - Utilitaires pour générer des images dynamiques
3. **`ShareButton.tsx`** - Bouton de partage social (déjà intégré)

### Intégrations

- ✅ TripDetail : Meta tags avec image dynamique du trajet
- ✅ ParcelDetail : Meta tags avec image dynamique du colis
- ✅ HelmetProvider configuré dans `main.tsx`

## 🧪 Tests recommandés

### 1. Test en local

Lancez l'application et inspectez le code source :

```bash
npm run dev
# Ouvrir http://localhost:5173/trips/[id]
# Clic droit > Afficher le code source de la page
# Vérifier la présence des balises <meta property="og:...">
```

Balises attendues :
```html
<meta property="og:title" content="Trajet Paris → Londres">
<meta property="og:description" content="20kg disponibles • 5€/kg • Départ le 15 janvier 2024">
<meta property="og:image" content="https://placehold.co/1200x630/...">
<meta property="og:url" content="http://localhost:5173/trips/xxx">
<meta name="twitter:card" content="summary_large_image">
```

### 2. Test Facebook

**Option A : Facebook Sharing Debugger**
1. Déployez votre site en production
2. Allez sur https://developers.facebook.com/tools/debug/
3. Entrez l'URL d'un trajet : `https://votresite.com/trips/[id]`
4. Cliquez sur "Déboguer" (Debug)
5. Vérifiez l'aperçu de la carte

**Option B : Partage réel**
1. Copiez le lien d'un trajet
2. Collez-le dans un post Facebook privé
3. Vérifiez l'aperçu généré

### 3. Test WhatsApp

1. Envoyez le lien à vous-même ou à un contact test
2. WhatsApp devrait afficher automatiquement l'image et le titre

### 4. Test Twitter

**Option A : Twitter Card Validator**
1. Allez sur https://cards-dev.twitter.com/validator
2. Entrez l'URL d'un trajet
3. Vérifiez l'aperçu

**Option B : Tweet réel**
1. Créez un tweet avec le lien
2. Vérifiez l'aperçu avant publication

## 🖼️ Amélioration des images

### Actuellement

Les images sont générées via **placehold.co** avec du texte simple :
- Avantage : Fonctionne immédiatement sans configuration
- Inconvénient : Apparence basique

### Options d'amélioration

#### Option 1 : Service externe (Vercel OG Image)

Déployez une Edge Function qui génère des images HTML → PNG :

```typescript
// pages/api/og.tsx
import { ImageResponse } from '@vercel/og';

export default function handler(req) {
  const { from, to, date, price } = req.query;
  
  return new ImageResponse(
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ fontSize: 72, color: 'white' }}>
        {from} → {to}
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}
```

#### Option 2 : Images statiques pré-générées

Créez des images avec Figma/Canva et uploadez-les :

```typescript
// Dans ogImage.ts
export function generateTripOGImage(params: TripOGParams): string {
  // Utiliser une image statique de haute qualité
  return '/og-trip-default.jpg';
}
```

#### Option 3 : Canvas côté serveur (Puppeteer)

Créez une API qui utilise les templates HTML fournis :

```typescript
// Utilise getTripOGTemplate() + Puppeteer pour capturer en PNG
```

## 📱 Test sur réseaux sociaux

### Facebook
- Format idéal : **1200x630px**
- Ratio : 1.91:1
- Taille max : 8 MB
- Formats : JPG, PNG, GIF

### Twitter
- Format idéal : **1200x628px**
- Ratio : 1.91:1
- Taille max : 5 MB
- Formats : JPG, PNG, WEBP, GIF

### WhatsApp
- Utilise les meta tags Open Graph
- Même format que Facebook

## 🚀 Déploiement

Avant de déployer en production :

1. **Vérifiez les URLs absolues** : Les images OG doivent être en HTTPS avec URL complète
2. **Testez avec ngrok** : Exposez votre local en HTTPS pour tester avec les validateurs
3. **Configurez CORS** : Si vos images sont sur un CDN, autorisez les bots sociaux

```bash
# Test avec ngrok
ngrok http 5173
# Utilisez l'URL HTTPS dans les validateurs
```

## 🔧 Debugging

### Les images ne s'affichent pas

1. **Vérifiez le code source** : Les balises meta sont-elles présentes ?
2. **Testez l'URL de l'image** : L'image est-elle accessible publiquement ?
3. **Rafraîchissez le cache** : Facebook met en cache, utilisez le debugger
4. **Vérifiez HTTPS** : Les réseaux sociaux exigent HTTPS en production

### Les modifications ne sont pas visibles

- Facebook cache pendant **plusieurs jours** → Utilisez le debugger pour forcer
- Twitter cache pendant **7 jours** → Utilisez le validator pour rafraîchir

## 📚 Ressources

- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards Guide](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [Vercel OG Image](https://vercel.com/docs/concepts/functions/edge-functions/og-image-generation)
