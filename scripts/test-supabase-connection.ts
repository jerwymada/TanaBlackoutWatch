import { Pool } from 'pg';
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

const DATABASE_URL = envVars.DATABASE_URL;
const SUPABASE_URL = envVars.SUPABASE_URL;
const projectRef = SUPABASE_URL?.replace('https://', '').replace('.supabase.co', '');

console.log('🔍 Test de connexion Supabase\n');

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in env.production');
  process.exit(1);
}

console.log('📋 Connection string configurée:');
console.log(`   ${DATABASE_URL.replace(/:[^:@]+@/, ':***@')}\n`);

// Try different connection string formats
const connectionStrings = [
  DATABASE_URL,
  // Alternative format with pooler
  `postgresql://postgres.${projectRef}:${DATABASE_URL.match(/:[^:@]+@/)?.[0].slice(1, -1)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require`,
  // Direct connection alternative
  DATABASE_URL.replace('db.', 'aws-0-us-east-1.pooler.supabase.com').replace(':5432', ':6543'),
];

for (let i = 0; i < connectionStrings.length; i++) {
  const connStr = connectionStrings[i];
  console.log(`🧪 Test ${i + 1}/${connectionStrings.length}...`);
  console.log(`   Format: ${connStr.replace(/:[^:@]+@/, ':***@')}\n`);
  
  try {
    const pool = new Pool({ 
      connectionString: connStr,
      connectionTimeoutMillis: 5000,
    });
    
    const result = await pool.query('SELECT version()');
    console.log('✅ Connexion réussie!');
    console.log(`   PostgreSQL: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}\n`);
    
    // Check tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log(`📊 ${tablesResult.rows.length} table(s) trouvée(s):`);
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('📊 Aucune table trouvée. Prêt à appliquer le schéma.');
    }
    
    await pool.end();
    
    // Update env.production with working connection string
    if (i > 0) {
      let envContent = readFileSync(envPath, 'utf-8');
      envContent = envContent.replace(
        /DATABASE_URL=.*/g,
        `DATABASE_URL=${connStr}`
      );
      require('fs').writeFileSync(envPath, envContent);
      console.log('\n✅ env.production mis à jour avec la connection string fonctionnelle!\n');
    }
    
    console.log('\n✨ Connexion validée! Vous pouvez maintenant:');
    console.log('   1. Appliquer le schéma: npm run db:push:supabase');
    console.log('   2. Démarrer le serveur: npm run dev\n');
    
    process.exit(0);
    
  } catch (error: any) {
    console.log(`   ❌ Échec: ${error.message}\n`);
    if (i === connectionStrings.length - 1) {
      console.log('💡 Tous les formats ont échoué. Vérifiez:');
      console.log('   1. Le mot de passe est correct');
      console.log('   2. Votre IP est autorisée dans Supabase');
      console.log('   3. Le projet est actif');
      console.log('   4. Le format de la connection string dans le dashboard Supabase\n');
    }
  }
}


