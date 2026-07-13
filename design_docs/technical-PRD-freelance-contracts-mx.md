# Technical PRD: Contract & Anticipo Tracker for Freelancers (MX)

**Owner:** Hector Zamora  
**Status:** Approved v1.2 (Security Scoped Revision)  
**Last updated:** July 11, 2026  

---

## 1. Overview

A specialized mobile-friendly web application designed for Mexican freelancers to generate client-facing service agreements, validate RFC taxpayers, calculate localized tax withholdings, secure digital agreement signatures via OTP, and track milestone payments (anticipos) under a single connected system. 

By unifying contract drafting, signature, fiscal verification, and payment tracking, the platform replaces disconnected tools (e.g., Google Docs, WhatsApp, and bank apps) and establishes a single cryptographic source of truth.

---

## 2. Problem & Goals

### Problem
Freelancers in Mexico experience significant transaction friction and payment delays:
1. **Fiscal Overhead:** Contracts with typos in RFCs, postal codes, or incorrect withholding calculations (*retenciones de ISR/IVA*) are legally voidable or block corporate bank clearance.
2. **Disconnected Signature Workflows:** Standard e-signature tools are expensive, while lightweight check-box agreements lack strong identity verification and legal enforceability in Mexico.
3. **No Payment-to-Contract Link:** Bank transfers (SPEI) and payment receipts live in banking portals, separate from the agreed milestones.

### Goals & Success Metrics
* **Draft-to-Send Speed:** Time from "new contract" to "contract sent with calculated tax and milestones" is < 3 minutes.
* **Rapid Acceptance:** \geq 60% of contracts are signed by clients within 48 hours.
* **Verification Trust:** 100% of generated contracts include a cryptographic SHA-256 digital integrity seal (*Sello de Integridad Digital*) and client OTP validation to minimize repudiation.

---

## 3. User Roles

* **Freelancer (Account Holder):** Registers via email/password, performs fiscal onboarding, selects subscription tier, uploads custom logo/signature branding, drafts contracts with dynamic templates, and approves client signatures.
* **Client (No Account Required):** Receives a secure contract link, verifies their identity via a 6-digit email OTP, signs electronically, and uploads SPEI payment receipts for milestones.

---

## 4. Functional Requirements

### 4.1 Contract Wizard & Templates
* **Dynamic Wizard:** Multi-step interface creating general services, software design, development, and consulting contracts.
* **Granular Milestone Editing:** Freelancers can add, remove, and manually adjust milestone amounts with real-time recalculation of the total budget.
* **Branding Vault:** Freelancers can upload their company logo and digital signature image, which render dynamically in the header and signing block of all generated contracts.
* **Unique Contract IDs:** All contracts must utilize a cryptographically secure random UUID (`crypto.randomUUID()`) to prevent predictable URL scanning and guarantee uniqueness.
* **Print Styling:** Native CSS support (`@media print`) rendering the contract as a clean, standardized PDF document suitable for printing or physical filing. It hides web navigation/headers/buttons and styles the contract text like a professional legal agreement.

### 4.2 Onboarding Subscription Funnel & Gated Caps
* **Subscription Tiers:** The platform supports a three-tier pricing model:
  * **Free Plan ($0 MXN/mo):** Restricted to a cap of **3 contracts maximum**. Custom branding (logo and signature upload) is locked. Standard legal templates only.
  * **Starter Plan (Middle Tier, $99 MXN/mo):** Restricted to a cap of **10 contracts maximum**. Custom branding is unlocked. Standard legal templates.
  * **Pro Plan ($199 MXN/mo):** Unlimited contracts, custom branding unlocked, advanced features (like multiple templates, visual diff comparator, and premium client-signing options).
* **Commercialization Funnel:** The onboarding flow for new users must be a friction-free, high-conversion path:
  1. **Registration:** Account creation via email/password.
  2. **Tier Selection:** Prompt user to select between the Free, Starter, or Pro tiers.
  3. **Stripe Checkout Integration (Paid Tiers):** Redirect Starter/Pro signups to a secure Stripe Checkout page to complete subscription payment.
  4. **Post-Payment Onboarding Wizard:** Immediately redirect the user back to setup their profile (RFC, Fiscal Regimen, Postal Code, Bank details, Phone number) and upload brand assets (logo, signature) if unlocked.
  5. **Subscription sync via webhooks:** Update profile `tier` and access rights via Stripe Webhook events.
* **Enforced Caps:** The creation wizard will check the active contract count against the freelancer's tier limit (3 for Free, 10 for Starter). If they reach the cap, it will display a clean modal outlining their usage and prompting them to upgrade to a higher tier, blocking further contract submissions.

### 4.3 Mexican Tax Compliance (RESICO & Retenciones)
* **RFC Validator:** Strict format check and check-digit validation (Modulo 11 algorithm) for both 13-digit physical persons (*Personas Físicas*) and 12-digit corporate entities (*Personas Morales*). Checks must be enforced on freelancer onboarding and client fields.
* **Dynamic Tax Estimator:** Automatically calculates:
  * **IVA Trasladado (16%)** on the subtotal.
  * **Retención de ISR (10%):** Under the Mexican Income Tax Law for physical-to-moral entity transactions.
  * **Retención de IVA (10.667% / 2/3 partes):** Under the Mexican VAT Law for physical-to-moral entity transactions.
  * Displays a real-time, transparent net payout summary (*Desglose Fiscal Estimado*).

### 4.4 Navigation & App-wide Demo Sandbox Mode
* **Logo Redirection:** Clicking the top-left app logo must always redirect the user to `/`.
* **Persistent Demo Mode:** Demo mode must remain fully active and persistent during local page transitions. 
  * The system must save a `demo_mode=true` cookie (and update `localStorage`) when `?demo=true` is present in the URL, allowing the server middleware to skip auth checks.
  * In Demo mode, users can create contracts and perform all actions utilizing in-memory/localStorage databases.
* **Demo Sign-out:** Signing out removes the `demo_mode` cookie/localStorage and sends the user to `/login`.

### 4.5 Secure OTP Signatures & Double Acceptance Flow
* **Verification (OTP):** Clients must confirm their name and verify their signature using a 6-digit OTP code generated by the system.
* **Double-Acceptance Flow:**
  1. Freelancer sends proposal.
  2. Client reviews and signs via OTP (Contract status: `client_signed`).
  3. Freelancer reviews details and clicks "Approve & Seal" (Contract status: `accepted`). This vetting step avoids legally voidable errors before locking the terms.
* **Digital Integrity Seal:** Generates a unique SHA-256 hash based on the final, accepted contract content. Any subsequent alterations break the hash, ensuring the agreement's immutability.
* **Chronological Audit Trail:** Log records containing exact timestamps, IP addresses, actors, and signatures for all contract state transitions (draft \rightarrow sent \rightarrow client_signed \rightarrow accepted \rightarrow completed).

### 4.6 Revision Proposals on Sealed Contracts
* **Revision Flow:** Even after a contract is sealed (`accepted` / `client_signed`), either party can click a "Propose Revision" button.
* **Status Reversion:** Submitting a revision prompts for a reason, logs it in the audit trail, and transitions the contract status back to `draft` (allowing modifications and requiring a new client OTP sign-off).

### 4.7 In-House Hash Verifier
* **Visual Verifier:** A dedicated page or dashboard card `/hash-verifier` that computes the SHA-256 hash of raw contract text client-side, allowing users to verify their contract's integrity.

### 4.8 Sequential State Machines & Warnings
* **Locked Sequential States:** States cannot be skipped.
  * Contract: `draft` \rightarrow `sent` \rightarrow `client_signed` \rightarrow `accepted` \rightarrow `completed`.
  * Milestone: `pending` \rightarrow `requested` \rightarrow `marked_paid` \rightarrow `confirmed`.
* **Two-Party Payments:** Milestones require both parties' actions: the client uploads payment proof (status: `marked_paid`), and the freelancer verifies it to seal it (status: `confirmed`).
* **Warning Prompts:** Important status changes (like sealing a contract, reverting milestones, or proposing revisions) must trigger warning confirmation boxes outlining the consequences of the state change.

### 4.9 Freelancer Activity & Alerts Center (Future Scope)
* **Alerts Panel:** Provide a visual activity feed/alerts center on the Freelancer's Dashboard.
* **Event Scoping:** Displays dynamic notification updates for key contract events:
  * When a client signs a contract (`client_signed`).
  * When a client proposes/requests a contract revision (`draft` reversion).
  * When a client uploads a SPEI receipt for a milestone (`marked_paid`).

### 4.10 WhatsApp Status Notifications
* **Phone Numbers Storage:** The database and profile fields must capture optional phone numbers:
  * `phone` (TEXT) in Freelancer Profile.
  * `client_phone` (TEXT) in Contract Details.
* **Phone Sanitizer:** Introduce a utility function to format numbers to a raw digit string (e.g., removing spaces, hyphens, and `+` prefixes) to ensure compatibility with WhatsApp URL patterns.
* **WhatsApp Share Link Actions:** Generate pre-filled, context-specific Click-to-Chat WhatsApp links (using `wa.me/<phone>?text=<encoded_text>` when a number is present, or falling back to `api.whatsapp.com/send?text=<encoded_text>` to manually select a contact) for key transitions:
  * **Proposal Sent (`sent`):** "Hola [clientName], te comparto la propuesta de contrato de servicios profesionales por un total de [amount] [currency]. Puedes revisarla y firmar electrónicamente de conformidad aquí: [clientUrl]"
  * **Client Signed (`client_signed`):** (Client notifies Freelancer) "Hola [freelancerName], ya firmé el contrato digitalmente. Por favor, revísalo y valídalo aquí: [clientUrl]"
  * **Contract Accepted (Sealed):** "Hola [clientName], ya validé y firmé de conformidad el contrato. El documento se encuentra sellado con huella digital y activo. Puedes ver tu copia aquí: [clientUrl]"
  * **Milestone Requested (`requested`):** "Hola [clientName], te solicito el pago del hito '[label]' por un monto de $[amount] [currency]. Puedes reportar tu pago de transferencia SPEI adjuntando el comprobante aquí: [clientUrl]"
  * **Payment Proof Uploaded (`marked_paid`):** (Client notifies Freelancer) "Hola [freelancerName], ya realicé la transferencia de $[amount] [currency] para el hito '[label]'. Adjunté el comprobante para tu validación: [clientUrl]"
  * **Milestone Payment Confirmed (`confirmed`):** "Hola [clientName], he verificado y confirmado tu pago de $[amount] [currency] para el hito '[label]'. ¡Muchas gracias!"
  * **Revision Proposed (`draft` reversion):** 
    * By Client: "Hola [freelancerName], solicité una revisión al contrato. Motivo: [reason]. Podemos ajustarlo aquí: [clientUrl]"
    * By Freelancer: "Hola [clientName], actualicé el contrato con cambios y regresó a estado de borrador para tu revisión. Puedes verlo aquí: [clientUrl]"
* **Alert Actions Integration:** Embed these WhatsApp Click-to-Chat sharing quick links directly within the Freelancer Activity Feed cards next to each corresponding notification entry to streamline follow-ups.

---

## 5. Non-Functional & Security Requirements

* **API Key Browser Protection:** The system will inspect JWT payloads in `NEXT_PUBLIC_SUPABASE_ANON_KEY`. If a `service_role` key is accidentally leaked into the browser, it will throw a friendly, localized configuration error instead of a generic crash.
* **Multi-Tenant Isolation:** Row-Level Security (RLS) policies must be fully audited and enabled across all tables, scoping database operations strictly to the active freelancer's ID.
* **Public Endpoint Protection:** Public API routes (such as OTP generation, receipt uploads, and contract accepting) must incorporate strict rate-limiting controls to prevent brute-force attacks and abuse.
* **OTP Brute-Force Rate Limiting:** Introduce verification throttling to block OTP sign-off attempts after 3 invalid attempts.
* **Malicious File Upload Controls:** Enforce mimetype verification, magic byte checks, and file size limits (max 5MB) on milestone SPEI receipt uploads to block remote code execution or DDoS exploits.
* **Performance & Accessibility:** Mobile contract views must load in under 2 seconds on standard 4G connections. Links must use cryptographically secure random UUIDs.

---

## 6. Architecture Stack (v1.2)

* **Frontend:** Next.js (React), Tailwind CSS.
* **Backend:** Next.js API Routes / React Server Actions.
* **Database:** Postgres via Supabase (equipped with Row-Level Security).
* **Auth:** Supabase Auth (scoped to freelancers).
* **Storage:** Supabase Storage (for branding assets and SPEI receipts).
* **Testing:** Playwright for E2E integration suites, Node.js scripts for validation unit tests.

---

## 7. Data Model

### Profiles
* `id` (UUID, PK)
* `email` (TEXT)
* `full_name` (TEXT)
* `rfc` (TEXT)
* `regimen_fiscal` (TEXT)
* `codigo_postal` (TEXT)
* `logo_url` (TEXT)
* `signature_url` (TEXT)
* `tier` (TEXT DEFAULT 'free') -- supports 'free' | 'starter' | 'pro'
* `phone` (TEXT, Nullable)

### Contracts
* `id` (UUID, PK)
* `freelancer_id` (UUID, FK)
* `client_name` (TEXT)
* `client_email` (TEXT)
* `client_rfc` (TEXT)
* `client_regimen` (TEXT)
* `client_postal` (TEXT)
* `client_phone` (TEXT, Nullable)
* `scope_description` (TEXT)
* `total_amount` (NUMERIC)
* `currency` (TEXT)
* `status` (ENUM: `draft`, `sent`, `client_signed`, `accepted`, `completed`, `cancelled`)
* `retencion_isr` (BOOLEAN)
* `retencion_iva` (BOOLEAN)
* `tax_withholding_amount` (NUMERIC)
* `iva_amount` (NUMERIC)
* `subtotal_amount` (NUMERIC)
* `client_otp_code` (TEXT, Nullable)
* `client_otp_verified` (BOOLEAN)
* `contract_hash` (TEXT, Nullable)
* `accepted_by_name` (TEXT, Nullable)
* `accepted_at` (TIMESTAMP, Nullable)
* `accepted_ip` (TEXT, Nullable)

### Milestones
* `id` (UUID, PK)
* `contract_id` (UUID, FK)
* `label` (TEXT)
* `amount` (NUMERIC)
* `due_date` (DATE)
* `status` (ENUM: `pending`, `requested`, `marked_paid`, `confirmed`)
* `receipt_url` (TEXT, Nullable)

### Audit Logs
* `id` (UUID, PK)
* `contract_id` (UUID, FK)
* `action` (TEXT)
* `actor` (TEXT)
* `details` (TEXT)
* `ip` (TEXT)
* `signature` (TEXT, Nullable)
