# FX Risk — Plateforme de Gestion des Risques de Change

**FX Risk** est une application web professionnelle conçue pour les institutions financières afin de gérer et de surveiller les risques liés aux opérations de change (Foreign Exchange).

Elle offre un environnement complet où différents rôles (Front Office, Back Office, Risk Team, Manager, Admin) peuvent interagir pour créer, valider et surveiller les transactions en temps réel.

---

## 🎯 Fonctionnalités Principales

- **Système de Rôles (RBAC)** : 5 rôles distincts (Front Office, Back Office, Risk Team, Manager, Admin) avec des permissions strictes.
- **Calcul Automatique des Risques** : Chaque opération reçoit un score de risque (0-100) calculé automatiquement en base de données selon plusieurs critères (montant élevé, absence de SWIFT, horaires atypiques, etc.).
- **Alertes en Temps Réel** : Génération immédiate d'alertes pour les transactions suspectes ou critiques.
- **Tableau de Bord Interactif** : Visualisation des tendances de risques sur 14 jours, répartition par devise, et fil d'actualité des alertes.
- **Traçabilité Complète** : Historique (Audit Log) de toutes les actions effectuées par les utilisateurs.

---

## 🛠️ Technologies Utilisées

- **Frontend** : React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend & Base de données** : Supabase (PostgreSQL, Authentification, Row Level Security)
- **Graphiques** : Recharts

---

## 🚀 Guide d'Installation Étape par Étape

Suivez ces étapes simples pour lancer le projet sur votre machine.

### Prérequis

- Avoir [Node.js](https://nodejs.org/) installé sur votre ordinateur.
- Avoir un compte [Supabase](https://supabase.com/) (gratuit).

### Étape 1 : Cloner et installer le projet

1. Ouvrez votre terminal et clonez le dossier (si ce n'est pas déjà fait).
2. Ouvrez le dossier du projet dans votre terminal :
   ```bash
   cd FX-Risk
   ```
3. Installez toutes les dépendances nécessaires en tapant :
   ```bash
   npm install
   ```

### Étape 2 : Configurer Supabase

1. Créez un nouveau projet sur Supabase.
2. Allez dans les paramètres de votre projet Supabase (**Project Settings > API**) pour trouver votre `Project URL` et votre `anon public key`.
3. Dans le dossier de votre projet sur votre ordinateur, créez un fichier nommé `.env` et collez-y vos identifiants comme ceci :
   ```env
   VITE_SUPABASE_URL=https://votre-projet.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=votre-clef-publique-anon
   ```

### Étape 3 : Configurer la base de données

1. Sur Supabase, allez dans le **SQL Editor**.
2. Copiez le contenu du fichier `supabase/migrations/20260518073627_9eb4f19f-59c9-44eb-866d-e2ca57fd3af7.sql` (qui se trouve dans votre dossier de projet).
3. Collez-le dans le SQL Editor de Supabase et cliquez sur **Run** pour créer toutes les tables et règles de sécurité.
4. _Important pour la démo_ : Allez dans **Authentication > Settings** sur Supabase, cherchez "Confirm email" ou "Enable email confirmations" et **décochez** cette option. Cela permet aux comptes démo de fonctionner immédiatement.

### Étape 4 : Lancer l'application

1. Dans votre terminal, lancez le serveur de développement :
   ```bash
   npm run dev
   ```
2. Ouvrez votre navigateur et allez sur `http://localhost:5173` (ou le lien affiché dans votre terminal).

---

## 👥 Comptes de Démo

Vous n'avez pas besoin de créer des comptes manuellement. Sur la page de connexion, utilisez les boutons "Quick Demo" pour vous connecter instantanément avec l'un des rôles préconfigurés.

Le mot de passe par défaut pour tous les comptes démo est : **`Demo!2026`**

- **Front Office** : `front@fxrisk.demo` (Saisit les opérations)
- **Back Office** : `back@fxrisk.demo` (Valide les opérations)
- **Analyste Risques** : `risk@fxrisk.demo` (Surveille les alertes)
- **Manager** : `manager@fxrisk.demo` (Approuve les exceptions)
- **Admin** : `admin@fxrisk.demo` (Accès total)
