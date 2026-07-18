# Persistent Test Accounts Reference

This document lists the persistent test accounts created in the Supabase database for manual and automated verification of different subscription tiers.

## Accounts Directory

| Email | Password | Subscription Tier | Purpose |
| :--- | :--- | :--- | :--- |
| `test-free@example.com` | `Password12345!` | `free` | Manual limit testing for the **Free** tier |
| `test-starter@example.com` | `Password12345!` | `starter` | Manual testing for the **Starter** (Emprendedor) tier |
| `test-pro@example.com` | `Password12345!` | `pro` | Manual testing for the **Pro** (Profesional) tier |
| `monetization-test@example.com` | `password123` | `free` | E2E automation tests for Stripe checkout & monetization |
| `testlogin@example.com` | `StrongPass1!` | `pro` | E2E automation tests for authentication & login onboarding |
| `admin@example.com` | `Password12345!` | `pro` (Admin) | Manual testing of the admin dashboard / Admin Command Center |
| `jhector.zamora@hotmail.com` | `Password12345!` | `pro` (Admin) | Personal administrative account for testing and validation |



---

## Technical Details

- **Database Table**: Profile settings, customer and subscription associations are tracked in the `public.profiles` table.
- **Persistence**: Unlike temporary verification users (`sdet-user-a@example.com` and `sdet-user-b@example.com`), these accounts are **never deleted** during database seeding and RLS verification.
- **Seeding/Resetting**: To reset or update these test accounts to their default state in the database, run:
  ```bash
  node scripts/setup-test-db.js
  ```
