// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import Stripe from 'https://esm.sh/stripe@^15.0.0';
import { serve } from 'std/server';

// CORS helper
function setCorsHeaders(headers: Headers) {
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

serve(async (req) => {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  setCorsHeaders(headers);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    // 1. Parse body
    const body = await req.json();
    const { priceId } = body;
    if (!priceId) {
      return new Response(JSON.stringify({ error: 'Missing priceId' }), { status: 400, headers });
    }

    // 2. Get Stripe secret key from env
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    if (!STRIPE_SECRET_KEY) {
      return new Response(JSON.stringify({ error: 'Stripe secret key not configured' }), { status: 500, headers });
    }
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

    // 3. Get Supabase service role key and project URL from env
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    if (!SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_URL) {
      return new Response(JSON.stringify({ error: 'Supabase env vars not configured' }), { status: 500, headers });
    }
    // Import supabase-js dynamically (Edge Functions)
    const { createClient } = await import('supabase');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 4. Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers });
    }
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid user' }), { status: 401, headers });
    }
    const userId = user.id;
    const userEmail = user.email;

    // 5. Get or create Stripe customer
    let stripeCustomerId: string | null = null;
    // Try to get from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();
    if (profileError && profileError.code !== 'PGRST116') {
      // Not found is ok, but other errors are not
      return new Response(JSON.stringify({ error: 'Failed to fetch user profile' }), { status: 500, headers });
    }
    if (profile && profile.stripe_customer_id) {
      stripeCustomerId = profile.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userEmail || undefined,
        metadata: { supabase_user_id: userId },
      });
      stripeCustomerId = customer.id;
      // Save to profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', userId);
      if (updateError) {
        return new Response(JSON.stringify({ error: 'Failed to update user profile with Stripe customer ID' }), { status: 500, headers });
      }
    }

    // 6. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: 'https://bloomboard.app/success', // TODO: Replace with your app's URL
      cancel_url: 'https://bloomboard.app/cancel',   // TODO: Replace with your app's URL
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      subscription_data: {
        metadata: { supabase_user_id: userId },
      },
      metadata: { supabase_user_id: userId },
    });

    return new Response(JSON.stringify({ sessionId: session.id }), { status: 200, headers });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { status: 500, headers });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create-checkout-session' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
