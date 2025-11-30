import { Pool } from 'pg';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Désactiver la vérification SSL au niveau Node.js (temporaire pour test)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

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

console.log('🔍 Test de connexion avec configuration SSL permissive\n');
console.log('═══════════════════════════════════════════════════════\n');

if (!password) {
  console.error('❌ Impossible d\'extraire le mot de passe');
  process.exit(1);
}

// Formats à tester
const connections = [
  {
    name: 'Pooler Session (port 6543) - US East',
    url: `postgresql://postgres.${projectRef}:${password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require`,
  },
  {
    name: 'Pooler Transaction (port 5432) - US East',
    url: `postgresql://postgres.${projectRef}:${password}@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require`,
  },
];

let success = false;

for (let i = 0; i < connections.length; i++) {
  const conn = connections[i];
  console.log(`🧪 Test ${i + 1}/${connections.length}: ${conn.name}`);
  console.log(`   ${conn.url.replace(/:[^:@]+@/, ':***@')}\n`);
  
  try {
    const pool = new Pool({ 
      connectionString: conn.url,
      ssl: false, // Désactiver SSL complètement pour test
      connectionTimeoutMillis: 20000,
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
    } else {
      console.log('📊 Aucune table trouvée. Prêt à appliquer le schéma.');
    }
    
    await pool.end();
    
    success = true;
    
    console.log('\n═══════════════════════════════════════════════════════\n');
    console.log('✨ Connexion validée!\n');
    
    // Remettre SSL pour la connection string finale
    const finalUrl = conn.url.replace('?sslmode=require', '');
    
    // Mettre à jour env.production avec SSL activé
    try {
      let envContent = readFileSync(envPath, 'utf-8');
      envContent = envContent.replace(
        /DATABASE_URL=.*/g,
        `DATABASE_URL=${conn.url}`
      );
      writeFileSync(envPath, envContent);
      console.log('✅ env.production mis à jour!\n');
    } catch (e) {
      console.log('⚠️  Impossible de mettre à jour env.production');
    }
    
    break;
    
  } catch (error: any) {
    console.log(`   ❌ Échec: ${error.message}\n`);
    
    // Essayer avec SSL activé mais rejectUnauthorized false
    if (error.message.includes('SSL') || error.message.includes('certificate')) {
      console.log('   🔄 Tentative avec SSL activé...\n');
      try {
        const pool2 = new Pool({ 
          connectionString: conn.url,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 20000,
        });
        
        const result2 = await pool2.query('SELECT version()');
        console.log('✅ Connexion réussie avec SSL!');
        console.log(`   PostgreSQL: ${result2.rows[0].version.split(' ')[0]}\n`);
        
        const tablesResult2 = await pool2.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
        `);
        
        if (tablesResult2.rows.length > 0) {
          console.log(`📊 ${tablesResult2.rows.length} table(s) trouvée(s)\n`);
        }
        
        await pool2.end();
        success = true;
        
        // Mettre à jour env.production
        try {
          let envContent = readFileSync(envPath, 'utf-8');
          envContent = envContent.replace(
            /DATABASE_URL=.*/g,
            `DATABASE_URL=${conn.url}`
          );
          writeFileSync(envPath, envContent);
          console.log('✅ env.production mis à jour!\n');
        } catch (e) {}
        
        break;
      } catch (error2: any) {
        console.log(`   ❌ Échec avec SSL: ${error2.message}\n`);
      }
    }
  }
}

// Réactiver la vérification SSL
delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;

if (success) {
  console.log('📋 Prochaines étapes:');
  console.log('   1. Appliquer le schéma: npm run db:push:supabase');
  console.log('   2. Ou migration complète: npm run db:migrate:complete\n');
} else {
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('❌ Impossible de se connecter\n');
  console.log('💡 Vérifications nécessaires:');
  console.log('   1. Votre IP est autorisée dans Supabase');
  console.log('      → Settings > Database > Connection Pooling');
  console.log('      → Ajoutez votre IP actuelle\n');
  console.log('   2. Le projet est actif (pas suspendu)');
  console.log(`      → https://app.supabase.com/project/${projectRef}\n`);
  console.log('   3. Le mot de passe est correct\n');
  process.exit(1);
}


