# Comment obtenir la connection string exacte depuis Supabase

## 📋 Étapes

1. **Allez sur le dashboard Supabase** :
   https://supabase.com/dashboard/project/nglkgphezuuucjvfuguk/settings/database

2. **Cherchez la section "Connection string"** ou "Connection info"
   - Elle peut être dans un onglet séparé
   - Ou dans une section déroulante

3. **Sélectionnez le format "URI"** ou "Connection string"
   - Il y a généralement plusieurs formats (URI, JDBC, etc.)
   - Choisissez "URI" qui ressemble à : `postgresql://postgres:...@...`

4. **Copiez la connection string complète**
   - Elle devrait contenir déjà le mot de passe
   - Format: `postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres?sslmode=require`

5. **Ajoutez-la à env.production** :
   ```
   DATABASE_URL=<la-connection-string-copiée>
   ```

## 🔍 Où trouver la connection string ?

La connection string peut être dans différentes sections selon votre version de Supabase :

- **Settings > Database > Connection string**
- **Settings > Database > Connection info**  
- **Settings > Database > Connection pooling > Connection string**
- Un onglet "Connection string" dans la page Database Settings

## ⚠️ Important

- La connection string doit contenir le mot de passe
- Elle doit inclure `?sslmode=require` à la fin
- Le format peut varier selon votre région Supabase


