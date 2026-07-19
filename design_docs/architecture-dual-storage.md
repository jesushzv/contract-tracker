# Dual-Storage Engine Architecture

The Contract & Payment Tracker implements a dynamic, pluggable storage adapter system. This allows the application to run seamlessly across three distinct database backends without changing the frontend UI components.

---

## 🏗️ Storage Architecture Overview

The system abstracts database actions behind a unified API layer defined in [types.ts](file:///Users/jhzamora/.gemini/antigravity-ide/scratch/contract-tracker/lib/types.ts). The frontend interacts exclusively with [storageClient.ts](file:///Users/jhzamora/.gemini/antigravity-ide/scratch/contract-tracker/lib/storageClient.ts), which acts as a routing dispatcher.

```
                  ┌──────────────────────────────┐
                  │ Next.js UI Page / Component  │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │       storageClient.ts       │
                  │   (API Routing & Sandbox)    │
                  └──────┬───────┬────────┬──────┘
                         │       │        │
      ┌──────────────────┘       │        └──────────────────┐
      │ isDemoMode()             │ !isDemoMode()             │ !isDemoMode()
      │ == true                  │ & Supabase Configured     │ & No Supabase Configured
      ▼                          ▼                           ▼
┌──────────────┐         ┌──────────────┐            ┌──────────────┐
│ LocalStorage │         │   storage-   │            │  storage.ts  │
│  (Sandbox)   │         │ Supabase.ts  │            │ (Local JSON) │
└──────────────┘         └──────┬───────┘            └──────┬───────┘
                                │                           │
                                ▼                           ▼
                         ┌──────────────┐            ┌──────────────┐
                         │   Supabase   │            │ data/db.json │
                         │   Cloud DB   │            │   on Disk    │
                         └──────────────┘            └──────────────┘
```

---

## 🗄️ Storage Adapters & Dispatches

### 1. Browser Sandbox (LocalStorage / Demo Mode)
*   **Trigger**: Determined by the `isDemoMode()` function.
*   **Storage Location**: Client-side browser `localStorage` under specific partition keys:
    *   `sandbox_profile`: The user profile (configured to Hector J. Guerrero, `pro` tier by default).
    *   `sandbox_contracts`: Simulated contracts list.
    *   `sandbox_milestones`: Associated payment milestones.
    *   `sandbox_audit_logs`: Integrity audit log history.
    *   `sandbox_contract_versions`: Changeset history of contract renegotiations.
*   **Behavior**: When a user is in demo mode, all CRUD transactions and validation checks are simulated entirely in-browser. A cookie (`demo_mode=true`) is also written (both instantly on button click, and by the Next.js middleware upon seeing `?demo=true`) to sync state across route redirects and Next.js middleware.

### 2. Cloud Database (Supabase Client Actions)
*   **Trigger**: Triggered when `isDemoMode()` is false and `shouldUseSupabase()` returns true.
*   **Engine**: Server-side Next.js Server Actions connecting to a remote PostgreSQL database via `@supabase/supabase-js`.
*   **Behavior**: Leverages true relational constraints, Row-Level Security (RLS) policies, database triggers, and a Postgres storage bucket for payment receipts.

### 3. Local Mock File Engine (`data/db.json`)
*   **Trigger**: Fallback used when `isDemoMode()` is false and no Supabase configuration variables are detected.
*   **Engine**: Server-side Node.js File System (`fs/promises`) reading and writing transactions to `data/db.json`.
*   **Behavior**: Emulates the schema of the Supabase tables in a local JSON document. It is useful for lightweight local development and testing without requiring cloud setups.

---

## ⚙️ Routing Logic & Environmental Variables

The dispatcher determines which storage adapter to bind at runtime using two key evaluation functions:

### 1. `shouldUseSupabase()`
Checks for the presence of the public Supabase URL. It contains a security bypass when deploying to Vercel preview environments to prevent branch deployments from corrupting production tables.

```typescript
export const shouldUseSupabase = (): boolean => {
  // Bypass in Vercel Staging/Preview environments
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === "preview") {
    return false;
  }
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== "";
};
```

### 2. `isDemoMode()`
Inspects multiple locations (in order: URL query search parameters, cookies, and local storage) to check if the session is locked to the sandbox.

```typescript
export const isDemoMode = (): boolean => {
  if (typeof window === "undefined") return false;
  
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === "preview") {
    return true; // Force sandbox in previews
  }
  
  const hasDemoParam = new URLSearchParams(window.location.search).get("demo") === "true";
  if (hasDemoParam) {
    localStorage.setItem("demo_mode", "true");
    return true;
  }
  
  const hasDemoCookie = document.cookie.split("; ").some(row => row.trim().startsWith("demo_mode=true"));
  return localStorage.getItem("demo_mode") === "true" || hasDemoCookie;
};
```

---

## 🌱 Sandbox Seeding & Mock Data Setup

To provide a cohesive "zero setup" user onboarding experience, the sandbox automatically populates its state upon initialization or whenever the database is cleared.

*   **Profile Default**: Seeds a freelancer named **Héctor J. Guerrero** (with tax ID `GUEH860710MX8`, registered under the Mexican RESICO tax regime).
*   **Contracts Default**: Seeds five contracts across various stages of the lifecycle:
    1.  `c1-rediseño-marca`: A fully accepted contract in Mexican Pesos with one completed milestone and one requested milestone.
    2.  `c2-landing-page`: An active proposal sent to the client pending review.
    3.  `c3-consultoria-resico`: A completed consulting engagement.
    4.  `c4-desarrollo-ecommerce`: A large-scale e-commerce setup with multiple milestones, including an overdue payment.
    5.  `c5-draft-contrato`: A work-in-progress draft contract.
*   **Forced Pro Tier**: The sandbox overrides the profile subscription tier to `pro` by default to give the user access to custom branding uploads, logo uploads, and unlimited contract mock generations.

---

## ⚠️ Developer Guidelines for Future Modifications

When adding a database table or modifying storage queries:
1.  **Define the Interface**: Update `types.ts` first to establish compiler type-safety.
2.  **Modify all 3 adapters**:
    *   Add the client action in `storageSupabase.ts` using `@supabase/supabase-js` query syntax.
    *   Add the file manipulation operation in `storage.ts` ensuring database constraints (e.g. cascading deletes) are emulated correctly.
    *   Add the browser mock representation in `storageClient.ts` to support sandboxed users.
3.  **Update the Unified Dispatcher**: Expose the new function at the base of `storageClient.ts`, dispatching to the configured active adapter.
