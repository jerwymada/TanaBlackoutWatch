import { Pool } from 'pg';
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
const DATABASE_URL = envVars.DATABASE_URL;

if (!SUPABASE_URL || !DATABASE_URL) {
  console.error('❌ SUPABASE_URL ou DATABASE_URL manquant');
  process.exit(1);
}

const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
const password = DATABASE_URL.match(/:[^:@]+@/)?.[0]?.slice(1, -1) || '';

console.log('🔍 Test de connexion via Pooler Supabase\n');
console.log('═══════════════════════════════════════════════════════\n');

if (!password) {
  console.error('❌ Impossible d\'extraire le mot de passe');
  process.exit(1);
}

// Formats de pooler à tester avec configuration SSL correcte
const poolerConnections = [
  {
    name: 'Pooler Session (port 6543) - US East',
    url: `postgresql://postgres.${projectRef}:${password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require`,
  },
  {
    name: 'Pooler Transaction (port 5432) - US East',
    url: `postgresql://postgres.${projectRef}:${password}@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require`,
  },
  {
    name: 'Pooler Session (port 6543) - EU West',
    url: `postgresql://postgres.${projectRef}:${password}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require`,
  },
  {
    name: 'Pooler Transaction (port 5432) - EU West',
    url: `postgresql://postgres.${projectRef}:${password}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require`,
  },
];

let success = false;

for (let i = 0; i < poolerConnections.length; i++) {
  const conn = poolerConnections[i];
  console.log(`🧪 Test ${i + 1}/${poolerConnections.length}: ${conn.name}`);
  console.log(`   ${conn.url.replace(/:[^:@]+@/, ':***@')}\n`);
  
  try {
    const pool = new Pool({ 
      connectionString: conn.url,
      ssl: {
        rejectUnauthorized: false, // Accepter les certificats auto-signés pour les poolers
      },
      connectionTimeoutMillis: 15000,
    });
    
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
    
    success = true;
    
    console.log('\n═══════════════════════════════════════════════════════\n');
    console.log('✨ Connexion validée via Pooler!\n');
    
    // Mettre à jour env.production
    try {
      let envContent = readFileSync(envPath, 'utf-8');
      envContent = envContent.replace(
        /DATABASE_URL=.*/g,
        `DATABASE_URL=${conn.url}`
      );
      writeFileSync(envPath, envContent);
      console.log('✅ env.production mis à jour avec la connexion pooler fonctionnelle!\n');
    } catch (e) {
      console.log('⚠️  Impossible de mettre à jour env.production automatiquement');
      console.log(`   Utilisez cette URL: ${conn.url}\n`);
    }
    
    console.log('📋 Prochaines étapes:');
    console.log('   1. Appliquer le schéma: npm run db:push:supabase');
    console.log('   2. Ou migration complète: npm run db:migrate:complete');
    console.log('   3. Démarrer le serveur: npm run dev\n');
    
    break;
    
  } catch (error: any) {
    console.log(`   ❌ Échec: ${error.message}\n`);
    
    if (i === poolerConnections.length - 1) {
      console.log('═══════════════════════════════════════════════════════\n');
      console.log('❌ Tous les poolers ont échoué\n');
      console.log('💡 Le problème peut être:');
      console.log('   1. Votre IP n\'est pas autorisée dans Supabase');
      console.log('      → Settings > Database > Connection Pooling');
      console.log('   2. Le projet est dans une autre région');
      console.log('   3. Le mot de passe est incorrect');
      console.log('   4. Le projet est suspendu\n');
      console.log('🔗 Vérifiez le dashboard:');
      console.log(`   https://app.supabase.com/project/${projectRef}/settings/database\n`);
    }
  }
}

if (!success) {
  process.exit(1);
}


