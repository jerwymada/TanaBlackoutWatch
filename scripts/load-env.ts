import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables from env.production
const envPath = join(process.cwd(), 'env.production');

try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (key && value && !process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });
} catch (error) {
  console.error('⚠️  Could not read env.production file');
}


