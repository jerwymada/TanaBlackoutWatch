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

console.log('🚀 Migration vers Supabase via API (Service Role Key)\n');
console.log('═══════════════════════════════════════════════════════\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// SQL pour créer le schéma
const schemaSQL = `
-- Table neighborhoods
CREATE TABLE IF NOT EXISTS neighborhoods (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  district TEXT NOT NULL
);

-- Table outages
CREATE TABLE IF NOT EXISTS outages (
  id SERIAL PRIMARY KEY,
  neighborhood_id INTEGER NOT NULL REFERENCES neighborhoods(id),
  date TEXT NOT NULL,
  start_hour REAL NOT NULL,
  end_hour REAL NOT NULL,
  reason TEXT
);

-- Index
CREATE INDEX IF NOT EXISTS outages_date_idx ON outages(date);
CREATE INDEX IF NOT EXISTS outages_neighborhood_idx ON outages(neighborhood_id);
CREATE INDEX IF NOT EXISTS outages_date_neighborhood_idx ON outages(date, neighborhood_id);
`;

async function main() {
  console.log('🧪 Test de connexion API...\n');
  
  // Test de connexion
  try {
    const { error } = await supabase.from('neighborhoods').select('count').limit(1);
    if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
      console.log(`⚠️  ${error.message}\n`);
    } else {
      console.log('✅ API Supabase accessible\n');
    }
  } catch (error: any) {
    console.log(`⚠️  ${error.message}\n`);
  }
  
  console.log('📋 SQL à exécuter dans Supabase SQL Editor:\n');
  console.log('─'.repeat(60));
  console.log(schemaSQL);
  console.log('─'.repeat(60));
  
  console.log('\n💡 Instructions:\n');
  console.log('1. Ouvrez le SQL Editor de Supabase:');
  const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
  console.log(`   https://app.supabase.com/project/${projectRef}/sql/new\n`);
  console.log('2. Collez le SQL ci-dessus');
  console.log('3. Cliquez sur "Run" pour exécuter\n');
  console.log('4. Une fois les tables créées, testez avec:');
  console.log('   npm run db:test:supabase\n');
  
  // Vérifier si les tables existent déjà
  console.log('🔍 Vérification des tables existantes...\n');
  
  const tables = ['neighborhoods', 'outages'];
  let allExist = true;
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') {
        console.log(`   ❌ "${table}" n'existe pas`);
        allExist = false;
      } else {
        console.log(`   ⚠️  "${table}": ${error.message}`);
        allExist = false;
      }
    } else {
      console.log(`   ✅ "${table}" existe déjà`);
    }
  }
  
  if (allExist) {
    console.log('\n✨ Toutes les tables existent déjà!\n');
    console.log('📋 Vous pouvez maintenant:');
    console.log('   1. Migrer les données: npm run db:migrate:supabase');
    console.log('   2. Démarrer le serveur: npm run dev\n');
  } else {
    console.log('\n📝 Les tables n\'existent pas encore.');
    console.log('   Suivez les instructions ci-dessus pour créer les tables via le SQL Editor.\n');
  }
}

main();

