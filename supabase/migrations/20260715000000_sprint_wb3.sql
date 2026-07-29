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
