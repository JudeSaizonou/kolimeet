import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration(filePath: string, name: string) {
  console.log(`\n📦 Application de la migration: ${name}...`);
  
  try {
    const sql = readFileSync(filePath, 'utf-8');
    
    // Note: Supabase client ne peut pas exécuter du DDL directement
    // Il faut utiliser l'API Management ou le CLI
    console.log('⚠️  Cette migration doit être appliquée via le Dashboard Supabase ou le CLI');
    console.log(`📄 Fichier: ${filePath}`);
    console.log('\n--- SQL à exécuter ---');
    console.log(sql);
    console.log('--- Fin SQL ---\n');
    
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de la lecture de ${name}:`, error);
    return false;
  }
}

async function main() {
  console.log('🚀 Application des migrations Supabase...\n');
  
  const migrationsPath = join(process.cwd(), 'supabase', 'migrations');
  
  const migrations = [
    {
      file: join(migrationsPath, '20251126000001_auto_matching_system.sql'),
      name: 'Auto Matching System'
    },
    {
      file: join(migrationsPath, '20251126000002_notifications_system.sql'),
      name: 'Notifications System'
    }
  ];
  
  let success = true;
  for (const migration of migrations) {
    const result = await applyMigration(migration.file, migration.name);
    if (!result) success = false;
  }
  
  if (success) {
    console.log('\n✅ Instructions pour appliquer les migrations:');
    console.log('\n1. Via le Dashboard Supabase:');
    console.log('   - Allez sur https://supabase.com/dashboard/project/odzxqpaovgxcwqilildp/sql');
    console.log('   - Copiez-collez le contenu de chaque fichier SQL');
    console.log('   - Exécutez-les dans l\'ordre\n');
    console.log('2. Via le CLI Supabase (recommandé):');
    console.log('   - Installez: npm install -g supabase');
    console.log('   - Connectez: npx supabase link --project-ref odzxqpaovgxcwqilildp');
    console.log('   - Appliquez: npx supabase db push\n');
  }
}

main().catch(console.error);
