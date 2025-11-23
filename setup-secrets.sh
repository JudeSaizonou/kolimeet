#!/bin/bash

# Script de configuration des secrets Supabase
# Usage: ./setup-secrets.sh

set -e

echo "🔐 Configuration des secrets Supabase Edge Functions..."
echo ""

# Vérifier que Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI n'est pas installé."
    echo "📦 Installation avec: brew install supabase/tap/supabase"
    exit 1
fi

echo "⚠️  Ce script va vous demander de saisir les secrets nécessaires."
echo "💡 Vous pouvez les trouver dans vos dashboards respectifs (Stripe, Resend, Twilio)."
echo ""

read -p "Continuer? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Annulé."
    exit 1
fi

echo ""

# Fonction pour définir un secret
set_secret() {
    local secret_name=$1
    local secret_description=$2
    local is_optional=$3
    
    echo "📝 $secret_description"
    read -p "   Valeur (laissez vide si non utilisé): " secret_value
    
    if [ -n "$secret_value" ]; then
        if supabase secrets set "$secret_name=$secret_value"; then
            echo "   ✅ $secret_name configuré"
        else
            echo "   ❌ Échec de configuration de $secret_name"
            if [ "$is_optional" != "true" ]; then
                exit 1
            fi
        fi
    else
        if [ "$is_optional" = "true" ]; then
            echo "   ⏭️  Ignoré"
        else
            echo "   ❌ Ce secret est obligatoire!"
            exit 1
        fi
    fi
    echo ""
}

# Stripe (obligatoire pour les paiements)
echo "💳 STRIPE CONFIGURATION"
set_secret "STRIPE_SECRET_KEY" "Stripe Secret Key (sk_...)" false
set_secret "STRIPE_WEBHOOK_SECRET" "Stripe Webhook Secret (whsec_...)" true

# Resend (obligatoire pour les emails)
echo "📧 RESEND CONFIGURATION"
set_secret "RESEND_API_KEY" "Resend API Key (re_...)" false

# Twilio (optionnel pour SMS)
echo "📱 TWILIO CONFIGURATION (Optionnel - pour vérification SMS)"
set_secret "TWILIO_ACCOUNT_SID" "Twilio Account SID (AC...)" true
set_secret "TWILIO_AUTH_TOKEN" "Twilio Auth Token" true
set_secret "TWILIO_PHONE_NUMBER" "Twilio Phone Number (+...)" true

# Mobile Money APIs (optionnel)
echo "💰 MOBILE MONEY CONFIGURATION (Optionnel)"
read -p "Voulez-vous configurer Orange Money? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    set_secret "ORANGE_MONEY_CLIENT_ID" "Orange Money Client ID" true
    set_secret "ORANGE_MONEY_CLIENT_SECRET" "Orange Money Client Secret" true
fi

read -p "Voulez-vous configurer MTN Mobile Money? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    set_secret "MTN_MOMO_SUBSCRIPTION_KEY" "MTN MoMo Subscription Key" true
    set_secret "MTN_MOMO_USER_ID" "MTN MoMo User ID" true
    set_secret "MTN_MOMO_API_KEY" "MTN MoMo API Key" true
fi

read -p "Voulez-vous configurer Wave? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    set_secret "WAVE_API_KEY" "Wave API Key" true
    set_secret "WAVE_SECRET_KEY" "Wave Secret Key" true
fi

echo ""
echo "✨ Configuration des secrets terminée!"
echo ""
echo "💡 Pour voir tous les secrets configurés:"
echo "   supabase secrets list"
echo ""
echo "💡 Pour supprimer un secret:"
echo "   supabase secrets unset SECRET_NAME"
