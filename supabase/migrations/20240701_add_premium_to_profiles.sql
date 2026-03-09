-- Add premium status and Stripe customer ID to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_customer_id text; 