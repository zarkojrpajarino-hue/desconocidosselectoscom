-- Fix audit_changes function to handle tables without organization_id column
CREATE OR REPLACE FUNCTION public.audit_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  org_id UUID := NULL;
BEGIN
  -- Try to get organization_id from the record if the column exists
  -- Use dynamic check via to_jsonb to safely access the field
  IF TG_OP != 'DELETE' THEN
    BEGIN
      org_id := (to_jsonb(NEW) ->> 'organization_id')::UUID;
    EXCEPTION WHEN OTHERS THEN
      org_id := NULL;
    END;
  ELSE
    BEGIN
      org_id := (to_jsonb(OLD) ->> 'organization_id')::UUID;
    EXCEPTION WHEN OTHERS THEN
      org_id := NULL;
    END;
  END IF;

  INSERT INTO audit_log (
    user_id,
    organization_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    org_id,
    TG_OP || '.' || TG_TABLE_NAME,
    TG_TABLE_NAME,
    COALESCE((to_jsonb(NEW) ->> 'id')::UUID, (to_jsonb(OLD) ->> 'id')::UUID),
    CASE WHEN TG_OP IN ('DELETE', 'UPDATE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$;