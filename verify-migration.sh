#!/bin/bash

# Script de vérification de la migration Kolimeet
# Usage: ./verify-migration.sh

echo "🔍 VÉRIFICATION DE LA MIGRATION Kolimeet"
echo "=========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier le fichier .env
echo "📄 Vérification du fichier .env..."
if grep -q "odzxqpaovgxcwqilildp" .env 2>/dev/null; then
    echo -e "${GREEN}✅ Variables Supabase correctes${NC}"
else
    echo -e "${RED}❌ Variables Supabase manquantes ou incorrectes${NC}"
    echo "   Vérifiez que .env contient odzxqpaovgxcwqilildp"
fi

# Vérifier config.toml
echo ""
echo "⚙️  Vérification de config.toml..."
if grep -q 'project_id = "odzxqpaovgxcwqilildp"' supabase/config.toml 2>/dev/null; then
    echo -e "${GREEN}✅ Project ID correct dans config.toml${NC}"
else
    echo -e "${RED}❌ Project ID incorrect dans config.toml${NC}"
fi

# Vérifier le lien Supabase
echo ""
echo "🔗 Vérification du lien Supabase CLI..."
if supabase status 2>&1 | grep -q "odzxqpaovgxcwqilildp\|rsifzvhtlqukvjoqirji"; then
    echo -e "${GREEN}✅ Projet Supabase lié${NC}"
else
    echo -e "${YELLOW}⚠️  Projet non lié localement (pas critique)${NC}"
fi

# Vérifier les Edge Functions
echo ""
echo "⚡ Vérification des Edge Functions..."
FUNCTIONS=("send-notification-email" "send-sms-verification" "refund-payment")
for func in "${FUNCTIONS[@]}"; do
    if [ -d "supabase/functions/$func" ]; then
        echo -e "${GREEN}✅ $func${NC}"
    else
        echo -e "${RED}❌ $func manquant${NC}"
    fi
done

# Vérifier les fichiers de migration
echo ""
echo "📦 Fichiers de migration créés:"
if [ -f "COMPLETE_MIGRATION.sql" ]; then
    echo -e "${GREEN}✅ COMPLETE_MIGRATION.sql${NC}"
else
    echo -e "${RED}❌ COMPLETE_MIGRATION.sql${NC}"
fi

if [ -f "GUIDE_FINALISATION.md" ]; then
    echo -e "${GREEN}✅ GUIDE_FINALISATION.md${NC}"
else
    echo -e "${RED}❌ GUIDE_FINALISATION.md${NC}"
fi

# Recommandations
echo ""
echo "=========================================="
echo "📋 PROCHAINES ÉTAPES:"
echo "=========================================="
echo ""
echo "1. Ouvrez GUIDE_FINALISATION.md"
echo "2. Suivez les 7 étapes (environ 20 minutes)"
echo "3. Testez votre application"
echo ""
echo "🔗 Lien direct vers le dashboard:"
echo "   https://supabase.com/dashboard/project/odzxqpaovgxcwqilildp"
echo ""
echo "🔗 Lien direct vers le SQL Editor:"
echo "   https://supabase.com/dashboard/project/odzxqpaovgxcwqilildp/sql/new"
echo ""
