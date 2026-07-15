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
