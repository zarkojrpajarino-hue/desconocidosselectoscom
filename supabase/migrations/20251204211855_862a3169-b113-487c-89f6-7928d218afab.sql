
-- Fix all remaining functions without search_path

-- grant_guide_achievements
CREATE OR REPLACE FUNCTION public.grant_guide_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN NEW;
END;
$function$;

-- list_changes (common Supabase function for audit)
CREATE OR REPLACE FUNCTION public.list_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN NEW;
END;
$function$;

-- log_lead_stage_change
CREATE OR REPLACE FUNCTION public.log_lead_stage_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO lead_stage_history (lead_id, old_stage, new_stage, changed_by)
    VALUES (NEW.id, OLD.stage, NEW.stage, auth.uid());
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$function$;

-- update_brand_tables_updated_at
CREATE OR REPLACE FUNCTION public.update_brand_tables_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- update_guide_metrics
CREATE OR REPLACE FUNCTION public.update_guide_metrics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN NEW;
END;
$function$;

-- update_guide_progress_updated_at
CREATE OR REPLACE FUNCTION public.update_guide_progress_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- update_lead_updated_at
CREATE OR REPLACE FUNCTION public.update_lead_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- update_tool_contents_updated_at
CREATE OR REPLACE FUNCTION public.update_tool_contents_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;
