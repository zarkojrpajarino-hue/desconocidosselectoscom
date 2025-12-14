import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ToolSuggestionRequest {
  name?: string;
  email?: string;
  toolName: string;
  reason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    let organizationId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;

      if (userId) {
        const { data: userRole } = await supabase
          .from("user_roles")
          .select("organization_id")
          .eq("user_id", userId)
          .single();
        organizationId = userRole?.organization_id || null;
      }
    }

    const { name, email, toolName, reason }: ToolSuggestionRequest = await req.json();

    if (!toolName?.trim()) {
      return new Response(
        JSON.stringify({ error: "Tool name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save to database
    const { data: suggestion, error: dbError } = await supabase
      .from("tool_suggestions")
      .insert({
        organization_id: organizationId,
        user_id: userId,
        name: name?.trim() || null,
        email: email?.trim() || null,
        tool_name: toolName.trim(),
        reason: reason?.trim() || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Error saving suggestion");
    }

    console.log("Suggestion saved:", suggestion.id);

    // Send email notification
    const fromEmail = Deno.env.get("FROM_EMAIL") || "OPTIMUS-K <onboarding@resend.dev>";
    const adminEmail = "info@optimus-k.com";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
          .field { margin-bottom: 20px; }
          .label { font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
          .value { margin-top: 4px; font-size: 16px; color: #1f2937; background: white; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb; }
          .footer { text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💡 Nueva Sugerencia de Herramienta</h1>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Herramienta Solicitada</div>
              <div class="value">${toolName}</div>
            </div>
            ${reason ? `
            <div class="field">
              <div class="label">Motivo / Uso</div>
              <div class="value">${reason}</div>
            </div>
            ` : ''}
            ${name ? `
            <div class="field">
              <div class="label">Nombre</div>
              <div class="value">${name}</div>
            </div>
            ` : ''}
            ${email ? `
            <div class="field">
              <div class="label">Email de Contacto</div>
              <div class="value"><a href="mailto:${email}">${email}</a></div>
            </div>
            ` : ''}
            <div class="field">
              <div class="label">ID de Sugerencia</div>
              <div class="value" style="font-family: monospace; font-size: 12px;">${suggestion.id}</div>
            </div>
          </div>
          <div class="footer">
            OPTIMUS-K • Sugerencia recibida el ${new Date().toLocaleDateString('es-ES', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [adminEmail],
      subject: `💡 Nueva sugerencia: ${toolName}`,
      html: emailHtml,
    });

    console.log("Email sent:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        suggestionId: suggestion.id,
        message: "Sugerencia guardada y notificación enviada" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error processing suggestion";
    console.error("Error in send-tool-suggestion:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
