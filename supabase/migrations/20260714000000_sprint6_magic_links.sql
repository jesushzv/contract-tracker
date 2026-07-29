-- Migration to add client_access_token column to contracts
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS client_access_token TEXT;
