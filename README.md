# 💱 FX Risk Platform — Spot-FX Operational Risk Monitoring System

[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React 19](https://img.shields.io/badge/React-19.x-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TanStack Router](https://img.shields.io/badge/TanStack_Router-1.x-FF4154?style=for-the-badge&logo=react&logoColor=white)](https://tanstack.com/router)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-Deployment-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)

An enterprise-grade, high-performance **Spot-FX Operational Risk Monitoring System** designed for financial institutions. Featuring a state-of-the-art UI built on React 19, Vite, Tailwind CSS, and TanStack Router, the platform is optimized for sub-millisecond client-side routing, responsive data layouts, server-side rendering (SSR), and edge-native deployments on **Cloudflare Workers**.

The platform is backed by **Supabase** (PostgreSQL + GoTrue Auth) with fully automated real-time risk assessment scoring engines, security guards, and audit systems running entirely inside the database engine via custom PL/pgSQL triggers and row-level security (RLS) policies.

---

## 🛠️ Prerequisites & Installation Requirements

Before setting up the project locally, ensure you have the following software installed:

### 1. Runtimes & Package Managers (At least one)
* **Node.js**: `v18.x` or `v20.x` (Long-Term Support recommended) with **npm** (`v9.x` or higher) or **Yarn** / **pnpm**.
* **Bun (Recommended)**: `v1.0.0` or higher. Bun provides ultra-fast dependency resolution and workspace execution.

### 2. Database & Backend Services
* **Supabase Account & Project**: A free or pro tier Supabase project is required for backend authentication and relational storage.
* **Supabase CLI (Optional)**: If you wish to manage migrations locally and push updates via command line.

---

## 🚀 Step-by-Step Local Setup Guide

Follow these steps to get the platform up and running in your local development environment.

### Step 1: Clone the Repository & Open Workspace
Navigate to your project root folder:
```bash
cd "/path/to/fx-risk-platform"
```

### Step 2: Install Project Dependencies
Run one of the following commands to install the required Node modules:

```bash
# Option A: Using Bun (Fastest)
bun install

# Option B: Using npm
npm install

# Option C: Using pnpm
pnpm install
```

### Step 3: Configure Environment Variables
Create a file named `.env` in the root of the project and populate it with your Supabase credentials:

```env
# Server-side Keys (Used for SSR, Edge Workers & Server Functions)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Client-side Keys (Vite prefix makes these accessible in the browser bundle)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=your-project-id
```

> [!TIP]
> You can retrieve these values in your Supabase Dashboard under **Project Settings ⚙️ → API**.

---

## 💾 Supabase Database Setup & Migrations

The entire database schema, security layout, real-time engines, and triggers are stored under the [supabase/migrations](file:///c:/Users/ASUS%20TUF%20A15/Downloads/fx-risk-platform%20%281%29/supabase/migrations) directory.

### Method A: Running Migrations via SQL Editor (Easiest)
1. Go to your **Supabase Dashboard**.
2. Navigate to the **SQL Editor** in the left menu.
3. Click **New Query**.
4. Open the first migration file: [20260518073627_9eb4f19f-59c9-44eb-866d-e2ca57fd3af7.sql](file:///c:/Users/ASUS%20TUF%20A15/Downloads/fx-risk-platform%20%281%29/supabase/migrations/20260518073627_9eb4f19f-59c9-44eb-866d-e2ca57fd3af7.sql). Copy its entire text, paste it into the editor, and click **Run**.
5. Open the second migration file: [20260518075414_4c6f60d1-637e-4e03-8be2-caa27102b9b7.sql](file:///c:/Users/ASUS%20TUF%20A15/Downloads/fx-risk-platform%20%281%29/supabase/migrations/20260518075414_4c6f60d1-637e-4e03-8be2-caa27102b9b7.sql). Copy its text, paste it in a new query window, and click **Run**.

---

### 👥 Creating Demo Accounts with Email Identities

To facilitate easy testing of the various role workspaces, five demo users are prepared in the project. The platform's login page has direct quick-access buttons to log in as any of these users with the password **`Demo!2026`**.

To ensure they exist in your Supabase Auth instance with correct profiles, roles, and provider attributes:

#### 1. Add Users in Supabase Dashboard
Go to **Supabase Dashboard → Authentication → Users**, click **Add user → Create user**, and enter:
* 🔴 **Administrator**: `admin@fxrisk.demo`
* 🟢 **Back Office Validator**: `back@fxrisk.demo`
* 🔵 **Responsible Manager**: `manager@fxrisk.demo`
* 🟣 **Risk Team Analyst**: `risk@fxrisk.demo`
* 🟡 **Front Office Operator**: `front@fxrisk.demo`

Make sure **"Auto Confirm User"** is checked for all of them so their email addresses are pre-confirmed.

#### 2. Run Database Association SQL
Paste and run the following script in your Supabase SQL Editor. This will automatically link the newly created auth users to their corresponding roles and setup profiles with full names:

```sql
-- Link auth users to application roles & Profiles
DO $$
DECLARE
  r RECORD;
  v_role public.app_role;
  v_name TEXT;
  v_dept TEXT;
BEGIN
  FOR r IN SELECT id, email FROM auth.users LOOP
    IF r.email = 'admin@fxrisk.demo' THEN
      v_role := 'admin'; v_name := 'Administrator'; v_dept := 'IT / Security';
    ELSIF r.email = 'back@fxrisk.demo' THEN
      v_role := 'back_office'; v_name := 'Back Office Validator'; v_dept := 'Back Office Operations';
    ELSIF r.email = 'manager@fxrisk.demo' THEN
      v_role := 'manager'; v_name := 'Responsible Manager'; v_dept := 'Executive / Management';
    ELSIF r.email = 'risk@fxrisk.demo' THEN
      v_role := 'risk_team'; v_name := 'Risk Team Analyst'; v_dept := 'Risk Management';
    ELSIF r.email = 'front@fxrisk.demo' THEN
      v_role := 'front_office'; v_name := 'Front Office Operator'; v_dept := 'Front Office';
    ELSE
      CONTINUE;
    END IF;

    -- Update User Auth metadata
    UPDATE auth.users 
    SET raw_user_meta_data = jsonb_build_object('full_name', v_name, 'role', v_role)
    WHERE id = r.id;

    -- Ensure profiles entry exists
    INSERT INTO public.profiles (id, full_name, department)
    VALUES (r.id, v_name, v_dept)
    ON CONFLICT (id) DO UPDATE SET full_name = v_name, department = v_dept;

    -- Link Role mapping
    INSERT INTO public.user_roles (user_id, role)
    VALUES (r.id, v_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END LOOP;
END;
$$;
```

---

### Step 4: Run the Local Server
Launch the development server:

```bash
# Using Bun
bun run dev

# Using npm
npm run dev
```

Open your browser and navigate to **`http://localhost:5173`** (or the port specified in your console).

---

## 🏛️ System Architecture & Mechanics

### 📂 Directory & File Structure
```
├── .env                       # Local environment configurations
├── package.json               # Dependencies and scripts definitions
├── vite.config.ts             # Vite server and React Router plugins configuration
├── wrangler.jsonc             # Cloudflare Workers serverless edge configuration
├── supabase/
│   ├── config.toml            # Supabase config
│   └── migrations/            # Version-controlled SQL schema & triggers
├── src/
│   ├── components/            # UI Components (Alerts widgets, KPI cards, indicators)
│   │   ├── ui/                # Radix UI wrapper primitives
│   │   └── app-shell.tsx      # Main layout featuring a Fixed Sidebar & Responsive shell
│   ├── integrations/
│   │   └── supabase/          # Database bindings, API hooks, and TypeScript types
│   ├── lib/
│   │   ├── auth.ts            # RBAC utilities, session handling hooks, and audits
│   │   └── risk.ts            # Currency pairs definitions, formatters
│   ├── routes/                # File-based navigation structure
│   │   ├── __root.tsx         # Context root shell & React-Query provider
│   │   ├── login.tsx          # Login portal with quick-demo buttons
│   │   ├── app.tsx            # Main layout wrapper
│   │   ├── app.index.tsx      # Main executive dashboard
│   │   ├── app.operations/    # Operations list and creation portal
│   │   ├── app.validation.tsx # Back office clearing and verification
│   │   ├── app.alerts.tsx     # Real-time risk alarms center
│   │   └── app.admin.users.tsx# Users control panel
│   └── styles.css             # Main styling, gradients, and theme tokens
```

---

## 🧠 Real-Time Database Analytics & Automation

### 1. Multi-Role RBAC (Row-Level Security)
Access is guarded directly inside PostgreSQL using Row Level Security (RLS) policies:
* **`front_office`**: Authorized solely to create transactions and view operations created by themselves.
* **`back_office`**: Responsible for validating transaction queues, clearing SWIFT logs, and editing operations.
* **`risk_team`**: Authorized to monitor dashboard risk scoring, handle incoming alarms, and acknowledge system alerts.
* **`manager`**: Executive overview, overrides, and approving transactions that were escalated due to critical risks.
* **`admin`**: Total platform management including profile governance, security audits, and settings configurations.

---

### 2. Auto Risk Computation Engine (`compute_risk()`)
A trigger runs `BEFORE INSERT OR UPDATE` on the `operations` table to evaluate security parameters and assign an immediate risk score (`0` to `100+`) and severity level:

| Anomaly Pattern | Trigger Condition | Risk Penalty |
| :--- | :--- | :---: |
| **High Capital Exposure** | Operation amount is higher than `$1,000,000` | **`+20`** |
| **Missing Settlement Ref** | SWIFT code is blank or null | **`+25`** |
| **Mismatched SWIFT** | SWIFT formatting does not match standard banking regular expression rules | **`+30`** |
| **Off-Hours Settlement** | Transaction entered outside normal trading windows (before 7:00 AM or after 8:00 PM) | **`+15`** |
| **Exchange Rate Deviance** | Exchange rate deviates by more than `2%` compared to current market indexes | **`+20`** |
| **Exotic Currency Pair** | Buying/selling does not belong to major pairs (EUR/USD, USD/JPY, GBP/USD, etc.) | **`+10`** |

#### Score to Severity Thresholds:
* **$\le$ 20**: `low` Risk Level
* **$\le$ 40**: `moderate` Risk Level
* **$\le$ 60**: `high` Risk Level
* **$> 60$**: `critical` Risk Level

---

### 3. Automatic Alert Generation (`generate_alerts()`)
An `AFTER INSERT` trigger runs on every transaction to parse scores and automatically log security alerts into the `alerts` table if high-exposure thresholds are breached:
* Dispatches a **High Severity** alert if a transaction exceeds $1,000,000.
* Dispatches a **Critical Severity** alert if the SWIFT settlement confirmation is missing.
* Flags a **Moderate Severity** alert for trades processed during night-shift intervals.
* Instantly elevates an alert to **Critical Severity** if the system computes a `critical` risk level, prompting immediate risk team action.

---

## ☁️ Production Deployment (Cloudflare Workers)

The platform compiles down to edge-native bundles using `@cloudflare/vite-plugin`. To deploy the project live to Cloudflare:

1. Authenticate with Wrangler:
   ```bash
   npx wrangler login
   ```
2. Deploy the application:
   ```bash
   npm run build
   # Deploy using Wrangler configuration
   npx wrangler deploy
   ```

---

## 🛠️ Formatting & Code Quality
Before committing code modifications, keep the project healthy by running:

```bash
# Auto-format codebase styles (using Prettier)
npm run format

# Run ESLint diagnostics
npm run lint
```
