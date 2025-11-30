import { readFileSync } from 'fs';
import { join } from 'path';
import * as readline from 'readline';

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
const DATABASE_URL = envVars.DATABASE_URL;

console.log('🔍 Assistant de configuration Connection String Supabase\n');
console.log('═══════════════════════════════════════════════════════\n');

if (!SUPABASE_URL) {
  console.error('❌ SUPABASE_URL manquant dans env.production');
  process.exit(1);
}

const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');

console.log(`📋 Projet Supabase: ${projectRef}`);
console.log(`🔗 URL: ${SUPABASE_URL}\n`);

// Extraire le mot de passe actuel si disponible
let currentPassword = '';
if (DATABASE_URL) {
  const match = DATABASE_URL.match(/:[^:@]+@/);
  if (match) {
    currentPassword = match[0].slice(1, -1);
    console.log('✅ Mot de passe trouvé dans env.production (masqué pour sécurité)');
  }
}

console.log('\n📝 Instructions pour trouver votre connection string:\n');
console.log('1. Ouvrez le dashboard Supabase:');
console.log(`   https://app.supabase.com/project/${projectRef}/settings/database\n`);
console.log('2. Cherchez une de ces sections:');
console.log('   - "Connection string"');
console.log('   - "Connection pooling"');
console.log('   - "Database URL"');
console.log('   - "PostgreSQL connection"\n');
console.log('3. Si vous voyez un champ avec [YOUR-PASSWORD] ou des étoiles:');
console.log('   - Cliquez sur "Reveal" ou "Show" pour afficher le mot de passe\n');
console.log('4. Si vous ne trouvez pas la connection string complète:');
console.log('   - Cherchez uniquement le "Database password"');
console.log('   - Je vais vous aider à construire la connection string\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════\n');
  console.log('💬 Avez-vous trouvé votre mot de passe de base de données ?\n');
  console.log('   Options:');
  console.log('   1. Oui, j\'ai le mot de passe');
  console.log('   2. Non, je ne trouve pas');
  console.log('   3. J\'ai la connection string complète\n');
  
  const choice = await askQuestion('Votre choix (1/2/3): ');
  
  if (choice === '1') {
    const password = await askQuestion('\n🔑 Entrez le mot de passe de la base de données: ');
    
    if (!password || password.trim() === '') {
      console.log('\n❌ Mot de passe vide');
      rl.close();
      process.exit(1);
    }
    
    // Construire la connection string
    const connectionString = `postgresql://postgres:${password.trim()}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`;
    
    console.log('\n✅ Connection string construite:\n');
    console.log(connectionString.replace(/:[^:@]+@/, ':***@'));
    console.log('\n💾 Voulez-vous mettre à jour env.production ? (o/n): ');
    
    const update = await askQuestion('');
    
    if (update.toLowerCase() === 'o' || update.toLowerCase() === 'oui' || update.toLowerCase() === 'y' || update.toLowerCase() === 'yes') {
      try {
        let envContent = readFileSync(envPath, 'utf-8');
        envContent = envContent.replace(
          /DATABASE_URL=.*/g,
          `DATABASE_URL=${connectionString}`
        );
        require('fs').writeFileSync(envPath, envContent);
        console.log('\n✅ env.production mis à jour avec succès!\n');
        console.log('🧪 Vous pouvez maintenant tester la connexion:');
        console.log('   npm run db:test:supabase\n');
      } catch (error) {
        console.log('\n❌ Erreur lors de la mise à jour du fichier');
      }
    }
    
  } else if (choice === '2') {
    console.log('\n📋 Guide détaillé:\n');
    console.log('1. Allez sur: https://app.supabase.com/project/' + projectRef + '/settings/database');
    console.log('2. Cherchez une section qui contient:');
    console.log('   - "Database password"');
    console.log('   - "Reset database password"');
    console.log('   - Un bouton "Reveal" ou "Show"');
    console.log('3. Si vous ne trouvez toujours pas:');
    console.log('   - Cliquez sur "Reset database password"');
    console.log('   - Copiez le nouveau mot de passe');
    console.log('   - Revenez ici et choisissez l\'option 1\n');
    console.log('💡 Alternative: Utilisez l\'API Supabase directement');
    console.log('   (déjà configurée dans votre projet)\n');
    
  } else if (choice === '3') {
    const fullConnectionString = await askQuestion('\n📋 Collez la connection string complète: ');
    
    if (!fullConnectionString || fullConnectionString.trim() === '') {
      console.log('\n❌ Connection string vide');
      rl.close();
      process.exit(1);
    }
    
    console.log('\n💾 Voulez-vous mettre à jour env.production ? (o/n): ');
    const update = await askQuestion('');
    
    if (update.toLowerCase() === 'o' || update.toLowerCase() === 'oui' || update.toLowerCase() === 'y' || update.toLowerCase() === 'yes') {
      try {
        let envContent = readFileSync(envPath, 'utf-8');
        envContent = envContent.replace(
          /DATABASE_URL=.*/g,
          `DATABASE_URL=${fullConnectionString.trim()}`
        );
        require('fs').writeFileSync(envPath, envContent);
        console.log('\n✅ env.production mis à jour avec succès!\n');
        console.log('🧪 Vous pouvez maintenant tester la connexion:');
        console.log('   npm run db:test:supabase\n');
      } catch (error) {
        console.log('\n❌ Erreur lors de la mise à jour du fichier');
      }
    }
  } else {
    console.log('\n❌ Choix invalide');
  }
  
  rl.close();
}

main().catch(console.error);


