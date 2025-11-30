import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';

console.log('📝 Mise à jour de la connection string Supabase\n');

const connectionString = process.argv[2];

if (!connectionString) {
  console.log('❌ Veuillez fournir la connection string complète\n');
  console.log('Usage:');
  console.log('   npx tsx scripts/update-connection-string.ts "<connection-string>"\n');
  console.log('Exemple:');
  console.log('   npx tsx scripts/update-connection-string.ts "postgresql://postgres:password@host:5432/postgres?sslmode=require"\n');
  console.log('💡 Pour obtenir la connection string:');
  console.log('   1. Allez sur: https://supabase.com/dashboard/project/nglkgphezuuucjvfuguk/settings/database');
  console.log('   2. Cherchez "Connection string" ou "URI"');
  console.log('   3. Copiez la connection string complète\n');
  process.exit(1);
}

const envPath = join(process.cwd(), 'env.production');

// Update env.production
let envContent = readFileSync(envPath, 'utf-8');

// Remove old DATABASE_URL
envContent = envContent.replace(/DATABASE_URL=.*\n/g, '');

// Add new DATABASE_URL
if (!envContent.includes('DATABASE_URL=')) {
  envContent += `\n# Database Connection String\nDATABASE_URL=${connectionString}\n`;
} else {
  envContent = envContent.replace(
    /DATABASE_URL=.*/g,
    `DATABASE_URL=${connectionString}`
  );
}

writeFileSync(envPath, envContent);

console.log('✅ DATABASE_URL mis à jour dans env.production\n');

// Test connection
console.log('🧪 Test de connexion...');
try {
  const pool = new Pool({ 
    connectionString,
    connectionTimeoutMillis: 10000,
    ssl: { rejectUnauthorized: false },
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
  
  console.log('\n✨ Configuration terminée!\n');
  console.log('📋 Prochaines étapes:');
  console.log('   1. Appliquer le schéma: npm run db:push:supabase');
  console.log('   2. Démarrer le serveur: npm run dev\n');
  
} catch (error: any) {
  console.error('❌ Échec de la connexion:', error.message);
  console.log('\n💡 Vérifiez:');
  console.log('   1. La connection string est correcte');
  console.log('   2. Votre IP est autorisée dans Supabase');
  console.log('   3. Le projet est actif\n');
  process.exit(1);
}


