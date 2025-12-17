import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleError, createErrorResponse } from "../_shared/errorHandler.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FUNCTION_NAME = 'create-billing-portal';

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return createErrorResponse("No authorization header", 401, corsHeaders);
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return createErrorResponse("Unauthorized", 401, corsHeaders);
    }

    console.log(`[${FUNCTION_NAME}] Processing for user: ${user.id} (requestId: ${requestId})`);

    const { data: userRole, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !userRole) {
      return createErrorResponse("User is not owner of any organization", 403, corsHeaders);
    }

    const { data: org, error: orgError } = await supabaseAdmin
      .from("organizations")
      .select("stripe_customer_id, subscription_status")
      .eq("id", userRole.organization_id)
      .single();

    if (orgError || !org) {
      return createErrorResponse("Organization not found", 404, corsHeaders);
    }

    if (!org.stripe_customer_id) {
      return createErrorResponse("No subscription found for this organization", 404, corsHeaders);
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://optimus-k.com";
    
    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: `${siteUrl}/settings?tab=billing`,
    });

    console.log(`[${FUNCTION_NAME}] ✅ Billing portal session created for organization: ${userRole.organization_id}`);

    return new Response(
      JSON.stringify({ url: session.url, requestId }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    await handleError(error, {
      functionName: FUNCTION_NAME,
      requestId,
      endpoint: '/create-billing-portal',
      method: req.method,
    });

    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500,
      corsHeaders
    );
  }
});
