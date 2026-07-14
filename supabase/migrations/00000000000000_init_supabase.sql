-- Create Supabase roles if they don't exist
DO $$ BEGIN
  CREATE ROLE anon NOLOGIN;
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END $$;

DO $$ BEGIN
  CREATE ROLE authenticated NOLOGIN;
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END $$;

-- Create root role with superuser/login privileges to avoid connection failures
DO $$ BEGIN
  CREATE ROLE root WITH SUPERUSER LOGIN;
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END $$;

-- Create storage schema and tables for Supabase
CREATE SCHEMA IF NOT EXISTS storage;

CREATE TABLE IF NOT EXISTS storage.buckets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS storage.objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id TEXT NOT NULL REFERENCES storage.buckets(id),
  name TEXT NOT NULL,
  owner UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
