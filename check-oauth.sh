#!/bin/bash

echo "🔍 DIAGNOSTIC GOOGLE OAUTH - KOLIMEET"
echo "====================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier le fichier .env
echo "📋 Vérification du fichier .env..."
echo ""

if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} Fichier .env trouvé"
    
    # Extraire les valeurs
    SUPABASE_URL=$(grep "VITE_SUPABASE_URL" .env | cut -d '=' -f2 | tr -d '"')
    OAUTH_DEV=$(grep "VITE_OAUTH_REDIRECT_DEV" .env | cut -d '=' -f2 | tr -d '"')
    OAUTH_PROD=$(grep "VITE_OAUTH_REDIRECT_PROD" .env | cut -d '=' -f2 | tr -d '"')
    
    echo ""
    echo "Supabase URL: $SUPABASE_URL"
    echo "OAuth Dev:    $OAUTH_DEV"
    echo "OAuth Prod:   $OAUTH_PROD"
    echo ""
else
    echo -e "${RED}✗${NC} Fichier .env non trouvé!"
    exit 1
fi

# Vérifier la connexion Supabase
echo "🔗 Vérification de la connexion Supabase..."
echo ""

PROJECT_REF=$(grep "project_id" supabase/config.toml | cut -d '"' -f2)
echo "Project ID: $PROJECT_REF"

if [ "$PROJECT_REF" == "odzxqpaovgxcwqilildp" ]; then
    echo -e "${GREEN}✓${NC} Project ID correct"
else
    echo -e "${RED}✗${NC} Project ID incorrect! Devrait être: odzxqpaovgxcwqilildp"
fi

echo ""

# URLs à configurer dans Google Cloud Console
echo "📝 URLs À AJOUTER DANS GOOGLE CLOUD CONSOLE"
echo "==========================================="
echo ""
echo "Allez sur: https://console.cloud.google.com/apis/credentials"
echo ""
echo "Dans 'Authorized redirect URIs', ajoutez ces 3 URLs:"
echo ""
echo -e "${YELLOW}1.${NC} https://odzxqpaovgxcwqilildp.supabase.co/auth/v1/callback"
echo -e "${YELLOW}2.${NC} http://localhost:8080/auth/callback"
echo -e "${YELLOW}3.${NC} https://kolimeet.lovable.app/auth/callback"
echo ""

# Checklist
echo "✅ CHECKLIST DE CONFIGURATION"
echo "=============================="
echo ""
echo "Google Cloud Console:"
echo "  [ ] OAuth 2.0 Client ID créé"
echo "  [ ] Les 3 URLs de redirection ajoutées"
echo "  [ ] Changements sauvegardés (bouton SAVE cliqué)"
echo "  [ ] Attendu 5-10 minutes après la configuration"
echo ""
echo "Supabase Dashboard (https://supabase.com/dashboard/project/odzxqpaovgxcwqilildp/auth/providers):"
echo "  [ ] Google Provider activé"
echo "  [ ] Client ID de Google ajouté"
echo "  [ ] Client Secret de Google ajouté"
echo "  [ ] Configuration sauvegardée"
echo ""
echo "Application:"
echo "  [ ] Fichier .env à jour"
echo "  [ ] Application redémarrée après modification .env"
echo ""

# Test de connectivité
echo "🌐 Test de connectivité..."
echo ""

if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://odzxqpaovgxcwqilildp.supabase.co")
    if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "404" ]; then
        echo -e "${GREEN}✓${NC} Supabase accessible (HTTP $HTTP_CODE)"
    else
        echo -e "${RED}✗${NC} Problème d'accès à Supabase (HTTP $HTTP_CODE)"
    fi
else
    echo -e "${YELLOW}⚠${NC}  curl non disponible, impossible de tester la connectivité"
fi

echo ""
echo "🔍 ÉTAPES SUIVANTES"
echo "==================="
echo ""
echo "1. Configurez Google Cloud Console avec les URLs ci-dessus"
echo "2. Configurez Supabase Dashboard avec vos credentials Google"
echo "3. Attendez 5-10 minutes"
echo "4. Testez la connexion Google dans votre application"
echo ""
echo "📄 Documentation complète: GOOGLE_REDIRECT_URIS.md"
echo ""
