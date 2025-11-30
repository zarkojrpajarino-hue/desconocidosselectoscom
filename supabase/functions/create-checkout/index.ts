import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const stripe = new Stripe(Deno.env.get('SECRET_KEY_stripe')!, {
  apiVersion: '2024-11-20.acacia',
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validar que el plan existe
function validatePlan(priceId: string): { valid: boolean; planName: string } {
  const starterPrice = Deno.env.get('STRIPE_PRICE_STARTER');
  const professionalPrice = Deno.env.get('STRIPE_PRICE_PROFESIONAL');
  const enterprisePrice = Deno.env.get('STRIPE_PRICE_ENTERPRISE');

  if (priceId === starterPrice) return { valid: true, planName: 'Starter' };
  if (priceId === professionalPrice) return { valid: true, planName: 'Professional' };
  if (priceId === enterprisePrice) return { valid: true, planName: 'Enterprise' };
  
  return { valid: false, planName: 'Unknown' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { priceId, organizationId } = await req.json();

    if (!priceId || !organizationId) {
      throw new Error('Missing priceId or organizationId');
    }

    // Validar plan
    const planValidation = validatePlan(priceId);
    if (!planValidation.valid) {
      throw new Error(`Invalid priceId: ${priceId}`);
    }

    console.log(`[create-checkout] 🚀 Creating checkout for org: ${organizationId}, plan: ${planValidation.planName}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      throw new Error('Organization not found');
    }

    let customerId = org.stripe_customer_id;

    // Create customer if doesn't exist
    if (!customerId) {
      console.log('[create-checkout] 👤 Creating new Stripe customer');
      
      const customer = await stripe.customers.create({
        email: org.contact_email,
        name: org.name,
        metadata: {
          organization_id: organizationId,
        },
      });

      customerId = customer.id;

      // Save customer ID
      await supabase
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', organizationId);

      console.log(`[create-checkout] ✅ Customer created: ${customerId}`);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 0, // Sin trial adicional
        metadata: {
          organization_id: organizationId,
          plan_name: planValidation.planName,
        },
      },
      success_url: `${Deno.env.get('APP_URL')}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get('APP_URL')}/pricing?canceled=true`,
      metadata: {
        organization_id: organizationId,
        plan_name: planValidation.planName,
      },
      allow_promotion_codes: true, // Permitir códigos de descuento
      billing_address_collection: 'required',
    });

    console.log(`[create-checkout] ✅ Checkout session created: ${session.id}`);

    return new Response(
      JSON.stringify({ 
        url: session.url,
        sessionId: session.id 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('[create-checkout] ❌ Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
