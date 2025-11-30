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

console.log('🚀 Configuration rapide Supabase\n');

// Check if password is provided as argument
const password = process.argv[2];

if (!password) {
  console.log('📋 Instructions:\n');
  console.log('1. Allez sur la page Database Settings de Supabase');
  console.log('2. Dans "Database password", cliquez sur "Reset database password"');
  console.log('3. Copiez le nouveau mot de passe affiché');
  console.log('4. Exécutez cette commande avec le mot de passe:\n');
  console.log(`   npx tsx scripts/quick-setup-supabase.ts <votre-mot-de-passe>\n`);
  console.log('💡 Ou ajoutez manuellement à env.production:');
  console.log(`   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.${projectRef}.supabase.co:5432/postgres?sslmode=require\n`);
  process.exit(0);
}

// Construct connection string
const connectionString = `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`;

console.log('🔧 Configuration de la connection string...\n');

// Update env.production
let envContent = readFileSync(envPath, 'utf-8');

// Check if DATABASE_URL already exists
if (envContent.includes('DATABASE_URL=')) {
  // Replace existing DATABASE_URL
  envContent = envContent.replace(
    /DATABASE_URL=.*/g,
    `DATABASE_URL=${connectionString}`
  );
  console.log('✅ DATABASE_URL mis à jour dans env.production');
} else {
  // Add DATABASE_URL
  envContent += `\n# Database Connection\nDATABASE_URL=${connectionString}\n`;
  console.log('✅ DATABASE_URL ajouté à env.production');
}

writeFileSync(envPath, envContent);

console.log(`\n📋 Connection string configurée: ${connectionString.replace(/:[^:@]+@/, ':***@')}\n`);

// Test connection
console.log('🧪 Test de connexion à Supabase...');
try {
  const pool = new Pool({ connectionString });
  const result = await pool.query('SELECT version()');
  console.log('✅ Connexion réussie!');
  console.log(`   PostgreSQL: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}\n`);
  
  // Check if tables exist
  const tablesResult = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
  `);
  
  if (tablesResult.rows.length > 0) {
    console.log(`📊 ${tablesResult.rows.length} table(s) trouvée(s) dans la base de données:`);
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    console.log('');
  } else {
    console.log('📊 Aucune table trouvée. Prêt à appliquer le schéma.\n');
  }
  
  await pool.end();
  
  console.log('✨ Configuration terminée!\n');
  console.log('📋 Prochaines étapes:');
  console.log('   1. Appliquer le schéma: npm run db:push:supabase');
  console.log('   2. Démarrer le serveur: npm run dev\n');
  
} catch (error: any) {
  console.error('❌ Échec de la connexion:', error.message);
  console.log('\n💡 Vérifiez:');
  console.log('   1. Le mot de passe est correct');
  console.log('   2. Votre IP est autorisée dans Supabase (Settings > Database > Connection Pooling)');
  console.log('   3. Le projet Supabase est actif\n');
  process.exit(1);
}


