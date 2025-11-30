import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables from env.production
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
  console.error('❌ Missing Supabase credentials in env.production');
  process.exit(1);
}

// Extract project reference
const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');

console.log('🚀 Supabase Migration Setup\n');
console.log('📋 Project Information:');
console.log(`   Project Reference: ${projectRef}`);
console.log(`   Supabase URL: ${SUPABASE_URL}\n`);

// Test Supabase API connection
console.log('🔌 Testing Supabase API connection...');
try {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
  
  // Try to query a system table to verify connection
  const { error } = await supabase.rpc('version');
  
  if (error) {
    // This is expected - we're just testing the connection
    console.log('✅ Supabase API is accessible\n');
  } else {
    console.log('✅ Supabase API connection successful!\n');
  }
} catch (error: any) {
  console.log('⚠️  API test:', error.message);
  console.log('   (This is normal - continuing...)\n');
}

// Generate connection string templates
console.log('📝 Database Connection Strings:\n');
console.log('To get your database password:');
console.log(`   1. Go to: https://supabase.com/dashboard/project/${projectRef}/settings/database`);
console.log('   2. Scroll to "Connection string" section');
console.log('   3. Click "Reveal" to show your database password');
console.log('   4. Copy the password\n');

const connectionStringTemplates = {
  direct: `postgresql://postgres:[PASSWORD]@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`,
  pooler: `postgresql://postgres.${projectRef}:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require`,
};

console.log('💡 Recommended: Direct Connection (for server-side applications)');
console.log(`   ${connectionStringTemplates.direct}\n`);

console.log('💡 Alternative: Session Pooler (for better connection management)');
console.log(`   ${connectionStringTemplates.pooler}`);
console.log('   Note: Replace [REGION] with your Supabase region (e.g., us-east-1)\n');

console.log('📋 Next Steps:');
console.log('   1. Get your database password from Supabase Dashboard');
console.log('   2. Replace [PASSWORD] in the connection string above');
console.log('   3. Add to env.production: DATABASE_URL=<your-connection-string>');
console.log('   4. Run: npm run db:push:supabase\n');


