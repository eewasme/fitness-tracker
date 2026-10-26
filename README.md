# Fitness Tracker

Application web personnelle pour suivre :
- poids
- calories consommées
- calories brûlées
- pas
- sommeil
- activités sportives

## Architecture

- Interface : HTML / CSS / JavaScript
- Graphiques : Chart.js
- Base de données : Supabase PostgreSQL
- Authentification : Supabase Auth
- Pas de serveur à maintenir.

## Installation

### 1. Créer la base

Créer un projet sur Supabase, puis ouvrir **SQL Editor** et exécuter le contenu de `supabase.sql`.

### 2. Configurer l'application

Copier :

`config.example.js` → `config.js`

Puis mettre dans `config.js` :
- l'URL du projet Supabase
- la clé `anon` / `publishable`

Ne jamais utiliser la clé `service_role` dans cette application.

### 3. Tester

Ouvrir `index.html` dans un navigateur.

Pour une utilisation plus fiable, servir le dossier avec un petit serveur HTTP local, par exemple :

`python -m http.server 8080`

Puis ouvrir `http://localhost:8080`.

## Hébergement

Google Drive et Dropbox ne sont pas des hébergeurs web classiques pour une application HTML moderne.

Options recommandées :
1. héberger les fichiers statiques sur GitHub Pages, Netlify ou Cloudflare Pages ;
2. garder Supabase comme base de données ;
3. l'application peut alors être utilisée depuis PC, téléphone et tablette sans perdre les données.

Le projet reste très léger : quelques fichiers statiques, tandis que les données sont conservées dans PostgreSQL chez Supabase.

## Données

Une ligne `daily_metrics` correspond à une journée.
Les séances de sport sont dans `activities`.

Les politiques RLS font en sorte qu'un utilisateur ne puisse lire ou modifier que ses propres données.

## Améliorations possibles

- objectifs poids / pas / calories / sommeil
- moyenne mobile du poids
- bilan hebdomadaire
- export CSV/Excel
- import depuis Apple Health / Google Fit
- PWA installable sur smartphone
- notifications/rappels
- calories nettes
- IMC
