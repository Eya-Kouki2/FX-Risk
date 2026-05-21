<div align="center">

# FX Risk STB — Plateforme de Gestion des Risques Opérationnels

**A professional-grade, role-based foreign exchange risk management system built for financial institutions.**

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

</div>

---

## Overview

**FX Risk STB** is a full-stack web application designed for the operational risk management of foreign exchange transactions. It provides a real-time, multi-role workflow covering the complete lifecycle of an FX spot operation — from Front Office entry through Back Office validation to Risk Team monitoring and Management oversight.

The platform leverages **PostgreSQL server-side triggers** to automatically compute risk scores and generate compliance alerts the moment a transaction is recorded, removing any reliance on client-side business logic for critical risk calculations.

---

## Key Features

| Feature | Description |
|---|---|
| **RBAC (5 Roles)** | Granular access control enforced at the database level via Row Level Security (RLS) |
| **Automated Risk Scoring** | PostgreSQL trigger computes a 0–100 risk score on every operation insert/update |
| **Real-time Alert Generation** | Alerts dispatched automatically for missing SWIFT codes, high amounts, off-hours trades and critical risk scores |
| **Full Audit Trail** | Every user action is logged with timestamp, role, module and result |
| **FX Workflow Engine** | Operations follow a strict lifecycle: `draft → pending → validated / rejected → settled` |
| **Risk Heatmap** | Visual currency-pair risk exposure matrix |
| **Interactive Dashboard** | 14-day risk trend chart, KPI cards, currency pair distribution and live alerts feed |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                 │
│   TanStack Router · TanStack Query · Recharts · shadcn  │
└────────────────────────┬────────────────────────────────┘
                         │ REST / Realtime
┌────────────────────────▼────────────────────────────────┐
│                  Supabase (Backend-as-a-Service)         │
│                                                         │
│  ┌──────────────┐  ┌─────────────┐  ┌───────────────┐  │
│  │  Auth (JWT)  │  │  REST API   │  │   Realtime    │  │
│  └──────────────┘  └─────────────┘  └───────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │              PostgreSQL Database                │    │
│  │  ┌──────────┐ ┌──────────┐ ┌─────────────────┐ │    │
│  │  │ profiles │ │user_roles│ │   operations    │ │    │
│  │  └──────────┘ └──────────┘ └────────┬────────┘ │    │
│  │                                     │ triggers  │    │
│  │  ┌──────────┐ ┌──────────────────────────────┐  │    │
│  │  │  alerts  │ │  compute_risk + gen_alerts   │  │    │
│  │  └──────────┘ └──────────────────────────────┘  │    │
│  │  ┌─────────────┐    Row Level Security (RLS)     │    │
│  │  │ audit_logs  │    enforced on all tables       │    │
│  │  └─────────────┘                                │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## Role-Based Access Control

| Role | Access |
|---|---|
| **Front Office** | Create & track own operations (draft / submit) |
| **Back Office** | Validate or reject pending operations |
| **Risk Team** | Monitor all operations, manage and acknowledge alerts |
| **Manager** | Approve escalated/critical operations, full oversight |
| **Administrator** | User management, audit logs, all platform access |

> Access is enforced at the **PostgreSQL RLS policy level** — not just the UI. Each role can only read and write rows it is authorized for, regardless of how the API is called.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Language | TypeScript |
| Routing | TanStack Router |
| Data Fetching | TanStack Query |
| UI Components | shadcn/ui + Radix UI |
| Charts | Recharts |
| Backend | Supabase (PostgreSQL 15, GoTrue Auth) |
| Styling | Tailwind CSS |
| Notifications | Sonner |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or v20
- [Git](https://git-scm.com/)
- A [Supabase](https://supabase.com/) account (free tier is sufficient)

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd fx-risk-platform
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file at the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
```

> Find these values in your Supabase Dashboard under **Settings → API**.

### 4. Initialize the database

Open the **Supabase SQL Editor** and run the following script in full — it creates all tables, enums, RLS policies, and triggers from scratch:

```sql
-- Drop and recreate everything cleanly
-- (see supabase/migrations/ for the full versioned scripts)
```

> The complete schema SQL is available in `supabase/migrations/`. Run the files in chronological order.

### 5. Disable email confirmations *(required for demo accounts)*

In your Supabase Dashboard:
**Authentication → Settings → Email Auth → uncheck "Enable email confirmations" → Save**

This allows the 5 demo role accounts to be created and confirmed instantly on first login without requiring email delivery.

### 6. Start the development server

```bash
npm run dev
```

Open **`http://localhost:8081`** in your browser. Use the **Quick Demo** buttons on the login page to instantly sign in as any of the 5 roles.

---

## Demo Accounts

All demo accounts use the password **`Demo!2026`** and are created automatically on first login.

| Role | Email |
|---|---|
| Front Office Operator | `front@fxrisk.demo` |
| Back Office Validator | `back@fxrisk.demo` |
| Risk Team Analyst | `risk@fxrisk.demo` |
| Responsible Manager | `manager@fxrisk.demo` |
| Administrator | `admin@fxrisk.demo` |

---

## Database Schema

```
auth.users (Supabase managed)
    │
    ├── public.profiles         (full_name, department)
    ├── public.user_roles       (user_id, role: app_role enum)
    │
    └── public.operations       (FX transaction records)
            │
            ├── [TRIGGER] trg_operations_risk      → computes risk_score + risk_level
            ├── [TRIGGER] trg_operations_alerts    → dispatches alerts on anomalies
            │
            ├── public.alerts       (auto-generated risk notifications)
            └── public.audit_logs   (action history written by client)
```

### Risk Scoring Engine

The `compute_risk()` trigger function evaluates each operation against 4 criteria:

| Criterion | Points |
|---|---|
| Amount exceeds 1,000,000 | +20 |
| Missing or malformed SWIFT reference | +25 / +30 |
| Transaction submitted outside trading hours (07h–20h) | +15 |
| Exchange rate deviates >2% from market rate | +20 |
| Uncommon currency pair | +10 |

**Score → Level mapping:** `0–20 = Low` · `21–40 = Moderate` · `41–60 = High` · `61+ = Critical`

---

## Project Structure

```
fx-risk-platform/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── app-shell.tsx    # Navigation & layout wrapper
│   │   ├── risk-indicators.tsx
│   │   └── operation-detail-dialog.tsx
│   ├── routes/              # Page components (file-based routing)
│   │   ├── app.index.tsx        # Dashboard
│   │   ├── app.operations.*.tsx # Operations list & new form
│   │   ├── app.alerts.tsx       # Alert centre
│   │   ├── app.validation.tsx   # Back Office queue
│   │   ├── app.approvals.tsx    # Manager escalation queue
│   │   ├── app.heatmap.tsx      # Risk heatmap
│   │   ├── app.audit.tsx        # Audit logs
│   │   └── app.admin.*.tsx      # Admin panel
│   ├── lib/
│   │   ├── auth.ts          # Session management & role resolution
│   │   └── risk.ts          # Risk utilities & formatters
│   └── integrations/
│       └── supabase/        # Supabase client & type definitions
├── supabase/
│   └── migrations/          # Versioned SQL schema files
├── .env                     # Environment variables (not committed)
└── README.md
```

---

## License

This project is released under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Built for the STB — Société Tunisienne de Banque · FX Operational Risk Division</sub>
</div>
