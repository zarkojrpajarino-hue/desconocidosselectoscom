import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { handleError, createErrorResponse } from "../_shared/errorHandler.ts";

const stripe = new Stripe(Deno.env.get('SECRET_KEY_stripe')!, {
  apiVersion: '2024-11-20.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FUNCTION_NAME = 'stripe-webhook';

// Helper: Map price_id to plan
function getPlanFromPriceId(priceId: string): string {
  const starterPrice = Deno.env.get('STRIPE_PRICE_STARTER');
  const professionalPrice = Deno.env.get('STRIPE_PRICE_PROFESIONAL');
  const enterprisePrice = Deno.env.get('STRIPE_PRICE_ENTERPRISE');

  if (priceId === starterPrice) return 'starter';
  if (priceId === professionalPrice) return 'professional';
  if (priceId === enterprisePrice) return 'enterprise';
  
  console.warn(`[${FUNCTION_NAME}] Unknown price_id: ${priceId}, defaulting to starter`);
  return 'starter';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('WEEBHOOK_SECRET_STRIPE')!;
  
  if (!signature || !webhookSecret) {
    console.error(`[${FUNCTION_NAME}] ❌ Missing signature or secret (requestId: ${requestId})`);
    return createErrorResponse('Missing signature or secret', 400, corsHeaders);
  }

  try {
    const body = await req.text();
    
    // Verify webhook signature
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );

    console.log(`[${FUNCTION_NAME}] 📨 Event received: ${event.type} (requestId: ${requestId})`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log(`[${FUNCTION_NAME}] 💳 Checkout completed: ${session.id}`);
        
        const orgId = session.metadata?.organization_id;
        if (!orgId) {
          console.error(`[${FUNCTION_NAME}] ❌ No organization_id in metadata`);
          break;
        }

        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        const priceId = subscription.items.data[0].price.id;
        const newPlan = getPlanFromPriceId(priceId);

        console.log(`[${FUNCTION_NAME}] 🎯 Activating plan "${newPlan}" for org: ${orgId}`);

        const { error: updateError } = await supabase
          .from('organizations')
          .update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: priceId,
            plan: newPlan,
            subscription_status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            trial_ends_at: null,
          })
          .eq('id', orgId);

        if (updateError) {
          console.error(`[${FUNCTION_NAME}] ❌ Update error:`, updateError);
          break;
        }

        await supabase
          .from('subscription_events')
          .insert({
            organization_id: orgId,
            stripe_event_id: event.id,
            event_type: event.type,
            new_plan: newPlan,
            new_status: subscription.status,
            metadata: { 
              session_id: session.id,
              subscription_id: subscriptionId,
              price_id: priceId 
            },
          });

        console.log(`[${FUNCTION_NAME}] ✅ Organization ${orgId} activated with plan: ${newPlan}`);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        console.log(`[${FUNCTION_NAME}] 🔄 Processing subscription: ${subscription.id}`);
        
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('id, plan')
          .eq('stripe_customer_id', subscription.customer as string)
          .single();

        if (orgError || !org) {
          console.error(`[${FUNCTION_NAME}] ❌ Organization not found for customer:`, subscription.customer);
          break;
        }

        const priceId = subscription.items.data[0].price.id;
        const newPlan = getPlanFromPriceId(priceId);

        console.log(`[${FUNCTION_NAME}] 📝 Updating org ${org.id} to plan: ${newPlan}, status: ${subscription.status}`);

        const { error: updateError } = await supabase
          .from('organizations')
          .update({
            stripe_subscription_id: subscription.id,
            stripe_price_id: priceId,
            plan: newPlan,
            subscription_status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            trial_ends_at: subscription.trial_end 
              ? new Date(subscription.trial_end * 1000).toISOString()
              : null,
          })
          .eq('id', org.id);

        if (updateError) {
          console.error(`[${FUNCTION_NAME}] ❌ Update error:`, updateError);
        }

        await supabase
          .from('subscription_events')
          .insert({
            organization_id: org.id,
            stripe_event_id: event.id,
            event_type: event.type,
            previous_plan: org.plan,
            new_plan: newPlan,
            previous_status: subscription.status === 'active' ? null : 'inactive',
            new_status: subscription.status,
            metadata: { 
              subscription_id: subscription.id,
              price_id: priceId 
            },
          });

        console.log(`[${FUNCTION_NAME}] ✅ Organization updated successfully`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        console.log(`[${FUNCTION_NAME}] 🗑️ Subscription deleted: ${subscription.id}`);

        const { data: org } = await supabase
          .from('organizations')
          .select('id, plan')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (org) {
          await supabase
            .from('organizations')
            .update({
              subscription_status: 'canceled',
              plan: 'free',
            })
            .eq('id', org.id);

          await supabase
            .from('subscription_events')
            .insert({
              organization_id: org.id,
              stripe_event_id: event.id,
              event_type: event.type,
              previous_plan: org.plan,
              new_plan: 'free',
              new_status: 'canceled',
            });

          console.log(`[${FUNCTION_NAME}] ✅ Subscription canceled for org: ${org.id}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[${FUNCTION_NAME}] ✅ Payment succeeded: ${invoice.id} for ${invoice.amount_paid / 100}€`);
        
        if (invoice.subscription) {
          const { data: org } = await supabase
            .from('organizations')
            .select('id, subscription_status')
            .eq('stripe_subscription_id', invoice.subscription as string)
            .maybeSingle();

          if (org && org.subscription_status === 'past_due') {
            await supabase
              .from('organizations')
              .update({ subscription_status: 'active' })
              .eq('id', org.id);

            await supabase
              .from('subscription_events')
              .insert({
                organization_id: org.id,
                stripe_event_id: event.id,
                event_type: event.type,
                previous_status: 'past_due',
                new_status: 'active',
                metadata: { 
                  invoice_id: invoice.id,
                  amount_paid: invoice.amount_paid 
                },
              });

            console.log(`[${FUNCTION_NAME}] ✅ Reactivated org ${org.id} from past_due to active`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[${FUNCTION_NAME}] ⚠️ Payment failed: ${invoice.id}`);
        
        if (invoice.subscription) {
          const { data: org } = await supabase
            .from('organizations')
            .select('id, plan')
            .eq('stripe_subscription_id', invoice.subscription as string)
            .maybeSingle();

          if (org) {
            await supabase
              .from('organizations')
              .update({ subscription_status: 'past_due' })
              .eq('id', org.id);

            await supabase
              .from('subscription_events')
              .insert({
                organization_id: org.id,
                stripe_event_id: event.id,
                event_type: event.type,
                previous_status: 'active',
                new_status: 'past_due',
                metadata: { 
                  invoice_id: invoice.id,
                  amount_due: invoice.amount_due,
                  attempt_count: invoice.attempt_count,
                  next_payment_attempt: invoice.next_payment_attempt 
                },
              });

            console.log(`[${FUNCTION_NAME}] ⚠️ Marked org ${org.id} as past_due and logged event`);
          }
        }
        break;
      }

      default:
        console.log(`[${FUNCTION_NAME}] ℹ️ Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true, event: event.type, requestId }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    await handleError(error, {
      functionName: FUNCTION_NAME,
      requestId,
      endpoint: '/stripe-webhook',
      method: req.method,
    });

    return createErrorResponse(
      error instanceof Error ? error.message : 'Webhook processing error',
      400,
      corsHeaders
    );
  }
});
