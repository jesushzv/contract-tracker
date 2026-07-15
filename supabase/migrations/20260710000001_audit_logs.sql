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
