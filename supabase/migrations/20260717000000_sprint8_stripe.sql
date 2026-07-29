-- Migration: Sprint 8 Stripe Monetization Schema Updates
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_tier_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_tier_check CHECK (tier IN ('free', 'starter', 'pro'));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
