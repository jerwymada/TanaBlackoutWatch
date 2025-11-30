import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
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

console.log('🚀 Création automatique du schéma Supabase\n');
console.log('═══════════════════════════════════════════════════════\n');

async function createSchemaViaRPC() {
  console.log('🧪 Tentative via API RPC...\n');
  
  try {
    // Essayer d'exécuter via une fonction RPC si elle existe
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: schemaSQL });
    
    if (!error) {
      console.log('✅ Schéma créé via RPC!\n');
      return true;
    }
    
    // Essayer avec un autre format
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({ query: schemaSQL }),
    });
    
    if (response.ok) {
      console.log('✅ Schéma créé via API REST!\n');
      return true;
    }
  } catch (error: any) {
    // Ignorer les erreurs, on essaiera d'autres méthodes
  }
  
  return false;
}

async function main() {
  // Vérifier si les tables existent déjà
  console.log('🔍 Vérification des tables existantes...\n');
  
  const { data: neighborhoods, error: neighborhoodsError } = await supabase
    .from('neighborhoods')
    .select('*')
    .limit(1);
  
  const { data: outages, error: outagesError } = await supabase
    .from('outages')
    .select('*')
    .limit(1);
  
  const neighborhoodsExist = !neighborhoodsError || (neighborhoodsError.code !== 'PGRST116' && neighborhoodsError.code !== '42P01');
  const outagesExist = !outagesError || (outagesError.code !== 'PGRST116' && outagesError.code !== '42P01');
  
  if (neighborhoodsExist && outagesExist) {
    console.log('✅ Toutes les tables existent déjà!\n');
    
    const { count: nCount } = await supabase
      .from('neighborhoods')
      .select('*', { count: 'exact', head: true });
    
    const { count: oCount } = await supabase
      .from('outages')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Neighborhoods: ${nCount || 0}`);
    console.log(`📊 Outages: ${oCount || 0}\n`);
    console.log('✨ Migration terminée!\n');
    return;
  }
  
  // Essayer de créer via API
  const created = await createSchemaViaRPC();
  
  if (!created) {
    console.log('📋 Création via SQL Editor (méthode recommandée)\n');
    console.log('1. Ouvrez le SQL Editor:');
    console.log(`   https://app.supabase.com/project/${projectRef}/sql/new\n`);
    console.log('2. Le fichier schema.sql a été créé à la racine du projet');
    console.log('   Copiez son contenu dans le SQL Editor\n');
    console.log('3. Cliquez sur "Run" pour exécuter\n');
    console.log('4. Relancez ce script pour vérifier:');
    console.log('   npm run db:create-schema\n');
    console.log('─'.repeat(60));
    console.log('SQL à copier:');
    console.log('─'.repeat(60));
    console.log(schemaSQL);
    console.log('─'.repeat(60));
    console.log('');
  } else {
    // Vérifier que les tables ont été créées
    console.log('🔍 Vérification...\n');
    
    const { error: nError } = await supabase.from('neighborhoods').select('*').limit(1);
    const { error: oError } = await supabase.from('outages').select('*').limit(1);
    
    if (!nError && !oError) {
      console.log('✅ Schéma créé avec succès!\n');
    } else {
      console.log('⚠️  Certaines tables n\'ont pas pu être créées automatiquement\n');
      console.log('📋 Utilisez le SQL Editor comme indiqué ci-dessus\n');
    }
  }
}

main().catch(console.error);


