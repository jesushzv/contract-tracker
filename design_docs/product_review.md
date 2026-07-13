# Product Manager Review — Contract & Anticipo Tracker MVP

This review analyzes the proposed feature backlog through a product management lens, evaluating **User Friction vs. Trust**, **Value Proposition Alignment**, and a **RICE Prioritization Matrix** to guide our development roadmap.

---

## 1. Backlog Analysis & RICE Matrix (MVP deliverables status)
We score each item based on **Reach** (1-10), **Impact** (1-3), **Confidence** (1-5), and **Effort** (1-5 where 1 is easiest).
Formula: `RICE Score = (Reach * Impact * Confidence) / Effort`

| Feature | Reach | Impact (Value) | Confidence | Effort (Cost) | RICE Score | Status / Recommendation |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **A. Clickable Wizard Templates** | 10 | 3 | 5 | 1 | **150.0** | **Completed (Sprint 5.5)** |
| **B. Search & Status Filters** | 10 | 2.5 | 5 | 1.5 | **83.3** | **Completed (Sprint 1)** |
| **C. Double-Acceptance (Vetting)**| 9 | 3 | 5 | 2.5 | **54.0** | **Completed (Sprint 2)** |
| **D. Cryptographic Hash Explainer**| 10 | 2 | 4 | 1 | **80.0** | **Completed (Sprint 2)** |
| **E. Printing Style Formats** | 8 | 2 | 5 | 1.5 | **53.3** | **Completed (Sprint 3)** |
| **F. Milestone Reversion Controls**| 6 | 2.5 | 5 | 1.5 | **50.0** | **Completed (Sprint 3)** |
| **G. Audit Trail (Timeline)** | 8 | 2 | 4.5 | 2.5 | **28.8** | **Completed (Sprint 2)** |
| **H. Custom Signature Canvas** | 8 | 2 | 4.5 | 2.5 | **28.8** | **Completed (Sprint 2)** |
| **I. Payment Receipt Uploads** | 7 | 2 | 4.5 | 3 | **21.0** | **Completed (Sprint 3)** |
| **J. Logo & Signature Branding** | 10 | 1.5 | 5 | 2.5 | **30.0** | **Completed (Sprint 4)** |
| **K. Contract Modifications/Diffs**| 4 | 2.5 | 3 | 5 | **6.0** | **Completed (Sprint 4)** |
| **L. Revamped Admin Console** | 2 | 2.5 | 5 | 3.5 | **7.1** | **Completed (Sprint 4)** |

---

## 2. Next Phase (Polishing, Security & SaaS Backlog)

Based on exploratory testing and security feedback, we have scoped a dedicated **Security Audit & Hardening Sprint** (Sprint SEC) alongside the usability polish.

| Feature | Reach | Impact (Value) | Confidence | Effort (Cost) | RICE Score | Recommendation |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **M. Persistent Demo Mode & Cookie**| 10 | 3 | 5 | 1 | **150.0** | **P0 (Immediate UX)** |
| **N. Secure UUID Unique IDs** | 10 | 2 | 5 | 1 | **100.0** | **P0 (Immediate Core)** |
| **O. Subscription Plan Funnel** | 8 | 3 | 5 | 2.5 | **48.0** | **P1 (Core SaaS)** |
| **P. API Key Warning & Troubleshooting**| 10 | 2.5 | 5 | 1.5 | **83.3** | **P1 (Security)** |
| **Q. Revision Proposals Flow** | 8 | 2.5 | 5 | 2.5 | **40.0** | **P1 (Core Logic)** |
| **R. In-House Hash Verifier** | 7 | 2 | 5 | 1.5 | **46.6** | **P1 (Trust)** |
| **S. Sequential States & Locked Payments**| 9 | 2.5 | 5 | 2 | **56.2** | **P1 (Core Logic)** |
| **T. Custom PDF Printer Override** | 8 | 2 | 5 | 2 | **40.0** | **P1 (UX)** |
| **U. Security Audit & Hardening** | 10 | 3 | 5 | 3 | **50.0** | **P1 (Core Security)** |
| **V. Banxico SPEI Reconciliation** | 10 | 3 | 4 | 4 | **30.0** | **P2 (SaaS Automation)** |
| **W. React Email & Resend Alerts** | 10 | 3 | 5 | 2 | **75.0** | **P0 (Immediate SaaS)** |
| **X. Client Magic Access Tokens** | 10 | 3 | 5 | 2 | **75.0** | **P0 (Immediate UX)** |
| **Y. Stripe Subscription Billing** | 8 | 3 | 5 | 4 | **30.0** | **P2 (Monetization)** |
| **Z. WhatsApp Notifications** | 10 | 3 | 5 | 2 | **75.0** | **P0 (Immediate UX)** |
| **AA. Starter Middle-Tier & Funnel** | 8 | 3 | 5 | 3 | **40.0** | **P1 (Core SaaS)** |

---

## 3. Deep Dive: Friction vs. Trust Tradeoffs

### 🔐 The Double-Acceptance Flow (P1) - *Implemented*
* **Verdict:** Approved. Vetting details prevents legally voidable errors.

### 📜 The Cryptographic Hash (P1) & In-House Verifier
* **Verdict:** Supported by an in-house copy-paste integrity verifier tool to increase customer and freelancer trust.

### 🛡️ Audited RLS & File Sanitization (Sprint SEC) - *New*
* **The Tradeoff:** Blocking standard file uploads that fail magic byte verification or rate-limiting clients who fail OTP sign-offs adds friction for edge-case users, but is absolutely critical to protect the database from script injections and malicious payloads.
* **The Verdict:** Mandated. Security is the foundation of digital agreement trust.

---

## 4. Recommended Roadmap

1. **Sprint 1 to 5.5 (Completed): Foundations & Usability**
   - Clickable wizard templates, status tab filters, admin console metrics, branding vaults, Supabase auth, and test suite.
2. **Sprint WA (Completed): Security & Taxes**
   - RFC Validator (Modulo 11), Mexican Tax Estimator, and Client OTP signatures.
3. **Sprint WB-1 (Completed): Polish, Tiers & Security**
   - Persistent demo mode cookies, secure UUIDs, subscription tier funnel + caps, API key browser warnings, revision proposals, hash verifier view, print PDF styles, sequential state checks, and warning confirmation prompts.
4. **Sprint SEC (Completed): Security Audit & Hardening**
   - Complete Supabase RLS policy security audit, public API endpoint rate-limiting controls, client OTP verification brute-force protection, and milestone SPEI receipt malicious file upload controls (magic bytes check, mimetype verification, file size limits).
5. **Sprint WB-2 (Completed): SPEI & Versioning**
   - Banxico SPEI reconciliation tracker, USD FX exchange logging, and database versioning for contract diffs. Include WhatsApp quick actions inside Freelancer Alerts Center.
6. **Sprint SDET (Completed): Robust QA Automation & CI/CD Alignment**
   - Integrate Husky pre-commit hooks, generate unified LCOV coverage reports, and configure a mock Postgres database container for pipeline-friendly migration verification.
7. **Sprint 6 (Pending): WhatsApp, Emails & Magic Links**
   - Client & Freelancer phone integration and contextual WhatsApp Click-to-Chat templates for state changes.
8. **Sprint 8 (Pending): Stripe Payments & SaaS Onboarding Funnel**
   - Three-tier pricing setup (Free, Starter, Pro), registration and Stripe checkout funnel, post-payment onboarding profile setup, and webhook syncing.
