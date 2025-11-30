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

console.log('🚀 Migration complète vers Supabase (via API)\n');
console.log('═══════════════════════════════════════════════════════\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');

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
  console.log('🧪 Test de connexion API Supabase...\n');
  
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
  
  // Vérifier si les tables existent
  console.log('🔍 Vérification des tables...\n');
  
  const { data: neighborhoodsData, error: neighborhoodsError } = await supabase
    .from('neighborhoods')
    .select('*')
    .limit(1);
  
  const { data: outagesData, error: outagesError } = await supabase
    .from('outages')
    .select('*')
    .limit(1);
  
  const neighborhoodsExist = !neighborhoodsError || (neighborhoodsError.code !== 'PGRST116' && neighborhoodsError.code !== '42P01');
  const outagesExist = !outagesError || (outagesError.code !== 'PGRST116' && outagesError.code !== '42P01');
  
  if (neighborhoodsExist && outagesExist) {
    console.log('✅ Toutes les tables existent déjà\n');
    
    // Compter les enregistrements
    const { count: neighborhoodsCount } = await supabase
      .from('neighborhoods')
      .select('*', { count: 'exact', head: true });
    
    const { count: outagesCount } = await supabase
      .from('outages')
      .select('*', { count: 'exact', head: true });
    
    console.log('📊 Statistiques:');
    console.log(`   Neighborhoods: ${neighborhoodsCount || 0}`);
    console.log(`   Outages: ${outagesCount || 0}\n`);
    
    console.log('✨ Migration terminée! Les tables existent déjà.\n');
    console.log('📋 Prochaines étapes:');
    console.log('   1. Démarrer le serveur: npm run dev');
    console.log('   2. Le code utilise maintenant l\'API Supabase\n');
    
    return;
  }
  
  // Les tables n'existent pas, afficher les instructions
  console.log('📋 Les tables n\'existent pas encore.\n');
  console.log('📝 Étape 1: Créer le schéma dans Supabase\n');
  console.log('1. Ouvrez le SQL Editor de Supabase:');
  console.log(`   https://app.supabase.com/project/${projectRef}/sql/new\n`);
  console.log('2. Collez le SQL suivant:\n');
  console.log('─'.repeat(60));
  console.log(schemaSQL);
  console.log('─'.repeat(60));
  console.log('\n3. Cliquez sur "Run" pour exécuter\n');
  console.log('4. Une fois les tables créées, relancez ce script:');
  console.log('   npm run db:migrate:supabase-api\n');
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(console.error);


