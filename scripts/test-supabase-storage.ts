import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { storage } from '../server/storage';

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
const SUPABASE_SERVICE_ROLE = envVars.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE manquant');
  process.exit(1);
}

console.log('🧪 Test du storage Supabase\n');
console.log('═══════════════════════════════════════════════════════\n');

async function testStorage() {
  try {
    console.log('1. Test: getNeighborhoods()...');
    const neighborhoods = await storage.getNeighborhoods();
    console.log(`   ✅ ${neighborhoods.length} neighborhood(s) trouvé(s)\n`);
    
    if (neighborhoods.length === 0) {
      console.log('📦 Initialisation des données...\n');
      await storage.seedData();
      console.log('✅ Données initialisées!\n');
      
      const neighborhoodsAfter = await storage.getNeighborhoods();
      console.log(`📊 ${neighborhoodsAfter.length} neighborhood(s) créé(s)\n`);
    }
    
    console.log('2. Test: getOutages()...');
    const outages = await storage.getOutages();
    console.log(`   ✅ ${outages.length} outage(s) trouvé(s)\n`);
    
    console.log('3. Test: getSchedules()...');
    const schedules = await storage.getSchedules();
    console.log(`   ✅ ${schedules.length} schedule(s) trouvé(s)\n`);
    
    console.log('4. Test: getAvailableDates()...');
    const dates = await storage.getAvailableDates();
    console.log(`   ✅ ${dates.length} date(s) disponible(s)\n`);
    
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('✨ Tous les tests sont passés!\n');
    console.log('📋 Le storage Supabase fonctionne correctement.\n');
    console.log('🚀 Vous pouvez maintenant démarrer le serveur:');
    console.log('   npm run dev\n');
    
  } catch (error: any) {
    console.error('❌ Erreur lors des tests:', error.message);
    console.error('\n💡 Vérifiez que:');
    console.error('   1. Les tables existent dans Supabase');
    console.error('   2. SUPABASE_URL et SUPABASE_SERVICE_ROLE sont corrects');
    console.error('   3. Le cache PostgREST est à jour (attendez quelques secondes)\n');
    process.exit(1);
  }
}

testStorage();


