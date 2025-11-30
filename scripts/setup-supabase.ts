import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
const envPath = join(process.cwd(), 'env.production');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (key && value) {
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  console.error('Could not read env.production file');
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('Missing Supabase credentials in env.production');
  process.exit(1);
}

// Extract project reference from URL
const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');

console.log('🔍 Supabase Project Reference:', projectRef);

// Supabase connection string formats
// Note: Database password is not available via API for security reasons
// It must be retrieved from Supabase Dashboard > Settings > Database > Connection string

const connectionStrings = {
  // Direct connection (recommended for server-side)
  direct: `postgresql://postgres:[YOUR-PASSWORD]@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`,
  
  // Pooler connection (recommended for serverless/server-side with connection pooling)
  pooler: `postgresql://postgres.${projectRef}:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require`,
  
  // Transaction pooler (for better performance)
  transactionPooler: `postgresql://postgres.${projectRef}:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require`,
};

console.log('\n📋 Connection String Templates:');
console.log('\n1. Direct Connection (Port 5432):');
console.log(connectionStrings.direct);
console.log('\n2. Session Pooler (Port 6543):');
console.log(connectionStrings.pooler);
console.log('\n3. Transaction Pooler (Port 5432):');
console.log(connectionStrings.transactionPooler);

console.log('\n📝 Instructions:');
console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/' + projectRef);
console.log('2. Navigate to: Settings > Database');
console.log('3. Find "Connection string" section');
console.log('4. Copy the "URI" connection string');
console.log('5. Replace [YOUR-PASSWORD] in the connection string above with your database password');
console.log('\n💡 Tip: The password is shown in the dashboard when you click "Reveal"');

// Test Supabase API connection
console.log('\n🔌 Testing Supabase API connection...');
try {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
  
  // Test API connection by making a simple request
  const { data, error } = await supabase.from('_realtime').select('count').limit(1);
  
  if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist" which is OK
    console.log('⚠️  API connection test:', error.message);
  } else {
    console.log('✅ Supabase API connection successful!');
  }
} catch (error: any) {
  console.log('⚠️  API connection test failed:', error.message);
}

console.log('\n✨ Next steps:');
console.log('1. Get your database password from Supabase Dashboard');
console.log('2. Update env.production with: DATABASE_URL=<your-connection-string>');
console.log('3. Run: npm run db:push:supabase');
console.log('4. Test connection: npm run db:test:supabase');


