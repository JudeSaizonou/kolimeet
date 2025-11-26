#!/bin/bash
# Script pour exécuter le backfill via le Dashboard Supabase

PROJECT_ID="odzxqpaovgxcwqilildp"
SQL_EDITOR_URL="https://supabase.com/dashboard/project/${PROJECT_ID}/sql/new"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  BACKFILL - Instructions d'exécution                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Étape 1: Ouvrir le SQL Editor Supabase"
echo "   URL: ${SQL_EDITOR_URL}"
echo ""
echo "📋 Étape 2: Coller et exécuter ce SQL (DRY RUN - simulation):"
echo ""
echo "────────────────────────────────────────────────────────────────"
cat << 'EOF'
SELECT backfill_parcel_matches(TRUE, 100);
EOF
echo "────────────────────────────────────────────────────────────────"
echo ""
echo "📊 Résultat attendu (exemple):"
echo '   {'
echo '     "success": true,'
echo '     "dry_run": true,'
echo '     "matches_created": 4500,'
echo '     "errors": 0'
echo '   }'
echo ""
echo "✅ Si errors = 0, vous pouvez passer en production:"
echo ""
echo "────────────────────────────────────────────────────────────────"
cat << 'EOF'
SELECT backfill_parcel_matches(FALSE, 100);
EOF
echo "────────────────────────────────────────────────────────────────"
echo ""
echo "🔍 Validation après exécution:"
echo ""
echo "────────────────────────────────────────────────────────────────"
cat << 'EOF'
SELECT validate_backfill_results();
EOF
echo "────────────────────────────────────────────────────────────────"
echo ""
echo "💡 Voulez-vous ouvrir le SQL Editor maintenant? (y/n)"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "🌐 Ouverture du Dashboard Supabase..."
    open "${SQL_EDITOR_URL}"
    echo "✅ Dashboard ouvert dans votre navigateur"
else
    echo "📝 Copiez l'URL ci-dessus manuellement:"
    echo "   ${SQL_EDITOR_URL}"
fi

echo ""
echo "📖 Documentation complète: docs/BACKFILL_GUIDE.md"
echo ""
