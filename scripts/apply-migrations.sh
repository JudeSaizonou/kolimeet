#!/bin/bash

echo "🚀 Application des migrations Supabase..."
echo ""

PROJECT_REF="odzxqpaovgxcwqilildp"
MIGRATION_DIR="supabase/migrations"

echo "📦 Migrations à appliquer:"
echo "  1. Auto Matching System (20251126000001)"
echo "  2. Notifications System (20251126000002)"
echo ""

echo "⚠️  IMPORTANT: Ces migrations doivent être appliquées dans l'ordre."
echo ""
echo "Méthode 1 - Via le Dashboard Supabase (Recommandé):"
echo "  1. Ouvrez: https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
echo "  2. Copiez le contenu de: $MIGRATION_DIR/20251126000001_auto_matching_system.sql"
echo "  3. Cliquez sur 'Run'"
echo "  4. Répétez pour: $MIGRATION_DIR/20251126000002_notifications_system.sql"
echo ""

echo "Méthode 2 - Via Supabase CLI:"
echo "  npx supabase link --project-ref $PROJECT_REF"
echo "  npx supabase db push"
echo ""

read -p "Voulez-vous ouvrir le Dashboard Supabase maintenant? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
    open "https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
    echo "✅ Dashboard ouvert dans votre navigateur"
fi

echo ""
echo "📄 Fichiers de migration disponibles dans: $MIGRATION_DIR"
