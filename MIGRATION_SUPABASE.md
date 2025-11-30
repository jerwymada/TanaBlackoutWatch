# Migration vers Supabase

Ce guide explique comment migrer la base de données de PostgreSQL local (Docker) vers Supabase.

## 📋 Prérequis

1. Un projet Supabase créé
2. Les credentials Supabase dans `env.production`
3. Le mot de passe de la base de données Supabase

## 🚀 Étapes de migration

### 1. Récupérer le mot de passe de la base de données

1. Allez sur le [Dashboard Supabase](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **Settings** > **Database**
4. Dans la section **Connection string**, cliquez sur **Reveal** pour afficher le mot de passe
5. Copiez le mot de passe

### 2. Configurer la connection string

**Option A : Utiliser le script automatique**

```bash
npx tsx scripts/fetch-supabase-db-password.ts <votre-mot-de-passe>
```

**Option B : Configuration manuelle**

Ajoutez à `env.production` :

```env
DATABASE_URL=postgresql://postgres:[VOTRE-MOT-DE-PASSE]@db.nglkgphezuuucjvfuguk.supabase.co:5432/postgres?sslmode=require
```

Remplacez `[VOTRE-MOT-DE-PASSE]` par votre mot de passe.

### 3. Tester la connexion

```bash
npm run db:test:supabase
```

Ce script va :
- Vérifier que `DATABASE_URL` est configuré
- Tester la connexion à Supabase
- Afficher les tables existantes (s'il y en a)

### 4. Appliquer le schéma de base de données

```bash
npm run db:push:supabase
```

Cette commande va créer toutes les tables nécessaires dans Supabase.

### 5. Migrer les données (optionnel)

Si vous avez des données dans votre base locale, vous pouvez les exporter et les importer :

```bash
# Exporter depuis la base locale
pg_dump -h localhost -U postgres -d tanablackoutwatch > backup.sql

# Importer dans Supabase (remplacez [CONNECTION_STRING] par votre DATABASE_URL)
psql "[CONNECTION_STRING]" < backup.sql
```

### 6. Vérifier la migration

```bash
npm run db:test:supabase
```

Vous devriez voir les tables créées.

## 🔧 Configuration du développement

### Utiliser Supabase en développement

1. Configurez `DATABASE_URL` dans `env.production` (comme ci-dessus)
2. Lancez le serveur :

```bash
npm run dev
```

Le serveur utilisera automatiquement Supabase si `DATABASE_URL` pointe vers Supabase.

### Utiliser PostgreSQL local en développement

1. Démarrez Docker :

```bash
npm run db:start
```

2. Configurez `DATABASE_URL` pour pointer vers localhost :

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tanablackoutwatch
```

3. Lancez le serveur :

```bash
npm run dev
```

## 📝 Scripts disponibles

- `npm run supabase:setup` - Affiche les informations de connexion Supabase
- `npm run supabase:configure <password>` - Configure automatiquement `DATABASE_URL`
- `npm run db:test:supabase` - Teste la connexion à Supabase
- `npm run db:push:supabase` - Applique le schéma sur Supabase
- `npm run db:push` - Applique le schéma sur la base locale

## 🔒 Sécurité

⚠️ **Important** : Ne commitez jamais `env.production` avec le mot de passe dans le repository.

- Le fichier `env.production` est déjà dans `.gitignore`
- Utilisez `.env.example` comme template
- Pour la production, utilisez des variables d'environnement sécurisées

## 🐛 Dépannage

### Erreur de connexion

1. Vérifiez que le mot de passe est correct
2. Vérifiez que votre IP est autorisée dans Supabase (Settings > Database > Connection Pooling)
3. Vérifiez que le projet Supabase est actif

### Erreur SSL

Assurez-vous que la connection string inclut `?sslmode=require` à la fin.

### Tables non créées

1. Vérifiez que `DATABASE_URL` est correctement configuré
2. Exécutez `npm run db:push:supabase` à nouveau
3. Vérifiez les logs pour les erreurs

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Connection Pooling Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)


