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

const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const schemaSQL = readFileSync(join(process.cwd(), 'schema.sql'), 'utf-8');

console.log('🚀 Configuration finale - Migration Supabase\n');
console.log('═══════════════════════════════════════════════════════\n');

async function main() {
  console.log('🔍 Vérification des tables...\n');
  
  // Attendre un peu pour que le cache se rafraîchisse
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  let neighborhoodsExist = false;
  let outagesExist = false;
  
  // Essayer plusieurs fois car le cache peut prendre du temps
  for (let i = 0; i < 3; i++) {
    const { error: nError } = await supabase.from('neighborhoods').select('*').limit(1);
    const { error: oError } = await supabase.from('outages').select('*').limit(1);
    
    neighborhoodsExist = !nError || (nError.code !== 'PGRST116' && nError.code !== '42P01');
    outagesExist = !oError || (oError.code !== 'PGRST116' && oError.code !== '42P01');
    
    if (neighborhoodsExist && outagesExist) {
      break;
    }
    
    if (i < 2) {
      console.log(`   Tentative ${i + 1}/3... (attente du cache)\n`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  if (neighborhoodsExist && outagesExist) {
    console.log('✅ Les tables existent et sont accessibles!\n');
    
    const { count: nCount } = await supabase
      .from('neighborhoods')
      .select('*', { count: 'exact', head: true });
    
    const { count: oCount } = await supabase
      .from('outages')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Neighborhoods: ${nCount || 0}`);
    console.log(`📊 Outages: ${oCount || 0}\n`);
    
    if ((nCount || 0) === 0) {
      console.log('💡 Les tables sont vides. Les données seront initialisées au démarrage du serveur.\n');
    }
    
    console.log('✨ Migration terminée avec succès!\n');
    console.log('📋 Prochaines étapes:');
    console.log('   1. Démarrer le serveur: npm run dev');
    console.log('   2. Les données seront automatiquement initialisées\n');
    
    return;
  }
  
  // Les tables n'existent pas ou ne sont pas accessibles
  console.log('📋 Les tables doivent être créées dans Supabase\n');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('📝 Instructions:\n');
  console.log('1. Ouvrez le SQL Editor de Supabase:');
  console.log(`   https://app.supabase.com/project/${projectRef}/sql/new\n`);
  console.log('2. Collez le SQL suivant (ou copiez depuis schema.sql):\n');
  console.log('─'.repeat(60));
  console.log(schemaSQL);
  console.log('─'.repeat(60));
  console.log('\n3. Cliquez sur "Run" pour exécuter\n');
  console.log('4. Attendez 5-10 secondes pour que le cache se rafraîchisse\n');
  console.log('5. Relancez ce script pour vérifier:');
  console.log('   npm run db:final-setup\n');
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(console.error);


