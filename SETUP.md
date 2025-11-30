# Guide de démarrage rapide - TanaBlackoutWatch

## Prérequis
- Node.js installé
- Un projet Supabase configuré avec les tables créées

## Configuration Supabase

Le projet utilise Supabase comme base de données. Assurez-vous que :

1. **Les tables sont créées** dans Supabase :
   - `neighborhoods`
   - `outages`

2. **Le fichier `env.production` est configuré** avec :
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE`

## Lancer le projet

### 1. Installer les dépendances

```bash
npm install
```

### 2. Vérifier la configuration Supabase

```bash
npm run db:test
```

Cette commande vérifie que les tables existent et sont accessibles.

### 3. Démarrer le serveur de développement

```bash
npm run dev
```

Le serveur démarre sur http://localhost:5000

Les données seront automatiquement initialisées au démarrage si les tables sont vides.

## Commandes utiles

- `npm run dev` - Lancer le serveur de développement
- `npm run build` - Construire le projet pour la production
- `npm run db:test` - Vérifier la connexion à Supabase
- `npm run db:wait-cache` - Attendre le rafraîchissement du cache PostgREST

## Dépannage

### Erreur de connexion à Supabase

- Vérifiez que `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE` sont corrects dans `env.production`
- Vérifiez que les tables existent dans Supabase
- Attendez 1-2 minutes si les tables viennent d'être créées (cache PostgREST)

### Tables non trouvées

Si vous voyez "Could not find the table", attendez quelques minutes pour que le cache PostgREST se rafraîchisse, puis :

```bash
npm run db:wait-cache
```
