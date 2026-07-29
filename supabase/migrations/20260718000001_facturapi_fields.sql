-- Add Facturapi multi-tenant fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS facturapi_organization_id TEXT,
ADD COLUMN IF NOT EXISTS facturapi_live_key TEXT;

-- Add SAT code and tax fields to contracts
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS sat_product_code TEXT,
ADD COLUMN IF NOT EXISTS tax_regime_type TEXT;
