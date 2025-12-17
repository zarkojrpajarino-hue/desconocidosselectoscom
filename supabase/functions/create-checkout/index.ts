import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { handleError, createErrorResponse } from "../_shared/errorHandler.ts";

const stripe = new Stripe(Deno.env.get('SECRET_KEY_stripe')!, {
  apiVersion: '2024-11-20.acacia',
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FUNCTION_NAME = 'create-checkout';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();

  try {
    const { planName, organizationId } = await req.json();

    if (!planName || !organizationId) {
      return createErrorResponse('Missing planName or organizationId', 400, corsHeaders);
    }

    // Security: Verify user is authenticated and belongs to the organization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('No authorization header provided', 401, corsHeaders);
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);
    
    if (userError || !user) {
      return createErrorResponse('Invalid authentication token', 401, corsHeaders);
    }

    // Verify user has admin role in this organization
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: membership, error: membershipError } = await supabaseService
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (membershipError || !membership) {
      console.error(`[${FUNCTION_NAME}] ❌ User not a member of organization:`, user.id, organizationId);
      return createErrorResponse('You are not a member of this organization', 403, corsHeaders);
    }

    if (membership.role !== 'admin') {
      console.error(`[${FUNCTION_NAME}] ❌ User is not admin:`, user.id, membership.role);
      return createErrorResponse('Only organization admins can manage billing', 403, corsHeaders);
    }

    console.log(`[${FUNCTION_NAME}] ✅ Auth verified: user ${user.id} is admin of org ${organizationId} (requestId: ${requestId})`);

    // Map plan name to actual Stripe price ID
    const planMap: Record<string, string> = {
      'starter': Deno.env.get('STRIPE_PRICE_STARTER') || '',
      'professional': Deno.env.get('STRIPE_PRICE_PROFESIONAL') || '',
      'enterprise': Deno.env.get('STRIPE_PRICE_ENTERPRISE') || ''
    };

    let priceId = planMap[planName.toLowerCase()];
    
    // Sanitize price ID in case it includes a full path like "/v1/prices/..." or a full URL
    if (priceId.startsWith('/v1/prices/')) {
      priceId = priceId.replace('/v1/prices/', '');
    }
    if (priceId.startsWith('https://api.stripe.com/v1/prices/')) {
      priceId = priceId.replace('https://api.stripe.com/v1/prices/', '');
    }
    
    if (!priceId) {
      return createErrorResponse(`Invalid plan name or price ID for plan: ${planName}`, 400, corsHeaders);
    }

    console.log(`[${FUNCTION_NAME}] 🚀 Creating checkout for org: ${organizationId}, plan: ${planName}, priceId: ${priceId}`);

    // Get organization
    const { data: org, error: orgError } = await supabaseService
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      return createErrorResponse('Organization not found', 404, corsHeaders);
    }

    let customerId = org.stripe_customer_id;

    // Create customer if doesn't exist
    if (!customerId) {
      console.log(`[${FUNCTION_NAME}] 👤 Creating new Stripe customer`);
      
      const customer = await stripe.customers.create({
        email: org.contact_email,
        name: org.name,
        metadata: {
          organization_id: organizationId,
        },
      });

      customerId = customer.id;

      // Save customer ID
      await supabaseService
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', organizationId);

      console.log(`[${FUNCTION_NAME}] ✅ Customer created: ${customerId}`);
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
        metadata: {
          organization_id: organizationId,
          plan_name: planName,
        },
      },
      success_url: `${Deno.env.get('APP_URL')}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get('APP_URL')}/pricing?canceled=true`,
      metadata: {
        organization_id: organizationId,
        plan_name: planName,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });

    console.log(`[${FUNCTION_NAME}] ✅ Checkout session created: ${session.id}`);

    return new Response(
      JSON.stringify({ 
        url: session.url,
        sessionId: session.id,
        requestId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    await handleError(error, {
      functionName: FUNCTION_NAME,
      requestId,
      endpoint: '/create-checkout',
      method: req.method,
    });

    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500,
      corsHeaders
    );
  }
});
