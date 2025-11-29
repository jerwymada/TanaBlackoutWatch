# Guide de démarrage rapide - TanaBlackoutWatch

## Prérequis
- Node.js installé
- Docker Desktop installé et démarré

## Étapes pour lancer le projet en local

### 1. Démarrer Docker Desktop
Assurez-vous que Docker Desktop est en cours d'exécution sur votre machine.

### 2. Démarrer la base de données PostgreSQL
```bash
npm run db:start
```
Cette commande démarre un conteneur PostgreSQL avec Docker.

### 3. Attendre que la base de données soit prête
Attendez quelques secondes que PostgreSQL soit complètement démarré.

### 4. Créer le schéma de base de données
```bash
npm run db:push
```
Cette commande crée les tables nécessaires dans la base de données.

### 5. Configurer la variable d'environnement DATABASE_URL

**Option A : Créer un fichier .env** (recommandé)
Créez un fichier `.env` à la racine du projet avec :
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tanablackoutwatch
PORT=5000
```

**Option B : Définir la variable dans le terminal**
```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tanablackoutwatch"
```

### 6. Lancer le serveur de développement
```bash
npm run dev
```

Le serveur devrait démarrer sur http://localhost:5000

## Commandes utiles

- `npm run db:start` - Démarrer la base de données
- `npm run db:stop` - Arrêter la base de données
- `npm run db:reset` - Réinitialiser la base de données (supprime toutes les données)
- `npm run dev` - Lancer le serveur de développement
- `npm run build` - Construire le projet pour la production

## Dépannage

### Le serveur ne démarre pas
- Vérifiez que Docker Desktop est en cours d'exécution
- Vérifiez que la base de données est démarrée : `docker ps`
- Vérifiez que DATABASE_URL est correctement défini

### Erreur de connexion à la base de données
- Assurez-vous que le conteneur PostgreSQL est en cours d'exécution : `docker ps`
- Vérifiez les logs : `docker-compose logs postgres`
- Redémarrez la base de données : `npm run db:reset`

