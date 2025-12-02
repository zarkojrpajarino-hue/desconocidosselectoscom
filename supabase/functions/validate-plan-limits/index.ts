import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Plan limits configuration
const PLAN_LIMITS: Record<string, {
  max_users: number;
  max_leads_per_month: number;
  max_okrs: number;
  max_ai_analysis_per_month: number;
}> = {
  trial: {
    max_users: 3,
    max_leads_per_month: 50,
    max_okrs: 3,
    max_ai_analysis_per_month: 5,
  },
  starter: {
    max_users: 10,
    max_leads_per_month: 2000,
    max_okrs: 10,
    max_ai_analysis_per_month: 20,
  },
  professional: {
    max_users: 25,
    max_leads_per_month: -1, // unlimited
    max_okrs: -1,
    max_ai_analysis_per_month: 100,
  },
  enterprise: {
    max_users: -1,
    max_leads_per_month: -1,
    max_okrs: -1,
    max_ai_analysis_per_month: -1,
  }
};

interface ValidationResult {
  allowed: boolean;
  message?: string;
  currentCount?: number;
  limit?: number;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { organizationId, limitType } = await req.json();

    if (!organizationId || !limitType) {
      return new Response(
        JSON.stringify({ error: 'Missing organizationId or limitType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get organization plan
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('plan, subscription_status')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      console.error('Organization fetch error:', orgError);
      return new Response(
        JSON.stringify({ allowed: false, message: 'Organization not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const plan = (org as { plan: string }).plan || 'trial';
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.trial;

    let currentCount = 0;
    let limit = 0;
    let result: ValidationResult = { allowed: true };

    switch (limitType) {
      case 'leads': {
        limit = limits.max_leads_per_month;
        if (limit === -1) {
          result = { allowed: true };
          break;
        }
        
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const { count } = await supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .gte('created_at', startOfMonth.toISOString());
        
        currentCount = count || 0;
        result = currentCount >= limit 
          ? { allowed: false, message: `Lead limit reached (${currentCount}/${limit})`, currentCount, limit }
          : { allowed: true, currentCount, limit };
        break;
      }
      
      case 'users': {
        limit = limits.max_users;
        if (limit === -1) {
          result = { allowed: true };
          break;
        }
        
        const { count } = await supabase
          .from('user_roles')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId);
        
        currentCount = count || 0;
        result = currentCount >= limit
          ? { allowed: false, message: `User limit reached (${currentCount}/${limit})`, currentCount, limit }
          : { allowed: true, currentCount, limit };
        break;
      }
      
      case 'okrs': {
        limit = limits.max_okrs;
        if (limit === -1) {
          result = { allowed: true };
          break;
        }
        
        const { count } = await supabase
          .from('objectives')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId);
        
        currentCount = count || 0;
        result = currentCount >= limit
          ? { allowed: false, message: `OKR limit reached (${currentCount}/${limit})`, currentCount, limit }
          : { allowed: true, currentCount, limit };
        break;
      }
      
      case 'ai_analysis': {
        limit = limits.max_ai_analysis_per_month;
        if (limit === -1) {
          result = { allowed: true };
          break;
        }
        
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const { count } = await supabase
          .from('ai_analysis_results')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .gte('created_at', startOfMonth.toISOString());
        
        currentCount = count || 0;
        result = currentCount >= limit
          ? { allowed: false, message: `AI analysis limit reached (${currentCount}/${limit})`, currentCount, limit }
          : { allowed: true, currentCount, limit };
        break;
      }
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid limitType. Use: leads, users, okrs, ai_analysis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`Limit check: ${limitType} for org ${organizationId} - allowed: ${result.allowed}`);

    return new Response(
      JSON.stringify(result),
      { 
        status: result.allowed ? 200 : 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error validating limit:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
