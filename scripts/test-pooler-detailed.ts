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
  console.error('❌ Impossible de lire le fichier env.production');
  process.exit(1);
}

const DATABASE_URL = envVars.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL manquant');
  process.exit(1);
}

console.log('🔍 Test détaillé de la connexion Pooler\n');
console.log('═══════════════════════════════════════════════════════\n');
console.log('📋 Connection string:');
console.log(`   ${DATABASE_URL.replace(/:[^:@]+@/, ':***@')}\n`);

// Vérifier le format
if (!DATABASE_URL.includes('pooler')) {
  console.log('⚠️  Attention: La connection string ne semble pas utiliser le pooler\n');
}

if (!DATABASE_URL.includes('sslmode=require')) {
  console.log('⚠️  Attention: sslmode=require manquant\n');
}

console.log('🧪 Tentative de connexion...\n');

try {
  const pool = new Pool({ 
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 20000,
  });
  
  console.log('⏳ Connexion en cours...\n');
  
  const result = await pool.query('SELECT version()');
  const version = result.rows[0].version;
  
  console.log('✅ Connexion réussie!');
  console.log(`   PostgreSQL: ${version.split(' ')[0]} ${version.split(' ')[1]}\n`);
  
  // Vérifier les tables
  const tablesResult = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  
  if (tablesResult.rows.length > 0) {
    console.log(`📊 ${tablesResult.rows.length} table(s) trouvée(s):`);
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Compter les enregistrements
    for (const table of tablesResult.rows) {
      try {
        const countResult = await pool.query(`SELECT COUNT(*) FROM ${table.table_name}`);
        console.log(`   → ${table.table_name}: ${countResult.rows[0].count} enregistrement(s)`);
      } catch (e) {
        // Ignorer les erreurs de comptage
      }
    }
  } else {
    console.log('📊 Aucune table trouvée. Prêt à appliquer le schéma.');
  }
  
  await pool.end();
  
  console.log('\n═══════════════════════════════════════════════════════\n');
  console.log('✨ Connexion validée!\n');
  console.log('📋 Prochaines étapes:');
  console.log('   1. Appliquer le schéma: npm run db:push:supabase');
  console.log('   2. Ou migration complète: npm run db:migrate:complete\n');
  
} catch (error: any) {
  console.log('❌ Erreur de connexion:\n');
  console.log(`   Message: ${error.message || 'Aucun message'}`);
  console.log(`   Code: ${error.code || 'Aucun code'}`);
  console.log(`   Stack: ${error.stack ? error.stack.split('\n')[0] : 'Aucun stack'}\n`);
  
  console.log('💡 Vérifications:');
  console.log('   1. Le mot de passe est correct');
  console.log('   2. Votre IP est autorisée dans Supabase');
  console.log('      → Settings > Database > Connection Pooling');
  console.log('   3. Le format de la connection string est correct\n');
  
  // Afficher des suggestions
  if (error.message?.includes('password') || error.message?.includes('authentication')) {
    console.log('🔑 Le problème semble être lié au mot de passe.');
    console.log('   Vérifiez que le mot de passe dans DATABASE_URL est correct.\n');
  }
  
  if (error.message?.includes('timeout') || error.message?.includes('ECONNREFUSED')) {
    console.log('🌐 Le problème semble être lié au réseau.');
    console.log('   Vérifiez que votre IP est autorisée dans Supabase.\n');
  }
  
  process.exit(1);
}


