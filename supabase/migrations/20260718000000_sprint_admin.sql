-- Add is_admin column to profiles
ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;

-- Table for user feedback
CREATE TABLE public.user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('bug', 'feature-request', 'question', 'billing')),
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in-progress', 'resolved', 'archived')),
    admin_reply TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    replied_at TIMESTAMP WITH TIME ZONE
);

-- Table for promo codes
CREATE TABLE public.promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    discount_percent NUMERIC(5,2),
    discount_amount NUMERIC(10,2),
    max_uses INTEGER NOT NULL DEFAULT 100,
    current_uses INTEGER NOT NULL DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    stripe_promotion_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CHECK (discount_percent IS NOT NULL OR discount_amount IS NOT NULL)
);

-- Table for email campaigns
CREATE TABLE public.email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    html_body TEXT NOT NULL,
    target_tier TEXT CHECK (target_tier IN ('free', 'starter', 'pro', 'all')),
    target_status TEXT,
    sent_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

-- User Feedback Policies
-- Users can insert their own feedback
CREATE POLICY "Users can submit their own feedback" ON public.user_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback" ON public.user_feedback
    FOR SELECT USING (auth.uid() = user_id);

-- Note: Admin access for all tables will be handled via Service Role Key
-- The Service Role Key bypasses RLS entirely, so we don't need explicit admin policies here.
