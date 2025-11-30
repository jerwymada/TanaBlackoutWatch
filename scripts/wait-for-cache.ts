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
const SUPABASE_SERVICE_ROLE = envVars.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE manquant');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log('⏳ Attente du rafraîchissement du cache PostgREST...\n');

async function waitForCache() {
  const maxAttempts = 10;
  const delay = 3000; // 3 secondes entre chaque tentative
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const { error } = await supabase.from('neighborhoods').select('*').limit(1);
      
      if (!error || (error.code !== 'PGRST116' && error.code !== '42P01')) {
        console.log('✅ Cache rafraîchi! Les tables sont accessibles.\n');
        return true;
      }
      
      console.log(`   Tentative ${i + 1}/${maxAttempts}... (cache pas encore à jour)`);
      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error: any) {
      console.log(`   Tentative ${i + 1}/${maxAttempts}... (erreur: ${error.message})`);
      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.log('\n⚠️  Le cache n\'est pas encore à jour après plusieurs tentatives.\n');
  console.log('💡 Solutions:');
  console.log('   1. Attendez 1-2 minutes et réessayez');
  console.log('   2. Allez dans Supabase Dashboard > Settings > API');
  console.log('      et cliquez sur "Reload schema" si disponible');
  console.log('   3. Vérifiez que les tables existent dans le SQL Editor\n');
  
  return false;
}

waitForCache().then(success => {
  if (success) {
    console.log('✨ Vous pouvez maintenant démarrer le serveur:');
    console.log('   npm run dev\n');
    process.exit(0);
  } else {
    process.exit(1);
  }
});


