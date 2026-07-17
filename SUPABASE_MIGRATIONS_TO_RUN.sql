-- Migration: Add audit logging and double acceptance signature fields

-- 1. Alter contracts table to support double acceptance signatures
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS freelancer_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS freelancer_accepted_by_name TEXT,
ADD COLUMN IF NOT EXISTS freelancer_accepted_ip TEXT;

-- 2. Create audit_logs table for tracking contract histories
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id TEXT REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
    action VARCHAR(50) NOT NULL,
    actor VARCHAR(20) NOT NULL,
    details TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ip TEXT,
    signature TEXT
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
-- Allow freelancers to view audit logs for contracts they own
CREATE POLICY select_audit_logs_freelancer ON public.audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.contracts c
            WHERE c.id = audit_logs.contract_id 
            AND c.freelancer_id = auth.uid()
        )
    );

-- Allow clients to view audit logs of their contracts
CREATE POLICY select_audit_logs_client ON public.audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.contracts c
            WHERE c.id = audit_logs.contract_id
        )
    );
-- Migration: Add logo_url and signature_url to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signature_url TEXT;
-- Migration: Add tax and verification columns for Sprint WA

ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS retencion_isr BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS retencion_iva BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS tax_withholding_amount NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
ADD COLUMN IF NOT EXISTS iva_amount NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
ADD COLUMN IF NOT EXISTS client_otp_code TEXT,
ADD COLUMN IF NOT EXISTS client_otp_verified BOOLEAN DEFAULT false NOT NULL;
-- Migration: Add tier column to profiles table for Sprint WB-1
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro'));
-- Migration: Sprint SEC Security Audit & Hardening

-- 1. Alter contracts table to add client_otp_attempts
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS client_otp_attempts INTEGER DEFAULT 0 NOT NULL;

-- 2. Create rate_limits table
CREATE TABLE IF NOT EXISTS public.rate_limits (
    key TEXT PRIMARY KEY,
    count INTEGER DEFAULT 1 NOT NULL,
    reset_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Enable RLS on rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing RLS policies to prevent conflicts
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Clients can view freelancer profile" ON public.profiles;

DROP POLICY IF EXISTS "Freelancers can manage their own contracts" ON public.contracts;
DROP POLICY IF EXISTS "Clients can view their contracts" ON public.contracts;
DROP POLICY IF EXISTS "Clients can select active contracts" ON public.contracts;
DROP POLICY IF EXISTS "Clients can sign contracts" ON public.contracts;
DROP POLICY IF EXISTS "Clients can update/sign sent contracts" ON public.contracts;

DROP POLICY IF EXISTS "Freelancers can manage their milestones" ON public.milestones;
DROP POLICY IF EXISTS "Clients can view milestones" ON public.milestones;
DROP POLICY IF EXISTS "Clients can view milestones of active contracts" ON public.milestones;
DROP POLICY IF EXISTS "Clients can notify transfers" ON public.milestones;

DROP POLICY IF EXISTS "select_audit_logs_freelancer" ON public.audit_logs;
DROP POLICY IF EXISTS "select_audit_logs_client" ON public.audit_logs;
DROP POLICY IF EXISTS "Clients can view audit logs of active contracts" ON public.audit_logs;
DROP POLICY IF EXISTS "Clients can insert audit logs for active contracts" ON public.audit_logs;

-- 4. Re-create Audited RLS Policies

-- PROFILES
-- Freelancers can manage their own profile
CREATE POLICY "Users can manage their own profile"
ON public.profiles FOR ALL TO authenticated
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Clients (anon) can select profile only if they are viewing an active contract belonging to that freelancer
CREATE POLICY "Clients can view freelancer profile"
ON public.profiles FOR SELECT TO anon
USING (id IN (SELECT freelancer_id FROM public.contracts WHERE status != 'draft'));

-- CONTRACTS
-- Freelancers can manage their own contracts
CREATE POLICY "Freelancers can manage their own contracts"
ON public.contracts FOR ALL TO authenticated
USING (auth.uid() = freelancer_id) WITH CHECK (auth.uid() = freelancer_id);

-- Clients (anon) can view active contracts
CREATE POLICY "Clients can select active contracts"
ON public.contracts FOR SELECT TO anon
USING (status != 'draft');

-- Clients (anon) can update contracts (sign or generate OTP) only when status is 'sent'
CREATE POLICY "Clients can update/sign sent contracts"
ON public.contracts FOR UPDATE TO anon
USING (status = 'sent') WITH CHECK (status = 'sent' OR status = 'client_signed');

-- MILESTONES
-- Freelancers can manage their own milestones
CREATE POLICY "Freelancers can manage their milestones"
ON public.milestones FOR ALL TO authenticated
USING (contract_id IN (SELECT id FROM public.contracts WHERE freelancer_id = auth.uid()));

-- Clients (anon) can view milestones of active contracts
CREATE POLICY "Clients can view milestones of active contracts"
ON public.milestones FOR SELECT TO anon
USING (contract_id IN (SELECT id FROM public.contracts WHERE status != 'draft'));

-- Clients (anon) can notify payment (transition from requested to marked_paid)
CREATE POLICY "Clients can notify transfers"
ON public.milestones FOR UPDATE TO anon
USING (status = 'requested') WITH CHECK (status = 'marked_paid');

-- AUDIT LOGS
-- Freelancers can view audit logs for contracts they own
CREATE POLICY "select_audit_logs_freelancer" ON public.audit_logs
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = audit_logs.contract_id AND c.freelancer_id = auth.uid()));

-- Clients (anon) can view audit logs of active contracts
CREATE POLICY "Clients can view audit logs of active contracts" ON public.audit_logs
FOR SELECT TO anon
USING (contract_id IN (SELECT id FROM public.contracts WHERE status != 'draft'));

-- Clients (anon) can insert audit logs for active contracts
CREATE POLICY "Clients can insert audit logs for active contracts" ON public.audit_logs
FOR INSERT TO anon
WITH CHECK (contract_id IN (SELECT id FROM public.contracts WHERE status IN ('sent', 'client_signed', 'accepted', 'completed')));

-- RATE LIMITS
-- Rate limits table allows anon/authenticated to select/insert/update
CREATE POLICY "Allow select rate limits" ON public.rate_limits FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert rate limits" ON public.rate_limits FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow update rate limits" ON public.rate_limits FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- 5. Storage Buckets & Policies
-- Create bucket for receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if any
DROP POLICY IF EXISTS "Public Access to Receipts" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload to Receipts" ON storage.objects;

-- Create storage policies
CREATE POLICY "Public Access to Receipts" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'receipts');

CREATE POLICY "Public Upload to Receipts" ON storage.objects
FOR INSERT TO public WITH CHECK (bucket_id = 'receipts');
-- Migration: Sprint WB-2 SPEI & Versioning

-- 1. Alter profiles table to add phone
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Alter contracts table to add client_phone
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS client_phone TEXT;

-- 3. Alter milestones table to add exchange_rate and mxn_amount
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC;
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS mxn_amount NUMERIC;

-- 4. Create contract_versions table
CREATE TABLE IF NOT EXISTS public.contract_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id TEXT NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    scope_description TEXT NOT NULL,
    total_amount NUMERIC NOT NULL,
    currency TEXT NOT NULL,
    tax_withholding_amount NUMERIC DEFAULT 0,
    iva_amount NUMERIC DEFAULT 0,
    subtotal_amount NUMERIC DEFAULT 0,
    modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    reason TEXT
);

-- Enable RLS on contract_versions
ALTER TABLE public.contract_versions ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for contract_versions
DROP POLICY IF EXISTS "Freelancers can view versions of their contracts" ON public.contract_versions;
DROP POLICY IF EXISTS "Freelancers can insert versions of their contracts" ON public.contract_versions;
DROP POLICY IF EXISTS "Clients can view versions of active contracts" ON public.contract_versions;

CREATE POLICY "Freelancers can view versions of their contracts" ON public.contract_versions
FOR SELECT TO authenticated
USING (contract_id IN (SELECT id FROM public.contracts WHERE freelancer_id = auth.uid()));

CREATE POLICY "Freelancers can insert versions of their contracts" ON public.contract_versions
FOR INSERT TO authenticated
WITH CHECK (contract_id IN (SELECT id FROM public.contracts WHERE freelancer_id = auth.uid()));

CREATE POLICY "Clients can view versions of active contracts" ON public.contract_versions
FOR SELECT TO anon
USING (contract_id IN (SELECT id FROM public.contracts WHERE status != 'draft'));
-- Migration to add client_access_token column to contracts
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS client_access_token TEXT;
-- Migration: Sprint WB-3 UX & Document Completeness

-- 1. Create payment_profiles table
CREATE TABLE IF NOT EXISTS public.payment_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    freelancer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    nickname TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    clabe TEXT NOT NULL,
    payment_instructions TEXT,
    is_default BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on payment_profiles
ALTER TABLE public.payment_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Alter contracts table to add completion and payment details
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS freelancer_completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS client_completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS payment_profile_id UUID REFERENCES public.payment_profiles(id) ON DELETE SET NULL;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS clabe TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS payment_instructions TEXT;

-- RLS Policies for payment_profiles
CREATE POLICY "Freelancers can manage their payment profiles" ON public.payment_profiles
FOR ALL TO authenticated
USING (freelancer_id = auth.uid())
WITH CHECK (freelancer_id = auth.uid());

CREATE POLICY "Clients can view payment profiles linked to contracts" ON public.payment_profiles
FOR SELECT TO anon
USING (id IN (SELECT payment_profile_id FROM public.contracts));


-- 3. Create edit_requests table
CREATE TABLE IF NOT EXISTS public.edit_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id TEXT NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    requested_by TEXT NOT NULL, -- 'freelancer' | 'client'
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    responded_at TIMESTAMP WITH TIME ZONE,
    responded_by TEXT, -- 'freelancer' | 'client'
    proposed_changes JSONB NOT NULL
);

-- Enable RLS on edit_requests
ALTER TABLE public.edit_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for edit_requests
CREATE POLICY "Freelancers can manage edit requests of their contracts" ON public.edit_requests
FOR ALL TO authenticated
USING (contract_id IN (SELECT id FROM public.contracts WHERE freelancer_id = auth.uid()))
WITH CHECK (contract_id IN (SELECT id FROM public.contracts WHERE freelancer_id = auth.uid()));

CREATE POLICY "Clients can view and manage edit requests of their contracts" ON public.edit_requests
FOR ALL TO anon
USING (contract_id IN (SELECT id FROM public.contracts WHERE status != 'draft'))
WITH CHECK (contract_id IN (SELECT id FROM public.contracts WHERE status != 'draft'));


-- 4. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    contract_id TEXT REFERENCES public.contracts(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Freelancers can view and manage their notifications" ON public.notifications
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());


-- 5. Alter milestones table to add SPEI details
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS receipt_uploaded_by TEXT;
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS spei_reference TEXT;
-- Migration to add selected_clauses column to contracts
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS selected_clauses TEXT[];
-- Migration: Sprint 8 Stripe Monetization Schema Updates
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_tier_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_tier_check CHECK (tier IN ('free', 'starter', 'pro'));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
