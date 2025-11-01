# Composants 3D pour la Landing Page

Cette documentation décrit les composants d'animation 3D utilisés sur la page d'accueil de Kolimeet.

## 📦 Composants disponibles

### 🎨 Composants de fond animé (non-interactifs)

### 1. FloatingShapes
**Fichier:** `src/components/3d/FloatingShapes.tsx`

Affiche des formes 3D géométriques flottantes (sphères, torus, cubes) qui tournent et bougent lentement.

**Technologies:**
- Three.js avec React Three Fiber
- @react-three/drei pour les helpers

**Couleurs utilisées:**
- Bleu primaire (#1F6FEB)
- Jaune accent (#F59E0B)
- Vert succès (#10B981)

**Props:** Aucune

**Utilisation:**
```tsx
import FloatingShapes from "@/components/3d/FloatingShapes";

<FloatingShapes />
```

### 2. ParticleField
**Fichier:** `src/components/3d/ParticleField.tsx`

Crée un champ de particules animées en 3D qui tournent lentement.

**Props:** Aucune

**Utilisation:**
```tsx
import ParticleField from "@/components/3d/ParticleField";

<ParticleField />
```

### 3. WaveBackground
**Fichier:** `src/components/3d/WaveBackground.tsx`

Génère des vagues 3D animées avec effet de distorsion.

**Props:** Aucune

**Utilisation:**
```tsx
import WaveBackground from "@/components/3d/WaveBackground";

<WaveBackground />
```

### 4. AnimatedGradient
**Fichier:** `src/components/3d/AnimatedGradient.tsx`

Crée des blobs de gradient colorés qui se déplacent lentement en arrière-plan.

**Props:** Aucune

**Utilisation:**
```tsx
import AnimatedGradient from "@/components/3d/AnimatedGradient";

<AnimatedGradient />
```

### 5. AnimatedRings
**Fichier:** `src/components/3d/AnimatedRings.tsx`

Affiche des cercles concentriques avec effet ping/pulse.

**Props:** Aucune

**Utilisation:**
```tsx
import AnimatedRings from "@/components/3d/AnimatedRings";

<AnimatedRings />
```

---

### 🎮 Composants interactifs (sensibles à la souris)

### 6. MouseFollower
**Fichier:** `src/components/3d/MouseFollower.tsx`

Sphère 3D métallique qui suit le curseur avec un effet de retard fluide.

**Props:** Aucune

**Utilisation:**
```tsx
import MouseFollower from "@/components/3d/MouseFollower";

<MouseFollower />
```

### 7. ParallaxShapes
**Fichier:** `src/components/3d/ParallaxShapes.tsx`

Formes colorées avec effet parallax multi-vitesses selon la position de la souris.

**Props:** Aucune

**Utilisation:**
```tsx
import ParallaxShapes from "@/components/3d/ParallaxShapes";

<ParallaxShapes />
```

### 8. InteractiveParticles
**Fichier:** `src/components/3d/InteractiveParticles.tsx`

2000 particules qui s'écartent quand la souris s'approche (effet de répulsion).

**Props:** Aucune

**Utilisation:**
```tsx
import InteractiveParticles from "@/components/3d/InteractiveParticles";

<InteractiveParticles />
```

### 9. TiltCard
**Fichier:** `src/components/3d/TiltCard.tsx`

Carte qui s'incline en 3D selon la position de la souris avec effet de brillance.

**Props:**
- `children`: Contenu de la carte
- `className`: Classes CSS additionnelles
- `tiltAmount`: Intensité de l'inclinaison en degrés (défaut: 15)

**Utilisation:**
```tsx
import TiltCard from "@/components/3d/TiltCard";

<TiltCard tiltAmount={10}>
  <div>Votre contenu ici</div>
</TiltCard>
```

### 10. MagneticButton
**Fichier:** `src/components/3d/MagneticButton.tsx`

Bouton avec effet magnétique qui attire la souris.

**Props:**
- `children`: Contenu du bouton
- `className`: Classes CSS additionnelles
- `onClick`: Handler de clic
- `magnetStrength`: Force de l'aimantation 0-1 (défaut: 0.3)
- `size`: Taille du bouton
- `variant`: Variant du bouton

**Utilisation:**
```tsx
import MagneticButton from "@/components/3d/MagneticButton";

<MagneticButton magnetStrength={0.5} size="lg">
  Cliquez-moi
</MagneticButton>
```

### 11. CursorGlow
**Fichier:** `src/components/3d/CursorGlow.tsx`

Lueur colorée qui suit le curseur avec effet de traînée multi-couches.

**Props:** Aucune

**Utilisation:**
```tsx
import CursorGlow from "@/components/3d/CursorGlow";

<CursorGlow />
```

---

## Animations CSS disponibles

### Classes d'animation

**animate-fade-in**
- Apparition en fondu avec mouvement vers le haut
- Durée: 1s
- Utilise `opacity: 0` initial

**animate-float**
- Mouvement vertical flottant
- Durée: 3s
- Boucle infinie

**animate-pulse-glow**
- Effet de lueur pulsante
- Durée: 2s
- Boucle infinie

**animate-blob**
- Mouvement organique aléatoire
- Durée: 7s
- Boucle infinie

### Délais d'animation

**animation-delay-2000**
- Délai de 2 secondes

**animation-delay-4000**
- Délai de 4 secondes

## Composition recommandée

### Landing page complète (actuel)
```tsx
<section className="relative overflow-hidden">
  {/* Lueur globale */}
  <CursorGlow />
  
  {/* Fond animé */}
  <AnimatedGradient />
  <ParallaxShapes />
  <FloatingShapes />
  <InteractiveParticles />
  
  <div className="relative z-10">
    {/* Contenu avec composants interactifs */}
    <MagneticButton magnetStrength={0.4}>
      Explorer
    </MagneticButton>
    
    <TiltCard tiltAmount={10}>
      <div>Votre contenu</div>
    </TiltCard>
  </div>
</section>
```

### Configuration subtile
```tsx
<section className="relative overflow-hidden">
  <AnimatedGradient />
  <ParallaxShapes />
  
  <div className="relative z-10">
    {/* Votre contenu ici */}
  </div>
</section>
```

### Configuration intense
```tsx
<section className="relative overflow-hidden">
  <CursorGlow />
  <AnimatedGradient />
  <ParallaxShapes />
  <FloatingShapes />
  <InteractiveParticles />
  <MouseFollower />
  
  <div className="relative z-10">
    <MagneticButton magnetStrength={0.7}>
      Action
    </MagneticButton>
  </div>
</section>
```

## Performance

### Composants non-interactifs
- Tous les composants sont optimisés avec `useRef` et `useFrame`
- Les particules sont limitées à 1000 pour maintenir 60fps
- L'opacité est réduite pour un effet subtil
- Le z-index est négatif pour ne pas interférer avec le contenu

### Composants interactifs
- Utilise `useMemo` pour les calculs coûteux
- Détection de proximité optimisée
- Transitions CSS pour les mouvements fluides
- Limitation à 2000 particules pour InteractiveParticles

### Performance attendue
- **Desktop moderne**: 60 FPS constant
- **Laptop milieu de gamme**: 45-60 FPS
- **Mobile haut de gamme**: 30-45 FPS

### Conseils d'optimisation
- ✅ Combiner 2-3 effets maximum par section
- ✅ Réduire l'opacité pour effet subtil (0.3-0.5)
- ✅ Limiter le nombre de particules
- ❌ Éviter d'activer tous les effets simultanément
- ❌ Ne pas dépasser 3000 particules au total

## Personnalisation

Pour changer les couleurs, modifiez les constantes dans chaque fichier:

```tsx
const COLORS = {
  primary: '#1F6FEB',    // Bleu
  accent: '#F59E0B',     // Jaune
  success: '#10B981',    // Vert
};
```

## Compatibilité

- Nécessite React 18+
- Compatible avec tous les navigateurs modernes supportant WebGL
- Graceful degradation sur les appareils mobiles bas de gamme
