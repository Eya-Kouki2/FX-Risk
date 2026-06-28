/**
 * Génère un PDF explicatif du projet FX Risk pour débutants (français).
 * Usage: node scripts/generate-guide-debutant.mjs
 */
import { jsPDF } from "jspdf";
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "docs");
const OUT_FILE = join(OUT_DIR, "Guide_FX_Risk_Debutant.pdf");

const MARGIN = 18;
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN * 2;
const LINE = 5.2;

function createWriter(doc) {
  let y = MARGIN;

  const addPage = () => {
    doc.addPage();
    y = MARGIN;
  };

  const ensureSpace = (needed = 10) => {
    if (y + needed > PAGE_H - 20) addPage();
  };

  const title = (text, size = 16) => {
    ensureSpace(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(15, 31, 64);
    doc.text(text, MARGIN, y);
    y += size * 0.55 + 4;
    doc.setTextColor(0, 0, 0);
  };

  const h2 = (text) => {
    ensureSpace(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 64, 120);
    doc.text(text, MARGIN, y);
    y += 8;
    doc.setTextColor(0, 0, 0);
  };

  const h3 = (text) => {
    ensureSpace(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text(text, MARGIN, y);
    y += 6;
  };

  const para = (text) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(text, CONTENT_W);
    ensureSpace(lines.length * LINE + 2);
    doc.text(lines, MARGIN, y);
    y += lines.length * LINE + 3;
  };

  const bullet = (text) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(`- ${text}`, CONTENT_W - 4);
    ensureSpace(lines.length * LINE + 1);
    doc.text(lines, MARGIN + 2, y);
    y += lines.length * LINE + 1.5;
  };

  const code = (text) => {
    doc.setFont("courier", "normal");
    doc.setFontSize(8.5);
    const lines = doc.splitTextToSize(text, CONTENT_W);
    ensureSpace(lines.length * 4.6 + 6);
    doc.setFillColor(245, 247, 250);
    doc.rect(MARGIN, y - 3, CONTENT_W, lines.length * 4.6 + 4, "F");
    doc.setTextColor(40, 40, 40);
    doc.text(lines, MARGIN + 3, y + 1);
    y += lines.length * 4.6 + 6;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
  };

  const spacer = (n = 4) => {
    y += n;
  };

  return { title, h2, h3, para, bullet, code, spacer };
}

function drawFooter(doc) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text("FX Risk - Guide debutant", MARGIN, PAGE_H - 8);
    doc.text(`Page ${i} / ${pages}`, PAGE_W - MARGIN - 15, PAGE_H - 8);
  }
}

function buildPdf() {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  doc.setFillColor(15, 31, 64);
  doc.rect(0, 0, PAGE_W, 72, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("FX Risk", MARGIN, 36);
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Guide du projet pour debutants", MARGIN, 50);
  doc.text("De zero a la comprehension complete", MARGIN, 60);
  doc.setFontSize(10);
  doc.text("Langage simple - Organisation des fichiers - Installation pas a pas", MARGIN, 68);
  doc.setTextColor(0, 0, 0);

  const intro =
    "Ce document explique le projet FX Risk avec un langage simple. Il est concu pour une personne qui decouvre le developpement web, React, Supabase ou la gestion des risques de change. Aucune connaissance prealable n'est requise.";
  doc.text(doc.splitTextToSize(intro, CONTENT_W), MARGIN, 92);

  doc.addPage();
  const w = createWriter(doc);

  w.title("1. Qu'est-ce que ce projet ?");
  w.para(
    "FX Risk est une application web qui aide une banque ou une equipe financiere a suivre les operations de change (Foreign Exchange, abrege FX). Quand quelqu'un achete ou vend des devises (euro, dollar, etc.), l'application enregistre l'operation, calcule automatiquement son niveau de risque, genere des alertes si quelque chose est suspect, et permet aux differents services de valider ou rejeter la transaction.",
  );
  w.para(
    "En resume : c'est un tableau de bord intelligent pour surveiller les risques lies aux operations FX, avec des roles utilisateurs (Front Office, Back Office, Risk Team, Manager, Admin).",
  );

  w.h2("1.1 Le probleme resolu");
  w.bullet("Centraliser toutes les operations FX au meme endroit.");
  w.bullet("Calculer automatiquement un score de risque de 0 a 100.");
  w.bullet("Alerter en cas d'anomalie : montant eleve, SWIFT manquant, horaire atypique.");
  w.bullet("Faire valider les operations par les bonnes equipes.");
  w.bullet("Garder une trace de qui a fait quoi (journal d'audit).");
  w.bullet("Afficher des indicateurs (KRI), graphiques et predictions.");

  w.h2("1.2 Exemple concret");
  w.para(
    "Un operateur Front Office saisit : Client ABC, achat de 2 000 000 USD contre EUR, sans reference SWIFT, a 22h. Le systeme calcule un score eleve, cree une alerte « SWIFT manquant », et place l'operation dans la file de validation. Le Back Office voit la recommandation « Demander confirmation SWIFT » et peut valider ou rejeter.",
  );

  w.title("2. Technologies utilisees (expliquees simplement)");
  w.para("Le projet repose sur plusieurs briques. Voici ce que chacune fait, en langage courant :");

  w.h3("React 19");
  w.para("Bibliotheque JavaScript pour construire l'interface : boutons, tableaux, graphiques. C'est ce que l'utilisateur voit a l'ecran.");

  w.h3("TypeScript");
  w.para("JavaScript avec des types. Cela aide a eviter les erreurs avant d'executer le code (par exemple : un montant doit etre un nombre).");

  w.h3("Vite");
  w.para("Outil qui lance le projet en developpement et prepare la version finale. Commande principale : npm run dev.");

  w.h3("TanStack Router / Start");
  w.para("Gere les pages (/login, /app, /app/operations...) et le rendu cote serveur (SSR). Chaque URL correspond a un fichier dans src/routes/.");

  w.h3("Supabase");
  w.para(
    "Backend dans le cloud : base de donnees PostgreSQL, authentification (login), securite par roles (RLS), mises a jour en temps reel. Des triggers SQL calculent le risque et creent les alertes automatiquement a chaque insertion.",
  );

  w.h3("Tailwind CSS + shadcn/ui");
  w.para("Styles et composants prets a l'emploi (cartes, boutons, formulaires) pour une interface moderne et coherente.");

  w.h3("Recharts");
  w.para("Bibliotheque de graphiques (courbes, camemberts, barres) utilisee sur le tableau de bord.");

  w.h3("jsPDF");
  w.para("Genere les rapports PDF exportables depuis la page Rapports de l'application.");

  w.title("3. Organisation des fichiers");
  w.para(
    "Pour un debutant, retenez trois zones : src/ (code de l'application), supabase/ (base de donnees), racine (configuration).",
  );

  w.h2("3.1 Racine du projet");
  w.code(`FX-Risk/
  package.json        Dependances npm et scripts (dev, build, lint)
  vite.config.ts      Configuration du build Vite
  tsconfig.json       Configuration TypeScript
  .env.example        Modele des variables d'environnement
  README.md           Documentation principale du projet
  docs/               Documentation generee (ce PDF)`);

  w.h2("3.2 Dossier src/ - coeur de l'application");
  w.code(`src/
  routes/             Une page web = un fichier ici
  components/         Blocs reutilisables (menu, badges, dialogues)
  lib/                Logique metier (auth, risque, PDF, utilitaires)
  hooks/              Hooks React (ex: rafraichissement temps reel)
  integrations/       Connexion Supabase (client, auth, types)
  router.tsx          Point d'entree du routeur
  server.ts           Serveur SSR
  styles.css          Styles globaux Tailwind`);

  w.h2("3.3 Dossier src/routes/ - les pages web");
  w.para("Convention TanStack Router : le nom du fichier devient l'URL.");
  w.bullet("login.tsx ........................ Page de connexion");
  w.bullet("app.index.tsx .................... Tableau de bord (KRI, graphiques)");
  w.bullet("app.operations.index.tsx ......... Liste des operations FX");
  w.bullet("app.operations.new.tsx ............. Creer une nouvelle operation");
  w.bullet("app.validation.tsx ............... File de validation");
  w.bullet("app.approvals.tsx ................ File d'approbation (manager)");
  w.bullet("app.alerts.tsx ................... Centre d'alertes");
  w.bullet("app.heatmap.tsx .................. Cartographie des risques");
  w.bullet("app.predictions.tsx .............. Prediction des risques (7 jours)");
  w.bullet("app.reports.tsx .................. Rapports PDF et CSV");
  w.bullet("app.audit.tsx .................... Journal d'audit");
  w.bullet("app.clients.index.tsx ............ Annuaire clients");
  w.bullet("app.clients.$clientId.tsx ........ Fiche detaillee d'un client");
  w.bullet("app.admin.users.tsx .............. Gestion des utilisateurs");
  w.bullet("app.admin.settings.tsx ........... Parametres admin");

  w.h2("3.4 Dossier src/components/");
  w.bullet("app-shell.tsx : barre laterale, menu de navigation selon le role.");
  w.bullet("operation-detail-dialog.tsx : fenetre de detail d'une operation.");
  w.bullet("risk-indicators.tsx : badges de niveau de risque (low, high, etc.).");
  w.bullet("ui/ : composants shadcn (Button, Card, Table, Dialog...).");

  w.h2("3.5 Dossier src/lib/ - logique importante");
  w.bullet("auth.ts : session utilisateur, roles, permissions.");
  w.bullet("risk.ts : formatage montants, recommandations, helpers risque.");
  w.bullet("pdf.ts : export PDF des rapports operations/alertes.");
  w.bullet("utils.ts : fonctions utilitaires communes.");

  w.h2("3.6 Dossier supabase/");
  w.code(`supabase/
  migrations/         Scripts SQL (tables, regles, triggers, policies)
  seed_operations.sql Donnees de test (optionnel)
  config.toml         Configuration Supabase locale
  SEED_DATA.md        Instructions pour les donnees de demo`);

  w.para(
    "Les migrations creent notamment : profiles, user_roles, operations, alerts, audit_logs, et les fonctions compute_risk() et generate_alerts() executees automatiquement.",
  );

  w.title("4. Flux complet de l'application");
  w.bullet("1. Connexion sur login.tsx via Supabase Auth.");
  w.bullet("2. Lecture du role (front_office, back_office...) via lib/auth.ts.");
  w.bullet("3. Le menu (app-shell.tsx) affiche uniquement les pages autorisees.");
  w.bullet("4. Front Office cree une operation : insertion dans la table operations.");
  w.bullet("5. Trigger SQL compute_risk() : calcule risk_score (0-100) et risk_level.");
  w.bullet("6. Trigger generate_alerts() : cree des alertes si anomalies detectees.");
  w.bullet("7. Operation visible dans File de validation (statut : pending).");
  w.bullet("8. Back Office / Risk / Manager / Admin : Valider ou Rejeter.");
  w.bullet("9. Dashboard, alertes et graphiques se mettent a jour (temps reel).");
  w.bullet("10. Actions enregistrees dans audit_logs pour la tracabilite.");

  w.title("5. Les cinq roles utilisateurs");
  w.para("RBAC = controle d'acces base sur les roles. Chaque utilisateur a un seul role.");
  w.bullet("front_office : cree des operations, consulte clients et historique.");
  w.bullet("back_office : valide ou rejette les operations en attente.");
  w.bullet("risk_team : supervise alertes, cartographie, validation, predictions.");
  w.bullet("manager : approuve les cas critiques ou escalades.");
  w.bullet("admin : acces complet, gestion utilisateurs et parametres.");

  w.title("6. Modules fonctionnels en detail");
  w.h3("Tableau de bord (app.index.tsx)");
  w.para(
    "Affiche les KRI : total operations, operations a haut risque, alertes ouvertes, score moyen, operations en attente, exposition. Graphiques : tendance 14J/30J/12M, distribution des risques, paires de devises.",
  );

  w.h3("Operations FX");
  w.para("Historique complet : reference, client, contrepartie, montant, taux, statut, score. Creation via formulaire guide.");

  w.h3("File de validation");
  w.para(
    "Operations en attente avec recherche, score, recommandations automatiques (SWIFT, montant, horaire...) et actions Valider / Rejeter.",
  );

  w.h3("Centre d'alertes");
  w.para("Alertes generees automatiquement : severite, categorie, message. Possibilite d'acquitter.");

  w.h3("Cartographie des risques");
  w.para("Matrice Probabilite x Impact calculee dynamiquement a partir des operations courantes.");

  w.h3("Prediction des risques");
  w.para("Projection heuristique sur 7 jours : risque moyen prevu, tendance, volume haut risque, exposition prevue.");

  w.h3("Rapports et audit");
  w.para("Export PDF/CSV des operations et alertes. Journal d'audit pour tracer les actions sensibles.");

  w.title("7. Scoring et alertes automatiques");
  w.para("Le score (0-100) prend en compte : montant eleve, SWIFT manquant ou invalide, horaire atypique, ecart de taux, paire inhabituelle.");
  w.para("Classification : low (<=20), moderate (<=40), high (<=60), critical (>60).");
  w.para("Types d'alertes : High Amount, Missing SWIFT, Late-Night Operation, Critical Risk Score.");

  w.title("8. Installation depuis zero");
  w.h3("Prerequis");
  w.bullet("Node.js installe (https://nodejs.org) - version LTS recommandee.");
  w.bullet("Compte Supabase gratuit (https://supabase.com).");
  w.bullet("Editeur de code : VS Code ou Cursor.");

  w.h3("Etapes pas a pas");
  w.bullet("Etape 1 : Ouvrir le dossier du projet dans un terminal.");
  w.code("cd FX-Risk\nnpm install");
  w.bullet("Etape 2 : Copier .env.example vers .env et remplir les cles Supabase.");
  w.bullet("Etape 3 : Dans Supabase > SQL Editor, executer les migrations dans l'ordre chronologique.");
  w.bullet("Etape 4 : Desactiver la confirmation email (Auth > Settings) pour les comptes demo.");
  w.bullet("Etape 5 : Lancer l'application.");
  w.code("npm run dev");
  w.bullet("Etape 6 : Ouvrir http://localhost:5173 dans le navigateur.");

  w.h3("Variables d'environnement (.env)");
  w.bullet("VITE_SUPABASE_URL : URL de votre projet Supabase.");
  w.bullet("VITE_SUPABASE_PUBLISHABLE_KEY : cle publique (anon key).");
  w.bullet("SUPABASE_SERVICE_ROLE_KEY : cle serveur (ne jamais exposer cote client).");

  w.title("9. Comptes de demonstration");
  w.para("Mot de passe pour tous les comptes : Demo!2026");
  w.bullet("front@fxrisk.demo - Front Office");
  w.bullet("back@fxrisk.demo - Back Office");
  w.bullet("risk@fxrisk.demo - Risk Team");
  w.bullet("manager@fxrisk.demo - Manager");
  w.bullet("admin@fxrisk.demo - Admin");
  w.para("Sur la page login, les boutons Quick Demo permettent une connexion rapide.");

  w.title("10. Commandes utiles");
  w.code(`npm run dev      Demarrer en developpement (port 5173)
npm run build    Construire pour la production
npm run preview  Previsualiser le build
npm run lint     Verifier la qualite du code
npm run format   Formater le code avec Prettier
node scripts/generate-guide-debutant.mjs  Regenerer ce PDF`);

  w.title("11. Glossaire pour debutants");
  w.bullet("FX : Foreign Exchange = operations de change entre devises.");
  w.bullet("SWIFT : reference bancaire internationale de virement.");
  w.bullet("KRI : Key Risk Indicators = indicateurs cles de risque.");
  w.bullet("RLS : Row Level Security = regles qui limitent l'acces aux lignes en base.");
  w.bullet("Trigger : fonction SQL executee automatiquement a l'insertion ou mise a jour.");
  w.bullet("Hook : fonction React reutilisable (useQuery, useSession...).");
  w.bullet("Route : une URL associee a une page.");
  w.bullet("Migration : script SQL versionne qui modifie la structure de la base.");
  w.bullet("SSR : Server Side Rendering = pages generees cote serveur.");

  w.title("12. Conseils pour apprendre");
  w.bullet("Lisez README.md pour la documentation complete.");
  w.bullet("Explorez src/routes/ une page a la fois.");
  w.bullet("Connectez-vous avec chaque role demo pour voir les differences.");
  w.bullet("Creez une operation test et suivez son parcours jusqu'a la validation.");
  w.bullet("Modifiez un libelle simple, sauvegardez, observez le resultat dans le navigateur.");

  w.spacer(4);
  w.para("Document genere pour le projet FX Risk - Plateforme de Gestion des Risques de Change.");

  drawFooter(doc);
  return doc;
}

mkdirSync(OUT_DIR, { recursive: true });
const pdf = buildPdf();
writeFileSync(OUT_FILE, Buffer.from(pdf.output("arraybuffer")));
console.log(`PDF cree : ${OUT_FILE}`);
