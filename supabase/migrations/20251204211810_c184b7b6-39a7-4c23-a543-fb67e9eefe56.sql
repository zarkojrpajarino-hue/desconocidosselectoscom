
-- Fix remaining functions without search_path

-- sync_business_metrics_to_financial
CREATE OR REPLACE FUNCTION public.sync_business_metrics_to_financial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  entry_date DATE;
BEGIN
  entry_date := NEW.metric_date;
  
  IF NEW.revenue IS NOT NULL AND NEW.revenue > 0 THEN
    INSERT INTO revenue_entries (
      date,
      amount,
      product_category,
      product_name,
      created_by,
      notes
    ) VALUES (
      entry_date,
      NEW.revenue,
      'kpi_sync',
      'Ingresos desde KPIs',
      NEW.user_id,
      CONCAT('Sincronizado automáticamente desde business_metrics. ', COALESCE(NEW.notes, ''))
    )
    ON CONFLICT (date, product_category, product_name)
    WHERE created_by = NEW.user_id
    DO UPDATE SET
      amount = EXCLUDED.amount,
      notes = EXCLUDED.notes;
  END IF;
  
  IF NEW.operational_costs IS NOT NULL AND NEW.operational_costs > 0 THEN
    INSERT INTO expense_entries (
      date,
      amount,
      category,
      description,
      created_by,
      notes
    ) VALUES (
      entry_date,
      NEW.operational_costs,
      'operaciones',
      'Costos operacionales desde KPIs',
      NEW.user_id,
      CONCAT('Sincronizado automáticamente desde business_metrics. ', COALESCE(NEW.notes, ''))
    )
    ON CONFLICT (date, category, description)
    WHERE created_by = NEW.user_id
    DO UPDATE SET
      amount = EXCLUDED.amount,
      notes = EXCLUDED.notes;
  END IF;
  
  IF NEW.cac IS NOT NULL AND NEW.cac > 0 AND NEW.leads_generated IS NOT NULL THEN
    INSERT INTO marketing_spend (
      date,
      amount,
      channel,
      leads_generated,
      created_by,
      notes
    ) VALUES (
      entry_date,
      NEW.cac * NEW.leads_generated,
      'kpi_sync',
      NEW.leads_generated,
      NEW.user_id,
      CONCAT('Sincronizado desde CAC en KPIs. ', COALESCE(NEW.notes, ''))
    )
    ON CONFLICT (date, channel)
    WHERE created_by = NEW.user_id
    DO UPDATE SET
      amount = EXCLUDED.amount,
      leads_generated = EXCLUDED.leads_generated,
      notes = EXCLUDED.notes;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- notify_task_assigned
CREATE OR REPLACE FUNCTION public.notify_task_assigned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  assigner_name text;
  task_title text;
  task_org_id uuid;
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.user_id = NEW.user_id) THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT full_name INTO assigner_name
  FROM users
  WHERE id = auth.uid()
  LIMIT 1;

  SELECT title, organization_id INTO task_title, task_org_id
  FROM tasks
  WHERE id = NEW.id
  LIMIT 1;

  IF auth.uid() = NEW.user_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO notifications (
    organization_id,
    user_id,
    type,
    title,
    message,
    related_id
  ) VALUES (
    task_org_id,
    NEW.user_id,
    'task_assigned',
    'Nueva tarea asignada',
    COALESCE(assigner_name, 'Alguien') || ' te ha asignado: ' || COALESCE(task_title, 'Nueva tarea'),
    NEW.id
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creando notificación task_assigned: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- notify_task_completed
CREATE OR REPLACE FUNCTION public.notify_task_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  completer_name text;
  task_title text;
  task_org_id uuid;
  task_leader_id uuid;
BEGIN
  IF NEW.completed_by_user = true AND (OLD.completed_by_user IS NULL OR OLD.completed_by_user = false) THEN
    
    SELECT full_name INTO completer_name
    FROM users
    WHERE id = NEW.user_id
    LIMIT 1;

    SELECT t.title, t.organization_id, t.leader_id 
    INTO task_title, task_org_id, task_leader_id
    FROM tasks t
    WHERE t.id = NEW.task_id
    LIMIT 1;

    IF task_leader_id IS NOT NULL AND task_leader_id != NEW.user_id THEN
      INSERT INTO notifications (
        organization_id,
        user_id,
        type,
        title,
        message,
        related_id
      ) VALUES (
        task_org_id,
        task_leader_id,
        'task_completed',
        'Tarea completada',
        COALESCE(completer_name, 'Alguien') || ' ha completado: ' || COALESCE(task_title, 'una tarea'),
        NEW.task_id
      );
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creando notificación task_completed: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- calculate_days_in_stage
CREATE OR REPLACE FUNCTION public.calculate_days_in_stage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.stage IS DISTINCT FROM NEW.stage) OR TG_OP = 'INSERT' THEN
    NEW.days_in_current_stage := 0;
    NEW.last_stage_change := NOW();
  ELSE
    NEW.days_in_current_stage := EXTRACT(DAY FROM (NOW() - COALESCE(NEW.last_stage_change, NOW())));
  END IF;
  RETURN NEW;
END;
$function$;

-- has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- count_organization_users
CREATE OR REPLACE FUNCTION public.count_organization_users(_org_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT COUNT(DISTINCT user_id)::INTEGER
  FROM public.user_roles
  WHERE organization_id = _org_id
$function$;

-- get_user_organization
CREATE OR REPLACE FUNCTION public.get_user_organization(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT organization_id
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$function$;
