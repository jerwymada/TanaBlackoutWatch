import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
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
const SUPABASE_SERVICE_ROLE = envVars.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE manquant');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log('🌱 Injection de 19 exemples dans Supabase\n');
console.log('═══════════════════════════════════════════════════════\n');

// 19 exemples de neighborhoods
const neighborhoods = [
  { name: "Analakely", district: "1er Arrondissement" },
  { name: "Antaninarenina", district: "1er Arrondissement" },
  { name: "Isoraka", district: "1er Arrondissement" },
  { name: "Ambohijatovo", district: "2ème Arrondissement" },
  { name: "Ankazomanga", district: "2ème Arrondissement" },
  { name: "Besarety", district: "2ème Arrondissement" },
  { name: "Ankorondrano", district: "3ème Arrondissement" },
  { name: "Andraharo", district: "3ème Arrondissement" },
  { name: "Ivandry", district: "3ème Arrondissement" },
  { name: "Ankadifotsy", district: "4ème Arrondissement" },
  { name: "Ambanidia", district: "4ème Arrondissement" },
  { name: "Mahazo", district: "4ème Arrondissement" },
  { name: "Andoharanofotsy", district: "5ème Arrondissement" },
  { name: "Ankazobe", district: "5ème Arrondissement" },
  { name: "Itaosy", district: "5ème Arrondissement" },
  { name: "Ambohimanarina", district: "6ème Arrondissement" },
  { name: "Andranomena", district: "6ème Arrondissement" },
  { name: "67 Ha", district: "6ème Arrondissement" },
  { name: "Anosy", district: "1er Arrondissement" },
];

// Patterns de coupures pour générer des exemples
const outagePatterns = [
  [{ start: 6, end: 10 }],
  [{ start: 8, end: 12 }],
  [{ start: 10, end: 14 }],
  [{ start: 12, end: 16 }],
  [{ start: 14, end: 18 }],
  [{ start: 16, end: 20 }],
  [{ start: 6, end: 9 }, { start: 18, end: 21 }],
  [{ start: 7, end: 11 }, { start: 15, end: 18 }],
  [{ start: 9, end: 13 }],
  [{ start: 11, end: 15 }],
  [{ start: 5, end: 8 }, { start: 17, end: 20 }],
  [{ start: 6, end: 10 }, { start: 14, end: 17 }],
  [],
  [{ start: 8, end: 11 }],
  [{ start: 13, end: 17 }],
  [{ start: 7, end: 10 }, { start: 16, end: 19 }],
  [{ start: 9, end: 12 }],
  [{ start: 15, end: 19 }],
  [{ start: 4, end: 7 }],
];

async function seedExamples() {
  try {
    console.log('🔍 Vérification des données existantes...\n');
    
    // Vérifier les neighborhoods existants
    const { data: existingNeighborhoods, error: nError } = await supabase
      .from('neighborhoods')
      .select('*');
    
    if (nError && nError.code !== 'PGRST116' && nError.code !== '42P01') {
      throw nError;
    }
    
    const existingCount = existingNeighborhoods?.length || 0;
    console.log(`📊 ${existingCount} neighborhood(s) existant(s)\n`);
    
    if (existingCount > 0) {
      console.log('⚠️  Des données existent déjà.\n');
      console.log('💡 Voulez-vous:');
      console.log('   1. Ajouter les 19 exemples (doublons possibles)');
      console.log('   2. Remplacer toutes les données');
      console.log('   3. Annuler\n');
      
      // Pour l'instant, on ajoute simplement
      console.log('📦 Ajout des 19 exemples...\n');
    } else {
      console.log('📦 Insertion des 19 neighborhoods...\n');
    }
    
    // Insérer les neighborhoods
    const neighborhoodsToInsert = neighborhoods.map(n => ({
      name: n.name,
      district: n.district,
    }));
    
    const { data: insertedNeighborhoods, error: insertError } = await supabase
      .from('neighborhoods')
      .insert(neighborhoodsToInsert)
      .select();
    
    if (insertError) {
      // Si erreur de doublon, récupérer les neighborhoods existants
      if (insertError.code === '23505' || insertError.message.includes('duplicate')) {
        console.log('⚠️  Certains neighborhoods existent déjà, récupération des données...\n');
        const { data: allNeighborhoods } = await supabase
          .from('neighborhoods')
          .select('*')
          .order('id');
        
        if (allNeighborhoods && allNeighborhoods.length >= 19) {
          console.log(`✅ ${allNeighborhoods.length} neighborhoods disponibles\n`);
          await insertOutages(allNeighborhoods);
          return;
        }
      }
      throw insertError;
    }
    
    if (!insertedNeighborhoods || insertedNeighborhoods.length === 0) {
      // Récupérer les neighborhoods existants
      const { data: allNeighborhoods } = await supabase
        .from('neighborhoods')
        .select('*')
        .order('id');
      
      if (allNeighborhoods && allNeighborhoods.length > 0) {
        console.log(`✅ ${allNeighborhoods.length} neighborhoods disponibles\n`);
        await insertOutages(allNeighborhoods);
        return;
      }
    }
    
    console.log(`✅ ${insertedNeighborhoods?.length || 0} neighborhood(s) inséré(s)\n`);
    
    // Récupérer tous les neighborhoods (y compris ceux qui existaient déjà)
    const { data: allNeighborhoods } = await supabase
      .from('neighborhoods')
      .select('*')
      .order('id');
    
    if (!allNeighborhoods || allNeighborhoods.length === 0) {
      throw new Error('Aucun neighborhood trouvé après insertion');
    }
    
    await insertOutages(allNeighborhoods);
    
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

async function insertOutages(neighborhoods: any[]) {
  console.log('📦 Insertion des outages pour les 19 neighborhoods...\n');
  
  // Générer des dates (14 jours passés + 7 jours futurs)
  const today = new Date();
  const dates: string[] = [];
  for (let i = -14; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  const outagesToInsert: any[] = [];
  
  // Pour chaque neighborhood, générer des outages selon le pattern
  for (let i = 0; i < Math.min(neighborhoods.length, 19); i++) {
    const neighborhood = neighborhoods[i];
    const patternIndex = i % outagePatterns.length;
    const pattern = outagePatterns[patternIndex];
    
    // Pour chaque date
    for (const dateStr of dates) {
      // Pour chaque slot dans le pattern
      for (const slot of pattern) {
        outagesToInsert.push({
          neighborhood_id: neighborhood.id,
          date: dateStr,
          start_hour: slot.start,
          end_hour: slot.end,
          reason: null,
        });
      }
    }
  }
  
  console.log(`   ${outagesToInsert.length} outage(s) à insérer...\n`);
  
  // Insérer par lots de 100 pour éviter les limites
  const batchSize = 100;
  let inserted = 0;
  
  for (let i = 0; i < outagesToInsert.length; i += batchSize) {
    const batch = outagesToInsert.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('outages')
      .insert(batch);
    
    if (error) {
      if (error.code === '23505' || error.message.includes('duplicate')) {
        console.log(`   ⚠️  Lot ${Math.floor(i / batchSize) + 1}: certains doublons ignorés`);
      } else {
        console.log(`   ⚠️  Lot ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      }
    } else {
      inserted += batch.length;
      console.log(`   ✅ Lot ${Math.floor(i / batchSize) + 1}: ${batch.length} outage(s) inséré(s)`);
    }
  }
  
  console.log(`\n✅ ${inserted} outage(s) inséré(s) au total\n`);
  
  // Vérification finale
  const { count: finalNCount } = await supabase
    .from('neighborhoods')
    .select('*', { count: 'exact', head: true });
  
  const { count: finalOCount } = await supabase
    .from('outages')
    .select('*', { count: 'exact', head: true });
  
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('✨ Injection terminée!\n');
  console.log('📊 Statistiques finales:');
  console.log(`   Neighborhoods: ${finalNCount || 0}`);
  console.log(`   Outages: ${finalOCount || 0}\n`);
}

async function main() {
  await seedExamples();
}

main();

