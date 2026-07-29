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
