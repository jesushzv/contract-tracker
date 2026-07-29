# Mi Pacto 🤝

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-emerald?style=flat&logo=supabase)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

> **Mi Pacto** is a premium contract management and payment collection automation platform designed exclusively for freelancers and independent professionals in Mexico. It simplifies the creation of legal agreements, enables immediate electronic signature, and securely tracks payments via SPEI.

---

## 🚀 Key Features

- **Legally Aligned Contract Creator**: Preconfigured templates for common local tax and contract structures in Mexico (Professional Services/Honorarios Profesionales, RESICO, etc.).
- **Express Signing**: Direct digital signature link via WhatsApp or email, featuring fingerprint, IP logging, and binding consent logs.
- **SPEI Payment Tracking**: Bank CLABE integration to track advances and milestones by verifying Banxico tracking keys (Claves de Rastreo) and Electronic Payment Receipts (CEP).
- **Client Dashboard & Insights**: Visualization of the contract pipeline status, revenue analytics, and tax estimations.
- **Administrative Command Center (`/admin`)**: Centralized administration of users, key system metrics analysis, promotions, and campaign tracking.

---

## 📂 Project Structure

The repository structure is organized as follows:

```text
├── app/                      # Next.js routes (App Router) and page components
│   ├── admin/                # Platform administration dashboard
│   ├── api/                  # Backend API endpoints (Stripe, Facturapi, Resend, etc.)
│   ├── dashboard/            # Main freelancer control dashboard
│   └── components/           # Interactive components and Wizard components
├── data/                     # Static data or mocks for local development
├── emails/                   # Email templates powered by React Email
├── lib/                      # Shared utilities, RFC validators, and configurations
├── scripts/                  # Utility and environment provisioning scripts
│   ├── setup-test-db.js      # Database initialization and seeding with RLS checks
│   ├── create-admin-user.js  # CLI tool for provisioning admin accounts
│   └── test-runner.js        # Unit test orchestrator and coverage calculator
├── supabase/                 # Database migration files and SQL schemas
└── tests/                    # Automated test suites
    └── e2e/                  # End-to-end integration flows using Playwright
```

---

## 🛠️ Environment Configuration

To run the application locally, you must create a `.env.local` file in the project root. Make sure to include the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://postgres:... # Direct PostgreSQL connection URL for migrations

# Stripe Integration (Payment Gateway)
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Facturapi Integration (SAT Invoicing)
FACTURAPI_API_KEY=your_facturapi_api_key

# Email Sending (Resend)
RESEND_API_KEY=your_resend_api_key
```

---

## 💻 Local Development

### 1. Prerequisites

Install the project dependencies:

```bash
npm install
```

### 2. Initialize Database and Seed

To apply Supabase migrations to your environment and populate the database with persistent test accounts under Row Level Security (RLS), run:

```bash
node scripts/setup-test-db.js
```

> **Automatically Created Accounts**:
> - **Free**: `test-free@example.com`
> - **Starter**: `test-starter@example.com`
> - **Pro**: `test-pro@example.com`
> - **Admin**: `admin@example.com` and `jhector.zamora@hotmail.com` (Full access to `/admin`)

For more details on passwords and test purposes, consult [test_accounts.md](file:///Users/jhzamora/.gemini/antigravity-ide/scratch/contract-tracker/test_accounts.md) (local).

### 3. Admin Provisioning

If you need to manually provision a new administrator or promote an existing account, you can use:

```bash
node scripts/create-admin-user.js
```

### 4. Run Development Server

Start the local Next.js environment:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

---

## 🧪 Testing and Validation

The platform includes comprehensive code validation and automated test suites:

### Unit Tests and Coverage
Unit tests run using Node.js's native test runner. To execute them and validate the strict code coverage threshold, run:

```bash
npm run test
```
*Note: A minimum coverage of **85%** on lines and branches is required to pass.*

### E2E Tests (Playwright)
To run integration tests in headless browsers:

```bash
npx playwright test
```

### Full Local Validation Flow
Before committing or pushing changes to the remote repository, it is recommended to run the local end-to-end validator which performs typechecking, linting, building, unit tests, and integration tests:

```bash
npm run validate
```

---

*Developed with excellence to empower independent professionals in Mexico.*
