-- Migration: Add tier column to profiles table for Sprint WB-1
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro'));
