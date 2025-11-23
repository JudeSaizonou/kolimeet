#!/bin/bash

echo "🚀 DÉPLOIEMENT KILOMEET SUR VERCEL"
echo "=================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI non installé${NC}"
    echo ""
    echo "Installation de Vercel CLI..."
    npm install -g vercel
    echo ""
fi

# Vérifier que nous sommes dans le bon dossier
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur: package.json introuvable${NC}"
    echo "Exécutez ce script depuis le dossier racine du projet"
    exit 1
fi

echo "📋 Checklist pré-déploiement"
echo "----------------------------"
echo ""

# Build local
echo "🔨 Test du build local..."
if bun run build; then
    echo -e "${GREEN}✓${NC} Build réussi"
else
    echo -e "${RED}✗${NC} Échec du build"
    exit 1
fi
echo ""

# Vérifier les variables d'environnement
echo "🔑 Vérification des variables d'environnement..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} Fichier .env trouvé"
    
    # Vérifier les variables critiques
    if grep -q "VITE_SUPABASE_URL" .env && \
       grep -q "VITE_SUPABASE_PUBLISHABLE_KEY" .env; then
        echo -e "${GREEN}✓${NC} Variables Supabase présentes"
    else
        echo -e "${RED}✗${NC} Variables Supabase manquantes"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️${NC}  Fichier .env non trouvé"
fi
echo ""

# Vérifier vercel.json
if [ -f "vercel.json" ]; then
    echo -e "${GREEN}✓${NC} Configuration Vercel présente"
else
    echo -e "${YELLOW}⚠️${NC}  vercel.json non trouvé (optionnel)"
fi
echo ""

# Git status
echo "📦 Statut Git..."
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️${NC}  Modifications non commitées détectées"
    echo ""
    echo "Voulez-vous commiter avant de déployer? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo ""
        echo "Message de commit:"
        read -r commit_msg
        git add .
        git commit -m "$commit_msg"
        git push
        echo -e "${GREEN}✓${NC} Changements commitées et pushés"
    fi
else
    echo -e "${GREEN}✓${NC} Pas de modifications non commitées"
fi
echo ""

# Déploiement
echo "🚀 Déploiement sur Vercel..."
echo ""
echo "Choisissez le type de déploiement:"
echo "1) Production (main branch)"
echo "2) Preview (test deployment)"
echo ""
read -p "Votre choix (1/2): " deploy_type

if [ "$deploy_type" = "1" ]; then
    echo ""
    echo "🚨 DÉPLOIEMENT EN PRODUCTION"
    echo ""
    vercel --prod
elif [ "$deploy_type" = "2" ]; then
    echo ""
    echo "🔍 DÉPLOIEMENT PREVIEW"
    echo ""
    vercel
else
    echo -e "${RED}❌ Choix invalide${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✨ Déploiement terminé!${NC}"
echo ""
echo "📋 Prochaines étapes:"
echo "  1. Testez l'URL de production"
echo "  2. Mettez à jour VITE_OAUTH_REDIRECT_PROD avec la nouvelle URL"
echo "  3. Ajoutez l'URL dans Google Cloud Console"
echo "  4. Redéployez avec la bonne variable"
echo ""
echo "📚 Consultez DEPLOY_VERCEL.md pour plus de détails"
