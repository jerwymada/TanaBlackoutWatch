import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
const envPath = join(process.cwd(), 'env.production');
let envVars: Record<string, string> = {};

try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (key && value) {
          envVars[key] = value;
        }
      }
    }
  });
} catch (error) {
  console.error('❌ Could not read env.production file');
  process.exit(1);
}

const SUPABASE_URL = envVars.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = envVars.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');

console.log('🔍 Recherche de la connection string Supabase\n');
console.log('📋 Informations du projet:');
console.log(`   Project Reference: ${projectRef}`);
console.log(`   Dashboard URL: https://supabase.com/dashboard/project/${projectRef}\n`);

console.log('📍 Où trouver la connection string dans Supabase:\n');
console.log('Méthode 1 - Connection Pooling (Recommandé):');
console.log(`   1. Allez sur: https://supabase.com/dashboard/project/${projectRef}/settings/database`);
console.log('   2. Cherchez la section "Connection string" ou "Connection pooling"');
console.log('   3. Cliquez sur l\'onglet "Connection string" ou "URI"');
console.log('   4. La connection string complète avec le mot de passe devrait être affichée\n');

console.log('Méthode 2 - Via l\'API (si disponible):');
console.log('   Essayons de récupérer les informations via l\'API...\n');

try {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
  
  // Try to get project info
  console.log('🔌 Test de connexion à l\'API Supabase...');
  
  // Test basic connection
  const { data: healthCheck, error: healthError } = await supabase
    .from('_realtime')
    .select('count')
    .limit(1);
  
  if (healthError && healthError.code !== 'PGRST116') {
    console.log('⚠️  API accessible mais certaines fonctionnalités peuvent être limitées');
  } else {
    console.log('✅ API Supabase accessible\n');
  }
  
} catch (error: any) {
  console.log('⚠️  Test API:', error.message);
}

console.log('💡 Solutions alternatives:\n');

console.log('Option A - Réinitialiser le mot de passe:');
console.log(`   1. Allez sur: https://supabase.com/dashboard/project/${projectRef}/settings/database`);
console.log('   2. Dans "Database password", cliquez sur "Reset database password"');
console.log('   3. Copiez le nouveau mot de passe affiché');
console.log('   4. Utilisez-le pour construire la connection string\n');

console.log('Option B - Utiliser la connection string depuis le dashboard:');
console.log(`   1. Allez sur: https://supabase.com/dashboard/project/${projectRef}/settings/database`);
console.log('   2. Cherchez "Connection string" ou "Connection info"');
console.log('   3. Sélectionnez "URI" ou "Connection string"');
console.log('   4. Copiez la connection string complète (elle contient déjà le mot de passe)\n');

console.log('Option C - Construire manuellement:');
console.log('   Si vous avez le mot de passe, la connection string est:');
console.log(`   postgresql://postgres:[VOTRE-MOT-DE-PASSE]@db.${projectRef}.supabase.co:5432/postgres?sslmode=require\n`);

console.log('📝 Format de la connection string:');
console.log('   postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require');
console.log(`   Exemple: postgresql://postgres:monmotdepasse@db.${projectRef}.supabase.co:5432/postgres?sslmode=require\n`);

console.log('🔄 Une fois que vous avez la connection string:');
console.log('   1. Ajoutez-la à env.production comme: DATABASE_URL=<connection-string>');
console.log('   2. Ou utilisez: npm run supabase:configure (si vous avez juste le mot de passe)');
console.log('   3. Testez avec: npm run db:test:supabase\n');


