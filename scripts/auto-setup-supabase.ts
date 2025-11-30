import { createClient } from '@supabase/supabase-js';
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
const SUPABASE_SERVICE_ROLE = envVars.SUPABASE_SERVICE_ROLE;
const DATABASE_URL = envVars.DATABASE_URL;

const projectRef = SUPABASE_URL?.replace('https://', '').replace('.supabase.co', '');

console.log('🚀 Supabase Auto-Setup\n');

// Check if DATABASE_URL is already set
if (DATABASE_URL && DATABASE_URL.includes('supabase')) {
  console.log('✅ DATABASE_URL is already configured for Supabase!');
  console.log(`   ${DATABASE_URL.replace(/:[^:@]+@/, ':***@')}\n`);
  
  // Test connection
  console.log('🧪 Testing database connection...');
  try {
    const pool = new Pool({ connectionString: DATABASE_URL });
    const result = await pool.query('SELECT version()');
    console.log('✅ Database connection successful!');
    console.log(`   PostgreSQL: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}\n`);
    
    // Check if tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log(`📊 Found ${tablesResult.rows.length} table(s) in database:`);
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
      console.log('');
    } else {
      console.log('📊 No tables found. Ready to push schema.\n');
    }
    
    await pool.end();
    
    console.log('✨ Setup complete! You can now:');
    console.log('   1. Run: npm run db:push:supabase (to push schema)');
    console.log('   2. Run: npm run dev (to start the server)\n');
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n💡 Please check:');
    console.log('   1. The connection string is correct');
    console.log('   2. Your IP is allowed in Supabase settings');
    console.log('   3. The project is active\n');
    process.exit(1);
  }
} else {
  console.log('⚠️  DATABASE_URL not configured for Supabase\n');
  console.log('📋 To configure:');
  console.log(`   1. Get your database password from: https://supabase.com/dashboard/project/${projectRef}/settings/database`);
  console.log('   2. Run: npx tsx scripts/fetch-supabase-db-password.ts <your-password>');
  console.log('   3. Or manually add to env.production:');
  console.log(`      DATABASE_URL=postgresql://postgres:<password>@db.${projectRef}.supabase.co:5432/postgres?sslmode=require\n`);
  process.exit(1);
}


