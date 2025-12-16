import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { validateInput, validationErrorResponse, ValidationError, ApiLeadSchema, ApiTaskSchema, z, isUrlSafeForSSRF, sanitizeTextContent } from '../_shared/validation.ts'

// Schema for API v1 lead update (partial - all fields optional)
const ApiLeadUpdateSchema = ApiLeadSchema.partial();

// Schema for API v1 metrics
const ApiMetricsSchema = z.object({
  metric_date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' }).optional(),
  revenue: z.number().nonnegative().max(1_000_000_000).optional(),
  leads_generated: z.number().int().nonnegative().max(1_000_000).optional(),
  conversion_rate: z.number().min(0).max(100).optional(),
  cac: z.number().nonnegative().max(1_000_000).optional(),
  lifetime_value: z.number().nonnegative().max(100_000_000).optional(),
  nps_score: z.number().min(-100).max(100).optional(),
  avg_ticket: z.number().nonnegative().optional(),
  orders_count: z.number().int().nonnegative().optional(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface AuthContext {
  authenticated: boolean;
  organization_id: string;
  scopes: string[];
  api_key_id: string;
}

async function authenticateApiKey(apiKey: string, supabase: any): Promise<AuthContext | null> {
  if (!apiKey || (!apiKey.startsWith('sk_live_') && !apiKey.startsWith('sk_test_'))) {
    return null;
  }

  // Hash API key for lookup
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const { data: apiKeyRecord, error } = await supabase
    .from('api_keys')
    .select('id, organization_id, scopes, rate_limit, is_active, expires_at')
    .eq('key_hash', keyHash)
    .single();

  if (error || !apiKeyRecord || !apiKeyRecord.is_active) {
    return null;
  }

  // Check expiration
  if (apiKeyRecord.expires_at && new Date(apiKeyRecord.expires_at) < new Date()) {
    return null;
  }

  // Check rate limit
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60000);
  
  const { count } = await supabase
    .from('api_usage')
    .select('*', { count: 'exact', head: true })
    .eq('api_key_id', apiKeyRecord.id)
    .gte('created_at', oneMinuteAgo.toISOString());

  if (count && count >= apiKeyRecord.rate_limit) {
    return null; // Rate limited
  }

  // Update last_used_at
  await supabase
    .from('api_keys')
    .update({ last_used_at: now.toISOString() })
    .eq('id', apiKeyRecord.id);

  return {
    authenticated: true,
    organization_id: apiKeyRecord.organization_id,
    scopes: apiKeyRecord.scopes,
    api_key_id: apiKeyRecord.id
  };
}

async function logApiUsage(
  supabase: any, 
  auth: AuthContext, 
  endpoint: string, 
  method: string, 
  statusCode: number, 
  responseTime: number,
  req: Request
) {
  await supabase.from('api_usage').insert({
    api_key_id: auth.api_key_id,
    organization_id: auth.organization_id,
    endpoint,
    method,
    status_code: statusCode,
    response_time_ms: responseTime,
    ip_address: req.headers.get('x-forwarded-for') || 'unknown',
    user_agent: req.headers.get('user-agent')
  });
}

async function triggerWebhook(supabase: any, organizationId: string, event: string, data: any) {
  try {
    const { data: webhooks } = await supabase
      .from('webhooks')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .contains('events', [event]);

    if (!webhooks || webhooks.length === 0) return;

    for (const webhook of webhooks) {
      // SSRF Protection: Validate webhook URL before making request
      if (!isUrlSafeForSSRF(webhook.url)) {
        console.error(`Blocked webhook ${webhook.id}: URL points to internal/private network`);
        continue;
      }
      const payload = {
        event,
        data,
        timestamp: new Date().toISOString(),
        webhook_id: webhook.id
      };

      // Create HMAC signature
      const encoder = new TextEncoder();
      const keyData = encoder.encode(webhook.secret);
      const payloadData = encoder.encode(JSON.stringify(payload));
      
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signature = await crypto.subtle.sign('HMAC', key, payloadData);
      const signatureHex = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Create delivery record
      const { data: delivery } = await supabase
        .from('webhook_deliveries')
        .insert({
          webhook_id: webhook.id,
          event_type: event,
          payload,
          status: 'pending'
        })
        .select()
        .single();

      // Attempt delivery
      const startTime = Date.now();
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signatureHex,
            'X-Webhook-Event': event
          },
          body: JSON.stringify(payload)
        });

        const responseTime = Date.now() - startTime;
        const status = response.ok ? 'delivered' : 'failed';
        const responseBody = await response.text();

        await supabase
          .from('webhook_deliveries')
          .update({
            status,
            http_status_code: response.status,
            response_body: responseBody.substring(0, 1000),
            response_time_ms: responseTime,
            delivered_at: new Date().toISOString()
          })
          .eq('id', delivery.id);

        // Update webhook stats
        await supabase
          .from('webhooks')
          .update({
            total_deliveries: webhook.total_deliveries + 1,
            successful_deliveries: status === 'delivered' 
              ? webhook.successful_deliveries + 1 
              : webhook.successful_deliveries,
            failed_deliveries: status === 'failed'
              ? webhook.failed_deliveries + 1
              : webhook.failed_deliveries,
            last_delivery_at: new Date().toISOString(),
            last_delivery_status: status
          })
          .eq('id', webhook.id);

      } catch (err) {
        // Schedule retry
        const nextRetry = new Date();
        nextRetry.setMinutes(nextRetry.getMinutes() + 5);

        await supabase
          .from('webhook_deliveries')
          .update({
            status: 'failed',
            error_message: err instanceof Error ? err.message : 'Unknown error',
            next_retry_at: nextRetry.toISOString()
          })
          .eq('id', delivery.id);

        await supabase
          .from('webhooks')
          .update({
            total_deliveries: webhook.total_deliveries + 1,
            failed_deliveries: webhook.failed_deliveries + 1,
            last_delivery_at: new Date().toISOString(),
            last_delivery_status: 'failed'
          })
          .eq('id', webhook.id);
      }
    }
  } catch (error) {
    console.error('Webhook trigger error:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const apiKey = req.headers.get('x-api-key') || '';
    const auth = await authenticateApiKey(apiKey, supabase);

    if (!auth) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Invalid or missing API key.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Route: /api-v1/leads or /leads
    const resource = pathParts.find(p => ['leads', 'tasks', 'okrs', 'metrics'].includes(p));
    const resourceIndex = resource ? pathParts.indexOf(resource) : -1;
    const resourceId = resourceIndex >= 0 ? pathParts[resourceIndex + 1] : undefined;

    // === LEADS ENDPOINTS ===
    if (resource === 'leads') {
      // GET /leads - List all leads
      if (req.method === 'GET' && !resourceId) {
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const stage = url.searchParams.get('stage');

        let query = supabase
          .from('leads')
          .select('id, name, email, company, phone, stage, priority, estimated_value, source, created_at, updated_at', { count: 'exact' })
          .eq('organization_id', auth.organization_id)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (stage) {
          query = query.eq('stage', stage);
        }

        const { data, error, count } = await query;

        const responseTime = Date.now() - startTime;
        await logApiUsage(supabase, auth, '/leads', 'GET', error ? 500 : 200, responseTime, req);

        if (error) throw error;

        return new Response(
          JSON.stringify({ data, total: count, limit, offset }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // POST /leads - Create lead
      if (req.method === 'POST' && !resourceId) {
        // Validate write scope
        if (!auth.scopes?.includes('write')) {
          const responseTime = Date.now() - startTime;
          await logApiUsage(supabase, auth, '/leads', 'POST', 403, responseTime, req);
          return new Response(
            JSON.stringify({ error: 'Insufficient scope. Write access required.' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        let body;
        try {
          body = await req.json();
        } catch {
          return new Response(
            JSON.stringify({ error: 'Invalid JSON body' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Validate input with Zod schema
        let validatedData;
        try {
          validatedData = validateInput(ApiLeadSchema, body);
        } catch (validationError: unknown) {
          const responseTime = Date.now() - startTime;
          await logApiUsage(supabase, auth, '/leads', 'POST', 400, responseTime, req);
          if (validationError instanceof ValidationError) {
            return validationErrorResponse(validationError, corsHeaders);
          }
          return new Response(
            JSON.stringify({ error: 'Validation failed' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { data, error } = await supabase
          .from('leads')
          .insert({
            name: validatedData.name,
            email: validatedData.email,
            company: validatedData.company,
            phone: validatedData.phone,
            stage: validatedData.stage || 'new',
            priority: 'medium',
            estimated_value: validatedData.estimated_value,
            source: validatedData.source || 'api',
            notes: validatedData.notes,
            organization_id: auth.organization_id // Always use auth context, never from body
          })
          .select()
          .single();

        const responseTime = Date.now() - startTime;
        await logApiUsage(supabase, auth, '/leads', 'POST', error ? 400 : 201, responseTime, req);

        if (error) throw error;

        // Trigger webhook
        await triggerWebhook(supabase, auth.organization_id, 'lead.created', data);

        return new Response(
          JSON.stringify({ data }),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // GET /leads/:id - Get single lead
      if (req.method === 'GET' && resourceId) {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('id', resourceId)
          .eq('organization_id', auth.organization_id)
          .single();

        const responseTime = Date.now() - startTime;
        await logApiUsage(supabase, auth, `/leads/${resourceId}`, 'GET', error ? 404 : 200, responseTime, req);

        if (error) {
          return new Response(
            JSON.stringify({ error: 'Lead not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ data }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // PUT /leads/:id - Update lead
      if (req.method === 'PUT' && resourceId) {
        // Validate write scope
        if (!auth.scopes?.includes('write')) {
          const responseTime = Date.now() - startTime;
          await logApiUsage(supabase, auth, `/leads/${resourceId}`, 'PUT', 403, responseTime, req);
          return new Response(
            JSON.stringify({ error: 'Insufficient scope. Write access required.' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        let body;
        try {
          body = await req.json();
        } catch {
          return new Response(
            JSON.stringify({ error: 'Invalid JSON body' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Validate input with Zod schema (partial for updates)
        let validatedData;
        try {
          validatedData = validateInput(ApiLeadUpdateSchema, body);
        } catch (validationError: unknown) {
          const responseTime = Date.now() - startTime;
          await logApiUsage(supabase, auth, `/leads/${resourceId}`, 'PUT', 400, responseTime, req);
          if (validationError instanceof ValidationError) {
            return validationErrorResponse(validationError, corsHeaders);
          }
          return new Response(
            JSON.stringify({ error: 'Validation failed' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Remove organization_id from update data to prevent manipulation
        const { organization_id: _ignored, ...safeUpdateData } = validatedData as Record<string, unknown>;
        
        const { data, error } = await supabase
          .from('leads')
          .update(safeUpdateData)
          .eq('id', resourceId)
          .eq('organization_id', auth.organization_id)
          .select()
          .single();

        const responseTime = Date.now() - startTime;
        await logApiUsage(supabase, auth, `/leads/${resourceId}`, 'PUT', error ? 400 : 200, responseTime, req);

        if (error) throw error;

        // Trigger webhook
        await triggerWebhook(supabase, auth.organization_id, 'lead.updated', data);

        return new Response(
          JSON.stringify({ data }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // DELETE /leads/:id - Delete lead
      if (req.method === 'DELETE' && resourceId) {
        // Validate write scope
        if (!auth.scopes?.includes('write')) {
          const responseTime = Date.now() - startTime;
          await logApiUsage(supabase, auth, `/leads/${resourceId}`, 'DELETE', 403, responseTime, req);
          return new Response(
            JSON.stringify({ error: 'Insufficient scope. Write access required.' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const { error } = await supabase
          .from('leads')
          .delete()
          .eq('id', resourceId)
          .eq('organization_id', auth.organization_id);

        const responseTime = Date.now() - startTime;
        await logApiUsage(supabase, auth, `/leads/${resourceId}`, 'DELETE', error ? 404 : 204, responseTime, req);

        if (error) throw error;

        // Trigger webhook
        await triggerWebhook(supabase, auth.organization_id, 'lead.deleted', { id: resourceId });

        return new Response(null, { status: 204, headers: corsHeaders });
      }
    }

    // === TASKS ENDPOINTS ===
    if (resource === 'tasks') {
      // GET /tasks - List tasks
      if (req.method === 'GET' && !resourceId) {
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = parseInt(url.searchParams.get('offset') || '0');

        const { data, error, count } = await supabase
          .from('tasks')
          .select('id, title, description, priority, created_at', { count: 'exact' })
          .eq('organization_id', auth.organization_id)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        const responseTime = Date.now() - startTime;
        await logApiUsage(supabase, auth, '/tasks', 'GET', error ? 500 : 200, responseTime, req);

        if (error) throw error;

        return new Response(
          JSON.stringify({ data, total: count, limit, offset }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // === METRICS ENDPOINTS ===
    if (resource === 'metrics') {
      // GET /metrics - List business metrics
      if (req.method === 'GET' && !resourceId) {
        const limit = parseInt(url.searchParams.get('limit') || '30');

        const { data, error } = await supabase
          .from('business_metrics')
          .select('id, metric_date, revenue, leads_generated, conversion_rate, cac, lifetime_value, nps_score')
          .eq('organization_id', auth.organization_id)
          .order('metric_date', { ascending: false })
          .limit(limit);

        const responseTime = Date.now() - startTime;
        await logApiUsage(supabase, auth, '/metrics', 'GET', error ? 500 : 200, responseTime, req);

        if (error) throw error;

        return new Response(
          JSON.stringify({ data }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // POST /metrics - Create metric
      if (req.method === 'POST' && !resourceId) {
        // Validate write scope
        if (!auth.scopes?.includes('write')) {
          const responseTime = Date.now() - startTime;
          await logApiUsage(supabase, auth, '/metrics', 'POST', 403, responseTime, req);
          return new Response(
            JSON.stringify({ error: 'Insufficient scope. Write access required.' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        let body;
        try {
          body = await req.json();
        } catch {
          return new Response(
            JSON.stringify({ error: 'Invalid JSON body' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Validate input with Zod schema
        let validatedData;
        try {
          validatedData = validateInput(ApiMetricsSchema, body);
        } catch (validationError: unknown) {
          const responseTime = Date.now() - startTime;
          await logApiUsage(supabase, auth, '/metrics', 'POST', 400, responseTime, req);
          if (validationError instanceof ValidationError) {
            return validationErrorResponse(validationError, corsHeaders);
          }
          return new Response(
            JSON.stringify({ error: 'Validation failed' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Get first user from organization for user_id requirement
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('organization_id', auth.organization_id)
          .limit(1)
          .single();

        const { data, error } = await supabase
          .from('business_metrics')
          .insert({
            ...validatedData,
            organization_id: auth.organization_id, // Always from auth context
            user_id: userRole?.user_id
          })
          .select()
          .single();

        const responseTime = Date.now() - startTime;
        await logApiUsage(supabase, auth, '/metrics', 'POST', error ? 400 : 201, responseTime, req);

        if (error) throw error;

        return new Response(
          JSON.stringify({ data }),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 404 Not Found
    return new Response(
      JSON.stringify({ 
        error: 'Endpoint not found',
        available_endpoints: [
          'GET /leads',
          'POST /leads',
          'GET /leads/:id',
          'PUT /leads/:id',
          'DELETE /leads/:id',
          'GET /tasks',
          'GET /metrics',
          'POST /metrics'
        ]
      }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('API Error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
