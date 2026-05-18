# 💱 FX Risk Platform — Spot-FX Operational Risk Monitoring System

[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React 19](https://img.shields.io/badge/React-19.x-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TanStack Router](https://img.shields.io/badge/TanStack_Router-1.x-FF4154?style=for-the-badge&logo=react&logoColor=white)](https://tanstack.com/router)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

An enterprise-grade, high-performance **Spot-FX Operational Risk Monitoring System** designed for financial institutions. Featuring a state-of-the-art UI built on React 19, Vite, Tailwind CSS, and TanStack Router.

The platform is backed by **Supabase** (PostgreSQL + GoTrue Auth) with fully automated real-time risk assessment scoring engines, security guards, and audit systems running entirely inside the database engine via custom PL/pgSQL triggers and row-level security (RLS) policies.

---

## 🛠️ Required Tools & Prerequisites

Before you begin, you **must** have the following tools installed on your machine:

1. **[Node.js](https://nodejs.org/en/)** (v18.x or v20.x LTS recommended)
   - Required to run the local development server and manage packages.
   - *Verify installation: Run `node -v` in your terminal.*
2. **Package Manager (npm, pnpm, or bun)**
   - **npm** comes pre-installed with Node.js.
   - **[Bun](https://bun.sh/)** is highly recommended for faster installations.
   - *Verify installation: Run `npm -v` or `bun -v` in your terminal.*
3. **[Git](https://git-scm.com/)**
   - Required for cloning the repository and version control.
   - *Verify installation: Run `git --version` in your terminal.*
4. **A [Supabase](https://supabase.com/) Account**
   - You need a free Supabase project to host the database, authentication, and execute backend triggers.
5. **A Code Editor**
   - [VS Code](https://code.visualstudio.com/) or [Cursor](https://cursor.sh/) is recommended for the best TypeScript support.

---

## 🚀 Step-by-Step Installation Guide

Follow these instructions exactly to get the project running locally.

### Step 1: Clone the Repository
Open your terminal and clone the project to your local machine:
```bash
git clone <your-repository-url>
cd fx-risk-platform
```

### Step 2: Install Dependencies
Install all the required Node.js packages for the frontend:
```bash
# If using npm
npm install

# If using bun (recommended)
bun install
```

### Step 3: Setup Environment Variables
You need to connect your local frontend to your Supabase project.

1. Copy the example environment file to create your own local `.env` file. Run this command in your terminal:
   ```bash
   cp .env.example .env
   ```
   *(On Windows Command Prompt, use `copy .env.example .env`)*

2. Open the newly created `.env` file in your code editor.
3. Replace the placeholder values with your actual Supabase project credentials. You can find these in your Supabase Dashboard under **Project Settings ⚙️ → API**.

   ```env
   # Your .env file should look like this:
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
   
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
   VITE_SUPABASE_PROJECT_ID=your-project-id
   ```

### Step 4: Setup the Supabase Database Schema
Your Supabase database needs the correct tables, roles, and security triggers.

1. Go to your **Supabase Dashboard**.
2. Navigate to the **SQL Editor** on the left sidebar.
3. Open the file `supabase/migrations/20260518073627_9eb4f19f-59c9-44eb-866d-e2ca57fd3af7.sql` from your code editor, copy all the text, paste it into the Supabase SQL Editor, and click **Run**.
4. Do the exact same for the second file: `supabase/migrations/20260518075414_4c6f60d1-637e-4e03-8be2-caa27102b9b7.sql`.

### Step 5: Seed Demo Data and Users (Optional but Recommended)
To fully test the application, you can inject realistic FX operations and configure the demo user roles.

1. Open `supabase/seed_operations.sql` from your code editor.
2. Copy the entire contents.
3. Paste it into the **Supabase SQL Editor** and click **Run**.
4. Go to **Authentication -> Users** in Supabase and ensure you have created users with the following emails (Password: `Demo!2026`):
   - `admin@fxrisk.demo`
   - `back@fxrisk.demo`
   - `manager@fxrisk.demo`
   - `risk@fxrisk.demo`
   - `front@fxrisk.demo`

### Step 6: Start the Development Server
You are now ready to run the app! Execute this command in your terminal:
```bash
# If using npm
npm run dev

# If using bun
bun run dev
```

Open your browser and navigate to **`http://localhost:5173`** (or the port specified in your console).

---

## 🏛️ System Architecture Overview

### Real-Time Database Analytics & Automation
The platform relies heavily on PostgreSQL's advanced features:
* **Multi-Role RBAC (Row-Level Security):** Access is guarded directly inside PostgreSQL using Row Level Security (RLS) policies ensuring users only see what their role (`front_office`, `back_office`, etc.) permits.
* **Auto Risk Computation Engine (`compute_risk()`):** A trigger runs `BEFORE INSERT OR UPDATE` on the `operations` table to evaluate security parameters (amount size, missing SWIFT, off-hours) and assign an immediate risk score (`0` to `100+`) and severity level.
* **Automatic Alert Generation (`generate_alerts()`):** An `AFTER INSERT` trigger parses risk scores and automatically logs security alerts into the `alerts` table if high-exposure thresholds are breached.

### Code Quality & Deployment
Ensure consistency across code modules before committing:
```bash
# Auto-format codebase styles (using Prettier)
npm run format

# Run ESLint diagnostics
npm run lint
```
