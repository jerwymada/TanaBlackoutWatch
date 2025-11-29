#!/bin/bash

echo "Vérification de Docker Desktop..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
  if docker info > /dev/null 2>&1; then
    echo "✓ Docker est prêt!"
    echo "Démarrage du conteneur PostgreSQL..."
    npm run db:start
    if [ $? -eq 0 ]; then
      echo "✓ Base de données démarrée avec succès!"
      echo ""
      echo "Prochaines étapes:"
      echo "1. Attendez quelques secondes que PostgreSQL soit prêt"
      echo "2. Exécutez: npm run db:push"
      echo "3. Créez un fichier .env avec: DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tanablackoutwatch"
      echo "4. Exécutez: npm run dev"
      exit 0
    else
      echo "Erreur lors du démarrage du conteneur"
      exit 1
    fi
  fi
  attempt=$((attempt + 1))
  echo "Tentative $attempt/$max_attempts - Attente de Docker..."
  sleep 2
done

echo "❌ Docker Desktop n'a pas démarré dans les temps. Veuillez:"
echo "1. Vérifier que Docker Desktop est en cours d'exécution"
echo "2. Attendre qu'il soit complètement démarré (icône dans la barre des tâches)"
echo "3. Réessayer: npm run db:start"

