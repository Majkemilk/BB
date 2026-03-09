-- Add subscription tracking columns to profiles table
-- These columns are for future use in subscription management

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_status text,
ADD COLUMN IF NOT EXISTS subscription_type text,
ADD COLUMN IF NOT EXISTS subscription_end_date timestamp with time zone;

-- Add comments for clarity
COMMENT ON COLUMN public.profiles.subscription_status IS 'Stripe subscription status: active, canceled, past_due, etc.';
COMMENT ON COLUMN public.profiles.subscription_type IS 'Subscription type: monthly, annual, etc.';
COMMENT ON COLUMN public.profiles.subscription_end_date IS 'When the subscription ends or ended';
