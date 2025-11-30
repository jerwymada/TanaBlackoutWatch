import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';

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

const SUPABASE_URL = envVars.SUPABASE_URL;
const projectRef = SUPABASE_URL?.replace('https://', '').replace('.supabase.co', '');

// Extract password from DATABASE_URL if it exists
let password = '';
if (envVars.DATABASE_URL) {
  // Try different patterns to extract password
  const patterns = [
    /postgres:([^:@]+)@/,  // postgres:password@
    /:\/([^:@]+)@/,        // :/password@
    /@([^:@]+)@/,          // @password@
  ];
  
  for (const pattern of patterns) {
    const match = envVars.DATABASE_URL.match(pattern);
    if (match && match[1] && match[1] !== 'postgres') {
      password = match[1];
      break;
    }
  }
  
  // If still not found, try to extract from the connection string directly
  if (!password) {
    const urlParts = envVars.DATABASE_URL.split('@');
    if (urlParts.length > 1) {
      const authPart = urlParts[0];
      const passMatch = authPart.match(/postgres:([^@]+)/);
      if (passMatch) {
        password = passMatch[1];
      }
    }
  }
}

if (!password) {
  console.error('❌ Mot de passe non trouvé dans env.production');
  console.log('\n💡 Assurez-vous que le mot de passe est présent dans le fichier\n');
  process.exit(1);
}

console.log('🔧 Correction de la connection string Supabase\n');
console.log(`📋 Project Reference: ${projectRef}`);
console.log(`🔑 Mot de passe trouvé: ${password.substring(0, 3)}***\n`);

// Try different connection string formats
const formats = [
  // Format 1: Direct connection (most common)
  `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`,
  
  // Format 2: With pooler (session mode)
  `postgresql://postgres.${projectRef}:${password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require`,
  
  // Format 3: Direct with different host format
  `postgresql://postgres:${password}@${projectRef}.supabase.co:5432/postgres?sslmode=require`,
  
  // Format 4: Pooler transaction mode
  `postgresql://postgres.${projectRef}:${password}@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require`,
];

console.log('🧪 Test des différents formats de connection string...\n');

for (let i = 0; i < formats.length; i++) {
  const connStr = formats[i];
  const formatName = [
    'Direct (db.*.supabase.co:5432)',
    'Session Pooler (aws-0-us-east-1:6543)',
    'Direct Alternative (*.supabase.co:5432)',
    'Transaction Pooler (aws-0-us-east-1:5432)',
  ][i];
  
  console.log(`Test ${i + 1}/${formats.length}: ${formatName}`);
  console.log(`   ${connStr.replace(/:[^:@]+@/, ':***@')}\n`);
  
  try {
    const pool = new Pool({ 
      connectionString: connStr,
      connectionTimeoutMillis: 10000,
      ssl: { rejectUnauthorized: false }, // Allow self-signed certificates
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
    
    // Update env.production
    let envContent = readFileSync(envPath, 'utf-8');
    
    // Remove old DATABASE_URL if exists
    envContent = envContent.replace(/DATABASE_URL=.*\n/g, '');
    // Remove password line if it's standalone
    envContent = envContent.replace(/#Database Password[^\n]*\n[^\n]*\n/g, '');
    
    // Add new DATABASE_URL
    if (!envContent.includes('DATABASE_URL=')) {
      envContent += `\n# Database Connection String\nDATABASE_URL=${connStr}\n`;
    } else {
      envContent = envContent.replace(
        /DATABASE_URL=.*/g,
        `DATABASE_URL=${connStr}`
      );
    }
    
    writeFileSync(envPath, envContent);
    
    console.log('\n✅ env.production mis à jour avec la connection string fonctionnelle!');
    console.log(`   Format utilisé: ${formatName}\n`);
    
    console.log('✨ Configuration terminée!\n');
    console.log('📋 Prochaines étapes:');
    console.log('   1. Appliquer le schéma: npm run db:push:supabase');
    console.log('   2. Démarrer le serveur: npm run dev\n');
    
    process.exit(0);
    
  } catch (error: any) {
    console.log(`   ❌ Échec: ${error.message}\n`);
    
    if (i === formats.length - 1) {
      console.log('💡 Aucun format n\'a fonctionné. Solutions:\n');
      console.log('1. Vérifiez le format exact dans Supabase Dashboard:');
      console.log(`   https://supabase.com/dashboard/project/${projectRef}/settings/database\n`);
      console.log('2. Dans "Connection string", copiez la connection string complète (format URI)');
      console.log('3. Remplacez [YOUR-PASSWORD] par votre mot de passe');
      console.log('4. Ajoutez-la à env.production comme: DATABASE_URL=<connection-string>\n');
      console.log('5. Vérifiez que votre IP est autorisée dans Supabase\n');
    }
  }
}

