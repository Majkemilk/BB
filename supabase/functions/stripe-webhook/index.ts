import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log('Received Stripe webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(`Webhook error: ${error.message}`, { status: 400 });
  }
});

async function handleCheckoutSessionCompleted(session: any) {
  console.log('Processing checkout.session.completed:', session.id);
  
  const userId = session.metadata?.supabase_user_id;
  if (!userId) {
    console.error('No supabase_user_id found in session metadata');
    return;
  }

  try {
    // Update user's premium status to true
    const { error } = await supabase
      .from('profiles')
      .update({ is_premium: true })
      .eq('id', userId);

    if (error) {
      console.error('Failed to update premium status:', error);
      throw error;
    }

    console.log(`Successfully updated premium status for user ${userId}`);
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  console.log('Processing customer.subscription.updated:', subscription.id);
  
  const customerId = subscription.customer;
  const isActive = subscription.status === 'active';

  try {
    // Find user by stripe_customer_id
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (fetchError) {
      console.error('Failed to find user by customer ID:', fetchError);
      return;
    }

    // Update premium status based on subscription status
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_premium: isActive })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Failed to update premium status:', updateError);
      throw updateError;
    }

    console.log(`Updated premium status for user ${profile.id}: ${isActive}`);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  console.log('Processing customer.subscription.deleted:', subscription.id);
  
  const customerId = subscription.customer;

  try {
    // Find user by stripe_customer_id
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (fetchError) {
      console.error('Failed to find user by customer ID:', fetchError);
      return;
    }

    // Set premium status to false
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_premium: false })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Failed to update premium status:', updateError);
      throw updateError;
    }

    console.log(`Set premium status to false for user ${profile.id}`);
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
    throw error;
  }
}