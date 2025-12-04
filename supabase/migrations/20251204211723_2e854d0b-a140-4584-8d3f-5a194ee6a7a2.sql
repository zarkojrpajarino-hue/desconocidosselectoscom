
-- Fix 1: Move extensions from public to extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pg_cron extension to extensions schema
DROP EXTENSION IF EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA extensions;

-- Move pg_net extension to extensions schema  
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Fix 2: Update functions without search_path set
-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Update can_use_trial function
CREATE OR REPLACE FUNCTION public.can_use_trial(user_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  existing_record trial_email_registry%ROWTYPE;
  result JSON;
BEGIN
  SELECT * INTO existing_record
  FROM trial_email_registry
  WHERE email = LOWER(user_email);
  
  IF existing_record IS NOT NULL THEN
    result := json_build_object(
      'can_use_trial', false,
      'already_used', true,
      'message', 'Este email ya utilizó el periodo de prueba gratuito',
      'used_at', existing_record.first_trial_started_at
    );
  ELSE
    result := json_build_object(
      'can_use_trial', true,
      'already_used', false,
      'message', 'Email válido para trial'
    );
  END IF;
  
  RETURN result;
END;
$function$;

-- Update register_trial_email function
CREATE OR REPLACE FUNCTION public.register_trial_email(
  user_email text, 
  org_id uuid DEFAULT NULL::uuid, 
  user_id_param uuid DEFAULT NULL::uuid, 
  ip_addr text DEFAULT NULL::text, 
  user_agent_param text DEFAULT NULL::text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  new_record trial_email_registry%ROWTYPE;
  result JSON;
BEGIN
  IF EXISTS (SELECT 1 FROM trial_email_registry WHERE email = LOWER(user_email)) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Este email ya tiene un trial registrado'
    );
  END IF;
  
  INSERT INTO trial_email_registry (
    email,
    organization_id,
    user_id,
    ip_address,
    user_agent
  ) VALUES (
    LOWER(user_email),
    org_id,
    user_id_param,
    ip_addr,
    user_agent_param
  )
  RETURNING * INTO new_record;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Trial registrado correctamente',
    'record_id', new_record.id
  );
END;
$function$;

-- Update auto_register_trial_on_org_create function
CREATE OR REPLACE FUNCTION public.auto_register_trial_on_org_create()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_email TEXT;
BEGIN
  IF NEW.plan IN ('trial', 'free') THEN
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = NEW.created_by;
    
    IF user_email IS NOT NULL THEN
      INSERT INTO trial_email_registry (email, organization_id, user_id)
      VALUES (LOWER(user_email), NEW.id, NEW.created_by)
      ON CONFLICT (email) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update slugify function
CREATE OR REPLACE FUNCTION public.slugify(text_input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $function$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        unaccent(text_input),
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  );
END;
$function$;

-- Update calculate_lead_score function
CREATE OR REPLACE FUNCTION public.calculate_lead_score(p_lead_id uuid)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  v_score INTEGER := 0;
  v_lead RECORD;
BEGIN
  SELECT * INTO v_lead FROM leads WHERE id = p_lead_id;
  
  v_score := v_score + CASE v_lead.lead_type
    WHEN 'hot' THEN 40
    WHEN 'warm' THEN 30
    WHEN 'mql' THEN 25
    WHEN 'sql' THEN 35
    WHEN 'cold' THEN 10
    ELSE 0
  END;
  
  IF v_lead.estimated_value >= 10000 THEN
    v_score := v_score + 30;
  ELSIF v_lead.estimated_value >= 5000 THEN
    v_score := v_score + 20;
  ELSIF v_lead.estimated_value >= 1000 THEN
    v_score := v_score + 10;
  END IF;
  
  IF v_lead.probability >= 75 THEN
    v_score := v_score + 20;
  ELSIF v_lead.probability >= 50 THEN
    v_score := v_score + 10;
  END IF;
  
  IF v_lead.last_contact_date IS NOT NULL 
     AND v_lead.last_contact_date > CURRENT_DATE - INTERVAL '7 days' THEN
    v_score := v_score + 10;
  END IF;
  
  IF v_score >= 80 THEN
    RETURN 'A';
  ELSIF v_score >= 60 THEN
    RETURN 'B';
  ELSIF v_score >= 40 THEN
    RETURN 'C';
  ELSE
    RETURN 'D';
  END IF;
END;
$function$;

-- Update calculate_deal_velocity function (overload without threshold)
CREATE OR REPLACE FUNCTION public.calculate_deal_velocity(org_id uuid)
RETURNS TABLE(stage text, average_days numeric, deal_count bigint)
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    l.pipeline_stage::text as stage,
    COALESCE(AVG(l.days_in_current_stage), 0)::numeric as average_days,
    COUNT(*)::bigint as deal_count
  FROM public.leads l
  WHERE l.organization_id = org_id
    AND l.pipeline_stage IS NOT NULL
  GROUP BY l.pipeline_stage;
END;
$function$;

-- Update update_startup_onboarding_updated_at function
CREATE OR REPLACE FUNCTION public.update_startup_onboarding_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Update update_business_metrics_updated_at function
CREATE OR REPLACE FUNCTION public.update_business_metrics_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Update update_organizations_updated_at function
CREATE OR REPLACE FUNCTION public.update_organizations_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Update update_user_roles_updated_at function
CREATE OR REPLACE FUNCTION public.update_user_roles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Update update_country_data_updated_at function
CREATE OR REPLACE FUNCTION public.update_country_data_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
