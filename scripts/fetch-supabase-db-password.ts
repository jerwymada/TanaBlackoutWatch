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
  console.error('❌ Could not read env.production file');
  process.exit(1);
}

const SUPABASE_URL = envVars.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = envVars.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');

console.log('🔍 Attempting to fetch database connection info...\n');

// Try to use Supabase Management API
// Note: Database password is not available via API for security reasons
// We'll need to construct the connection string manually

console.log('⚠️  Database password cannot be retrieved via API for security reasons.');
console.log('📋 Please follow these steps:\n');

console.log(`1. Open: https://supabase.com/dashboard/project/${projectRef}/settings/database`);
console.log('2. Scroll to "Connection string" section');
console.log('3. Find "Connection pooling" > "Session mode"');
console.log('4. Copy the connection string (it includes the password)\n');

console.log('💡 Or use the "URI" format from the "Connection string" section\n');

// Construct the connection string template
const connectionString = `postgresql://postgres:[YOUR-PASSWORD]@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`;

console.log('📝 Connection string template:');
console.log(`   ${connectionString}\n`);

console.log('🔄 Once you have the password, you can:');
console.log('   1. Replace [YOUR-PASSWORD] in the connection string above');
console.log('   2. Add it to env.production as: DATABASE_URL=<connection-string>');
console.log('   3. Or run this script with the password as an argument\n');

// Check if password is provided as argument
const password = process.argv[2];
if (password) {
  const finalConnectionString = connectionString.replace('[YOUR-PASSWORD]', password);
  
  // Update env.production
  let envContent = readFileSync(envPath, 'utf-8');
  
  // Check if DATABASE_URL already exists
  if (envContent.includes('DATABASE_URL=')) {
    // Replace existing DATABASE_URL
    envContent = envContent.replace(
      /DATABASE_URL=.*/g,
      `DATABASE_URL=${finalConnectionString}`
    );
  } else {
    // Add DATABASE_URL
    envContent += `\n# Database Connection\nDATABASE_URL=${finalConnectionString}\n`;
  }
  
  writeFileSync(envPath, envContent);
  console.log('✅ DATABASE_URL has been added to env.production!');
  console.log(`\n📋 Connection string: ${finalConnectionString.replace(/:[^:@]+@/, ':***@')}\n`);
  
  // Test connection
  console.log('🧪 Testing database connection...');
  try {
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: finalConnectionString });
    const result = await pool.query('SELECT version()');
    console.log('✅ Database connection successful!');
    console.log(`   PostgreSQL version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}\n`);
    await pool.end();
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n💡 Please verify:');
    console.log('   1. The password is correct');
    console.log('   2. Your IP is allowed in Supabase (Settings > Database > Connection Pooling)');
    console.log('   3. The project is active\n');
  }
} else {
  console.log('💡 Tip: You can run this script with your password:');
  console.log(`   npx tsx scripts/fetch-supabase-db-password.ts <your-password>\n`);
}


