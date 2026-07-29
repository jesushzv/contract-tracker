-- Migration to add selected_clauses column to contracts
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS selected_clauses TEXT[];
