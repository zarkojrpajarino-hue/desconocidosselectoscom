import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleError, createErrorResponse } from "../_shared/errorHandler.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const FUNCTION_NAME = "generate-smart-alerts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();

  try {
    // Validate cron secret for scheduled invocations (prevents unauthorized access)
    const cronSecret = req.headers.get("x-cron-secret");
    const expectedSecret = Deno.env.get("CRON_SECRET");
    
    if (!expectedSecret || cronSecret !== expectedSecret) {
      console.error(`[${FUNCTION_NAME}] ❌ Unauthorized: Invalid or missing cron secret`);
      return createErrorResponse("Unauthorized", 401, corsHeaders);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log(`[${FUNCTION_NAME}] 🔄 Generando alertas inteligentes... (requestId: ${requestId})`);

    // Llamar a la función que genera todas las alertas
    const { data, error } = await supabase.rpc("generate_all_smart_alerts");

    if (error) {
      await handleError(error, {
        functionName: FUNCTION_NAME,
        requestId,
        additionalData: { rpc: "generate_all_smart_alerts" },
      });
      throw error;
    }

    console.log(`[${FUNCTION_NAME}] ✅ Alertas generadas exitosamente. Nuevas alertas: ${data}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        newAlerts: data,
        timestamp: new Date().toISOString(),
        requestId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    await handleError(error, {
      functionName: FUNCTION_NAME,
      requestId,
      endpoint: "/generate-smart-alerts",
      method: req.method,
    });

    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500,
      corsHeaders
    );
  }
});
