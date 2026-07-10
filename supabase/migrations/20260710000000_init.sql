-- Migration: Initialize schema for Contract & Anticipo Tracker (MX)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    rfc VARCHAR(13),
    regimen_fiscal TEXT,
    codigo_postal VARCHAR(5),
    bank_details JSONB DEFAULT '{"clabe": "", "bankName": "", "beneficiaryName": ""}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CONTRACTS TABLE
CREATE TABLE IF NOT EXISTS public.contracts (
    id TEXT PRIMARY KEY,
    freelancer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_rfc VARCHAR(13),
    client_regimen TEXT,
    client_postal VARCHAR(5),
    scope_description TEXT NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'MXN' NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' NOT NULL,
    pdf_url TEXT,
    contract_hash TEXT,
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by_name TEXT,
    accepted_ip TEXT,
    clabe VARCHAR(18),
    bank_name TEXT,
    beneficiary_name TEXT,
    freelancer_rfc VARCHAR(13),
    freelancer_regimen TEXT,
    freelancer_postal VARCHAR(5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- MILESTONES TABLE
CREATE TABLE IF NOT EXISTS public.milestones (
    id TEXT PRIMARY KEY,
    contract_id TEXT REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
    label TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL,
    marked_paid_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    tracking_reference TEXT,
    transferred_amount NUMERIC(12,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to prevent conflicts
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Freelancers can manage their own contracts" ON public.contracts;
DROP POLICY IF EXISTS "Clients can view their contracts" ON public.contracts;
DROP POLICY IF EXISTS "Clients can sign contracts" ON public.contracts;
DROP POLICY IF EXISTS "Freelancers can manage their milestones" ON public.milestones;
DROP POLICY IF EXISTS "Clients can view milestones" ON public.milestones;
DROP POLICY IF EXISTS "Clients can notify transfers" ON public.milestones;

-- Create Policies
CREATE POLICY "Users can manage their own profile" 
ON public.profiles FOR ALL TO authenticated 
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Freelancers can manage their own contracts" 
ON public.contracts FOR ALL TO authenticated 
USING (auth.uid() = freelancer_id) WITH CHECK (auth.uid() = freelancer_id);

CREATE POLICY "Clients can view their contracts" 
ON public.contracts FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Clients can sign contracts" 
ON public.contracts FOR UPDATE TO anon, authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Freelancers can manage their milestones" 
ON public.milestones FOR ALL TO authenticated 
USING (contract_id IN (SELECT id FROM public.contracts WHERE freelancer_id = auth.uid()));

CREATE POLICY "Clients can view milestones" 
ON public.milestones FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Clients can notify transfers" 
ON public.milestones FOR UPDATE TO anon, authenticated
USING (true) WITH CHECK (true);
