#!/bin/bash

# Script de déploiement des Edge Functions Supabase
# Usage: ./deploy-functions.sh [function-name]
# Si aucun nom n'est fourni, toutes les fonctions seront déployées

set -e

echo "🚀 Déploiement des Edge Functions Supabase..."
echo ""

# Vérifier que Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI n'est pas installé."
    echo "📦 Installation avec: brew install supabase/tap/supabase"
    exit 1
fi

# Vérifier que nous sommes dans le bon dossier
if [ ! -d "supabase/functions" ]; then
    echo "❌ Dossier supabase/functions introuvable."
    echo "📁 Assurez-vous d'être dans le dossier racine du projet."
    exit 1
fi

# Liste des fonctions disponibles
FUNCTIONS=(
    "send-notification-email"
    "send-sms-verification"
    "refund-payment"
)

# Fonction pour déployer une Edge Function
deploy_function() {
    local func_name=$1
    echo "📤 Déploiement de $func_name..."
    
    if supabase functions deploy "$func_name" --no-verify-jwt; then
        echo "✅ $func_name déployée avec succès!"
    else
        echo "❌ Échec du déploiement de $func_name"
        return 1
    fi
    echo ""
}

# Si un argument est fourni, déployer uniquement cette fonction
if [ $# -eq 1 ]; then
    FUNCTION_NAME=$1
    
    # Vérifier que la fonction existe
    if [[ ! " ${FUNCTIONS[@]} " =~ " ${FUNCTION_NAME} " ]]; then
        echo "❌ Fonction '$FUNCTION_NAME' inconnue."
        echo "📋 Fonctions disponibles: ${FUNCTIONS[*]}"
        exit 1
    fi
    
    deploy_function "$FUNCTION_NAME"
else
    # Déployer toutes les fonctions
    echo "📋 Déploiement de toutes les fonctions..."
    echo ""
    
    for func in "${FUNCTIONS[@]}"; do
        deploy_function "$func"
    done
fi

echo "✨ Déploiement terminé!"
echo ""
echo "💡 Conseils:"
echo "  - Vérifiez les logs: supabase functions logs <function-name>"
echo "  - Testez une fonction: supabase functions invoke <function-name> --data '{...}'"
echo "  - Configurez les secrets: supabase secrets set SECRET_NAME=value"
