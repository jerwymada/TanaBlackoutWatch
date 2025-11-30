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
  console.error('❌ Impossible de lire le fichier env.production');
  process.exit(1);
}

const SUPABASE_URL = envVars.SUPABASE_URL;
const SUPABASE_ANON_KEY = envVars.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE = envVars.SUPABASE_SERVICE_ROLE;

console.log('🔍 Diagnostic Supabase\n');
console.log('═══════════════════════════════════════════════════════\n');

if (!SUPABASE_URL) {
  console.error('❌ SUPABASE_URL manquant dans env.production');
  process.exit(1);
}

const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
console.log(`📋 Projet: ${projectRef}`);
console.log(`🔗 URL: ${SUPABASE_URL}\n`);

// Test avec l'API Supabase (Anon Key)
console.log('🧪 Test 1: Connexion API avec Anon Key...\n');

if (SUPABASE_ANON_KEY) {
  try {
    const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Test simple de connexion
    const { data, error } = await supabaseAnon.from('_supabase_migrations').select('version').limit(1);
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('✅ API Supabase accessible');
        console.log('   (Table _supabase_migrations non trouvée - normal si aucune migration)');
      } else {
        console.log(`⚠️  Erreur API: ${error.message}`);
        console.log(`   Code: ${error.code}`);
      }
    } else {
      console.log('✅ API Supabase accessible et fonctionnelle');
    }
  } catch (error: any) {
    console.log(`❌ Erreur de connexion API: ${error.message}`);
  }
} else {
  console.log('⚠️  SUPABASE_ANON_KEY manquant');
}

console.log('\n');

// Test avec Service Role Key
console.log('🧪 Test 2: Connexion API avec Service Role Key...\n');

if (SUPABASE_SERVICE_ROLE) {
  try {
    const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
    
    // Test avec une requête qui nécessite les droits admin
    const { data, error } = await supabaseService.from('_supabase_migrations').select('version').limit(1);
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('✅ Service Role Key valide');
        console.log('   (Table _supabase_migrations non trouvée - normal si aucune migration)');
      } else {
        console.log(`⚠️  Erreur: ${error.message}`);
        console.log(`   Code: ${error.code}`);
      }
    } else {
      console.log('✅ Service Role Key valide et fonctionnelle');
    }
  } catch (error: any) {
    console.log(`❌ Erreur: ${error.message}`);
  }
} else {
  console.log('⚠️  SUPABASE_SERVICE_ROLE manquant');
}

console.log('\n═══════════════════════════════════════════════════════\n');

// Résumé et recommandations
console.log('📋 Résumé:\n');

if (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_ROLE) {
  console.log('✅ Toutes les clés API sont configurées');
  console.log('✅ Le projet Supabase semble accessible via l\'API\n');
  
  console.log('💡 Prochaines étapes:');
  console.log('   1. Vérifiez le dashboard Supabase:');
  console.log(`      https://app.supabase.com/project/${projectRef}\n`);
  console.log('   2. Vérifiez la connection string PostgreSQL:');
  console.log('      Settings > Database > Connection string\n');
  console.log('   3. Vérifiez que votre IP est autorisée:');
  console.log('      Settings > Database > Connection Pooling\n');
  console.log('   4. Si la connexion PostgreSQL ne fonctionne pas,');
  console.log('      vous pouvez utiliser l\'API Supabase directement\n');
} else {
  console.log('⚠️  Certaines clés API sont manquantes\n');
  console.log('💡 Vérifiez votre fichier env.production\n');
}

console.log('🔗 Liens utiles:');
console.log(`   Dashboard: https://app.supabase.com/project/${projectRef}`);
console.log(`   Settings: https://app.supabase.com/project/${projectRef}/settings/database`);
console.log(`   API Docs: ${SUPABASE_URL}/rest/v1/\n`);


