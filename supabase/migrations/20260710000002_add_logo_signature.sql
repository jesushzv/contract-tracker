-- Migration: Add logo_url and signature_url to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signature_url TEXT;
