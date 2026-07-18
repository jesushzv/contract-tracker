-- Sprint 7: CSD Vault and Facturación Schema

-- Create CSD Credentials table
CREATE TABLE IF NOT EXISTS public.csd_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    freelancer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    certificate_base64 TEXT NOT NULL,
    private_key_encrypted TEXT NOT NULL,
    password_encrypted TEXT NOT NULL,
    rfc VARCHAR(13) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint: Strictly 1-to-1 active CSD per freelancer
CREATE UNIQUE INDEX idx_csd_credentials_active_freelancer ON public.csd_credentials (freelancer_id) WHERE is_active = true;

-- Enable RLS for csd_credentials
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS client_cfdi_use text;
ALTER TABLE public.csd_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Freelancers can insert their own CSD credentials" ON public.csd_credentials
    FOR INSERT WITH CHECK (auth.uid() = freelancer_id);

CREATE POLICY "Freelancers can view their own CSD credentials" ON public.csd_credentials
    FOR SELECT USING (auth.uid() = freelancer_id);

CREATE POLICY "Freelancers can update their own CSD credentials" ON public.csd_credentials
    FOR UPDATE USING (auth.uid() = freelancer_id);

CREATE POLICY "Freelancers can delete their own CSD credentials" ON public.csd_credentials
    FOR DELETE USING (auth.uid() = freelancer_id);

-- Add CFDI tracking columns to milestones
ALTER TABLE public.milestones
ADD COLUMN IF NOT EXISTS cfdi_id TEXT,
ADD COLUMN IF NOT EXISTS cfdi_xml_url TEXT,
ADD COLUMN IF NOT EXISTS cfdi_pdf_url TEXT,
ADD COLUMN IF NOT EXISTS cfdi_status TEXT;

-- Notify Supabase PostgREST of schema changes
NOTIFY pgrst, 'reload schema';
