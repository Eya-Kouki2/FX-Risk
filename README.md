# FX Risk — Plateforme de Gestion des Risques de Change

**FX Risk** est une application web de supervision des risques opérationnels liés aux opérations de change Spot FX. Elle permet de créer, contrôler, classifier, valider et surveiller les opérations FX avec un workflow multi-rôles, un scoring automatique, des alertes, une cartographie dynamique, des rapports et un premier module prédictif.

L'objectif du projet est de fournir une plateforme claire pour les équipes Front Office, Back Office, Risk Team, Manager et Admin afin de réduire les risques opérationnels, améliorer la traçabilité et accélérer la prise de décision.

## Fonctionnalités principales

- **Gestion des opérations FX** : création, historique complet, consultation détaillée et suivi des statuts.
- **Annuaire clients** : liste des clients, profils clients et historique des opérations par client.
- **RBAC** : accès différencié selon les rôles `front_office`, `back_office`, `risk_team`, `manager`, `admin`.
- **Scoring automatique des risques** : calcul d'un `risk_score` de 0 à 100.
- **Classification automatique** : classement automatique en `low`, `moderate`, `high`, `critical`.
- **Détection automatique des anomalies** : montant élevé, SWIFT manquant ou invalide, horaire atypique, écart de taux, paire de devises inhabituelle.
- **Système d'alertes intelligentes** : alertes générées automatiquement avec sévérité, catégorie, message et état d'acquittement.
- **File de validation** : validation ou rejet des opérations en attente avec recherche et recommandations automatiques.
- **File d'approbation** : traitement des opérations critiques ou escaladées.
- **Tableau de bord KRI** : indicateurs clés de risque, open alerts, score moyen, exposition, tendances, opérations récentes.
- **Cartographie des risques** : matrice dynamique Probabilité x Impact.
- **Module prédictif des risques** : projection heuristique du risque moyen, exposition prévue, volume haut risque et recommandations prédictives.
- **Reporting** : génération de rapports PDF/CSV pour opérations, alertes et audit.
- **Journal d'audit** : traçabilité des actions importantes.
- **Temps réel** : rafraîchissement automatique des données grâce aux subscriptions Supabase.

## Rôles utilisateurs

| Rôle           | Description                                                           |
| -------------- | --------------------------------------------------------------------- |
| `front_office` | Crée les opérations FX et suit ses saisies.                           |
| `back_office`  | Contrôle, valide ou rejette les opérations en attente.                |
| `risk_team`    | Supervise les risques, les alertes, la cartographie et la validation. |
| `manager`      | Suit les risques globaux et traite les cas critiques ou escaladés.    |
| `admin`        | Dispose d'un accès complet à la plateforme et à l'administration.     |

## Workflow métier

1. Le Front Office crée une opération FX.
2. Supabase calcule automatiquement le score de risque et la classification.
3. Le système détecte les anomalies et génère les alertes nécessaires.
4. L'opération passe dans la **File de validation**.
5. Les équipes autorisées valident ou rejettent l'opération.
6. Les alertes, KRI, rapports, cartographie et prédictions se mettent à jour.
7. Les actions sont enregistrées dans le journal d'audit.

## Modules de l'application

### Tableau de bord

Le tableau de bord regroupe les principaux indicateurs de supervision :

- total des opérations
- opérations à risque élevé
- open alerts
- score moyen de risque
- opérations en attente de validation
- exposition opérationnelle
- tendance des risques sur 14 jours, 30 jours ou 12 mois
- distribution des risques
- opérations par paire de devises
- alertes actives

### Opérations FX

Ce module sert d'historique complet des opérations. Il permet de consulter les opérations, leurs montants, paires de devises, statuts, scores de risque et détails opérationnels.

### File de validation

La file de validation affiche les opérations en attente. Elle contient :

- recherche rapide par référence, client, contrepartie ou paire de devises
- score et niveau de risque
- recommandations automatiques
- actions `Valider` et `Rejeter`

Les recommandations automatiques proposent des contrôles comme :

- demander confirmation SWIFT
- vérifier le format SWIFT
- justifier l'écart de taux
- contrôler un montant élevé
- vérifier une opération hors horaires
- revoir une paire de devises inhabituelle

### File d'approbation

La file d'approbation est destinée aux décisions de niveau supérieur sur les opérations critiques ou escaladées. Elle permet d'approuver ou de rejeter les cas sensibles.

### Centre d'alertes

Le centre d'alertes affiche les alertes générées automatiquement. Les utilisateurs autorisés peuvent consulter les alertes, filtrer par sévérité et les acquitter.

### Cartographie des risques

La cartographie est dynamique. Elle construit une matrice Probabilité x Impact à partir des opérations courantes :

- probabilité basée sur le score de risque
- impact basé sur le montant
- cellules calculées automatiquement
- liste des opérations les plus risquées

### Prédiction des risques

Le module prédictif utilise l'historique récent des opérations pour projeter les risques à court terme. Il fournit :

- risque moyen prévu sur 7 jours
- tendance probable
- volume d'opérations à haut risque prévu
- exposition prévue
- niveau de confiance
- graphique risque observé vs risque prévu
- recommandations prédictives

Ce module est heuristique/statistique. Il ne remplace pas un modèle machine learning avancé, mais donne une première vision prédictive utile.

### Rapports

Le module de reporting génère des exports :

- rapport des opérations
- rapport des alertes
- rapport d'audit
- rapport d'exposition aux risques
- export PDF et CSV

### Journal d'audit

Le journal d'audit conserve les actions importantes :

- connexion / déconnexion
- création d'opération
- validation
- rejet
- acquittement d'alerte
- actions de supervision

## Scoring et détection d'anomalies

Le scoring est calculé automatiquement en base de données. Les critères utilisés incluent notamment :

- montant supérieur à un seuil important
- absence de référence SWIFT
- format SWIFT invalide
- opération créée hors horaires normaux
- écart entre taux saisi et taux de marché
- paire de devises inhabituelle

Le résultat est stocké dans :

- `risk_score`
- `risk_level`

## Technologies utilisées

- **Frontend** : React 19, TypeScript, Vite
- **Routing** : TanStack Router / TanStack Start
- **Data fetching** : TanStack React Query
- **Backend / Database** : Supabase, PostgreSQL, Auth, RLS
- **UI** : Tailwind CSS, shadcn/ui, Radix UI
- **Graphiques** : Recharts
- **PDF** : jsPDF, jsPDF AutoTable
- **Icônes** : Lucide React
- **Validation / formulaires** : Zod, React Hook Form

## Structure simplifiée

```text
src/
  components/              Composants UI et layout
  hooks/                   Hooks React, realtime invalidation
  integrations/supabase/   Client Supabase, middleware auth, types
  lib/                     Auth, risk helpers, PDF, seed, utils
  routes/                  Pages TanStack Router
supabase/
  migrations/              Schéma SQL, policies, triggers
  seed_operations.sql      Données de test
```

## Installation

### Prérequis

- Node.js
- npm
- Un projet Supabase

### Installer les dépendances

```bash
npm install
```

### Configurer l'environnement

Créez un fichier `.env` à la racine du projet avec les variables Supabase nécessaires :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=votre-cle-anon
```

Selon votre configuration SSR, les variables suivantes peuvent aussi être utilisées :

```env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_PUBLISHABLE_KEY=votre-cle-anon
```

### Configurer la base de données

Dans Supabase, appliquez les migrations SQL présentes dans :

```text
supabase/migrations/
```

Les migrations créent notamment :

- rôles applicatifs
- profils utilisateurs
- opérations
- alertes
- audit logs
- policies RLS
- triggers de scoring et alerting

Pour les comptes de démonstration, désactivez la confirmation email dans Supabase Auth si nécessaire.

### Lancer le projet

```bash
npm run dev
```

Ouvrez ensuite :

```text
http://localhost:5173
```

## Scripts utiles

```bash
npm run dev        # Serveur de développement
npm run build      # Build production
npm run preview    # Prévisualisation du build
npm run lint       # Vérification ESLint
npm run format     # Formatage Prettier
```

## Comptes de démonstration

Mot de passe par défaut :

```text
Demo!2026
```

| Rôle         | Email                 |
| ------------ | --------------------- |
| Front Office | `front@fxrisk.demo`   |
| Back Office  | `back@fxrisk.demo`    |
| Risk Team    | `risk@fxrisk.demo`    |
| Manager      | `manager@fxrisk.demo` |
| Admin        | `admin@fxrisk.demo`   |

## Notes importantes

- Le module prédictif est une première version statistique, pas un modèle ML complet.
- Les recommandations automatiques sont basées sur des règles métier.
- Les alertes et scores sont calculés automatiquement à partir des règles SQL.
- Les rapports sont générés automatiquement à partir des données, mais l'export reste déclenché manuellement par l'utilisateur.
- Les droits réels dépendent aussi des policies RLS Supabase.
