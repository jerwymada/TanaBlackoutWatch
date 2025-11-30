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
  console.error('❌ Could not read env.production file');
  process.exit(1);
}

const SUPABASE_URL = envVars.SUPABASE_URL;
const projectRef = SUPABASE_URL?.replace('https://', '').replace('.supabase.co', '');

console.log('🔍 Guide pour obtenir la connection string Supabase\n');

console.log('📋 D\'après votre capture d\'écran, voici comment procéder:\n');

console.log('✅ Méthode 1 - Réinitialiser le mot de passe (Le plus simple):');
console.log('   1. Sur la page "Database Settings" où vous êtes actuellement');
console.log('   2. Dans la section "Database password"');
console.log('   3. Cliquez sur le bouton "Reset database password"');
console.log('   4. Un nouveau mot de passe sera généré et affiché');
console.log('   5. ⚠️  COPIEZ-LE IMMÉDIATEMENT (il ne sera plus visible après)');
console.log('   6. Utilisez ce mot de passe pour construire la connection string\n');

console.log('✅ Méthode 2 - Chercher dans les onglets:');
console.log(`   1. Sur la page: https://supabase.com/dashboard/project/${projectRef}/settings/database`);
console.log('   2. Cherchez un onglet ou une section nommée:');
console.log('      - "Connection string"');
console.log('      - "Connection info"');
console.log('      - "Connection parameters"');
console.log('      - "Database URL"');
console.log('   3. Il peut y avoir plusieurs formats (URI, JDBC, etc.)');
console.log('   4. Sélectionnez "URI" qui contient la connection string complète\n');

console.log('✅ Méthode 3 - Via l\'API REST (si vous avez un access token):');
console.log('   La connection string peut être récupérée via l\'API Management');
console.log('   Mais cela nécessite un access token Supabase\n');

console.log('📝 Une fois que vous avez le mot de passe:\n');

console.log('Option A - Utiliser le script automatique:');
console.log('   npx tsx scripts/fetch-supabase-db-password.ts <votre-mot-de-passe>\n');

console.log('Option B - Ajouter manuellement à env.production:');
console.log('   Ajoutez cette ligne:');
console.log(`   DATABASE_URL=postgresql://postgres:[VOTRE-MOT-DE-PASSE]@db.${projectRef}.supabase.co:5432/postgres?sslmode=require\n`);

console.log('💡 Format de la connection string:');
console.log(`   postgresql://postgres:[PASSWORD]@db.${projectRef}.supabase.co:5432/postgres?sslmode=require\n`);

console.log('🔄 Après configuration:');
console.log('   1. Testez la connexion: npm run db:test:supabase');
console.log('   2. Appliquez le schéma: npm run db:push:supabase\n');

console.log('📚 Ressources:');
console.log(`   - Dashboard: https://supabase.com/dashboard/project/${projectRef}/settings/database`);
console.log('   - Documentation: https://supabase.com/docs/guides/database/connecting-to-postgres\n');


