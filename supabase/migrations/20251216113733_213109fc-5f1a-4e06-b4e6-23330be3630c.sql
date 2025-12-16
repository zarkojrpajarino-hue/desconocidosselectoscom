-- Add organization membership validation to key RPC functions
-- This adds explicit validation even though RLS provides baseline protection (defense-in-depth)

-- 1. Update detect_stalled_deals to validate organization membership
CREATE OR REPLACE FUNCTION public.detect_stalled_deals(org_id uuid, threshold_days integer DEFAULT 7)
RETURNS TABLE(lead_id uuid, lead_name text, stage text, days_stalled integer, assigned_to uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Validate organization membership
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND organization_id = org_id
  ) THEN
    RAISE EXCEPTION 'Access denied: User is not a member of this organization';
  END IF;

  RETURN QUERY
  SELECT 
    l.id as lead_id,
    l.name::text as lead_name,
    l.pipeline_stage::text as stage,
    COALESCE(l.days_in_current_stage, 0)::integer as days_stalled,
    l.assigned_to
  FROM public.leads l
  WHERE l.organization_id = org_id
    AND l.days_in_current_stage >= threshold_days
    AND l.pipeline_stage NOT IN ('Ganado', 'Perdido')
  ORDER BY l.days_in_current_stage DESC;
END;
$function$;

-- 2. Update detect_financial_anomalies to validate organization membership
CREATE OR REPLACE FUNCTION public.detect_financial_anomalies(p_organization_id uuid)
RETURNS TABLE(anomaly_type text, severity text, title text, message text, metric_name text, current_value numeric, previous_value numeric, threshold_value numeric, action_url text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  current_month_start DATE := DATE_TRUNC('month', CURRENT_DATE);
  prev_month_start DATE := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month');
  prev_month_end DATE := DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day';
  current_revenue NUMERIC; prev_revenue NUMERIC;
  current_expenses NUMERIC; prev_expenses NUMERIC;
  current_burn_rate NUMERIC; prev_burn_rate NUMERIC;
  cash_balance NUMERIC; runway_months NUMERIC;
  revenue_change_pct NUMERIC; burn_rate_change_pct NUMERIC; gross_margin NUMERIC;
BEGIN
  -- Validate organization membership
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND organization_id = p_organization_id
  ) THEN
    RAISE EXCEPTION 'Access denied: User is not a member of this organization';
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO current_revenue FROM revenue_entries WHERE organization_id = p_organization_id AND date >= current_month_start;
  SELECT COALESCE(SUM(amount), 0) INTO prev_revenue FROM revenue_entries WHERE organization_id = p_organization_id AND date >= prev_month_start AND date <= prev_month_end;
  SELECT COALESCE(SUM(amount), 0) INTO current_expenses FROM expense_entries WHERE organization_id = p_organization_id AND date >= current_month_start;
  SELECT COALESCE(SUM(amount), 0) INTO prev_expenses FROM expense_entries WHERE organization_id = p_organization_id AND date >= prev_month_start AND date <= prev_month_end;
  
  current_burn_rate := current_expenses - current_revenue;
  prev_burn_rate := prev_expenses - prev_revenue;
  cash_balance := 100000;
  IF current_burn_rate > 0 THEN runway_months := cash_balance / current_burn_rate; ELSE runway_months := 999; END IF;
  IF prev_revenue > 0 THEN revenue_change_pct := ((current_revenue - prev_revenue) / prev_revenue) * 100; END IF;
  IF prev_burn_rate > 0 THEN burn_rate_change_pct := ((current_burn_rate - prev_burn_rate) / prev_burn_rate) * 100; END IF;
  IF current_revenue > 0 THEN gross_margin := ((current_revenue - current_expenses) / current_revenue) * 100; END IF;
  
  IF burn_rate_change_pct > 50 THEN
    RETURN QUERY SELECT 'burn_rate_spike'::TEXT, 'critical'::TEXT, 'Burn Rate Crítico'::TEXT,
      format('Tu burn rate subió +%s%%. Revisa gastos urgente.', ROUND(burn_rate_change_pct)),
      'burn_rate'::TEXT, current_burn_rate, prev_burn_rate, prev_burn_rate * 1.5, '/financial'::TEXT;
  END IF;
  IF runway_months < 6 AND runway_months > 0 THEN
    RETURN QUERY SELECT 'low_runway'::TEXT, CASE WHEN runway_months < 3 THEN 'critical' ELSE 'high' END::TEXT, 'Runway Bajo'::TEXT,
      format('Runway = %s meses. Considera fundraising.', ROUND(runway_months, 1)),
      'runway_months'::TEXT, runway_months, NULL::NUMERIC, 6::NUMERIC, '/financial'::TEXT;
  END IF;
  IF revenue_change_pct < -20 THEN
    RETURN QUERY SELECT 'revenue_decline'::TEXT, 'high'::TEXT, 'Caída de Revenue'::TEXT,
      format('Revenue bajó -%s%% este mes.', ABS(ROUND(revenue_change_pct))),
      'revenue'::TEXT, current_revenue, prev_revenue, prev_revenue * 0.8, '/financial'::TEXT;
  END IF;
  IF gross_margin < 0 THEN
    RETURN QUERY SELECT 'negative_margin'::TEXT, 'critical'::TEXT, 'Margen Negativo'::TEXT,
      format('Margen: %s%%. Modelo no sostenible.', ROUND(gross_margin)),
      'gross_margin'::TEXT, gross_margin, NULL::NUMERIC, 0::NUMERIC, '/financial'::TEXT;
  END IF;
  RETURN;
END;
$function$;

-- 3. Update calculate_lead_score_enterprise to validate lead belongs to user's organization
CREATE OR REPLACE FUNCTION public.calculate_lead_score_enterprise(p_lead_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_score INTEGER := 0;
  v_lead RECORD;
  v_engagement_count INTEGER;
  v_lead_org_id UUID;
BEGIN
  -- Get lead's organization
  SELECT organization_id INTO v_lead_org_id FROM leads WHERE id = p_lead_id;
  
  -- Validate user has access to this lead's organization
  IF v_lead_org_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND organization_id = v_lead_org_id
  ) THEN
    RAISE EXCEPTION 'Access denied: Lead not found or not in user organization';
  END IF;

  SELECT * INTO v_lead FROM leads WHERE id = p_lead_id;
  
  IF v_lead IS NULL THEN
    RETURN 0;
  END IF;
  
  v_score := v_score + CASE v_lead.source
    WHEN 'referral' THEN 20
    WHEN 'organic' THEN 15
    WHEN 'paid' THEN 10
    ELSE 5
  END;
  
  SELECT COUNT(*) INTO v_engagement_count
  FROM lead_engagement
  WHERE lead_id = p_lead_id
    AND occurred_at > NOW() - INTERVAL '30 days';
  
  v_score := v_score + LEAST(v_engagement_count * 5, 25);
  
  IF v_lead.estimated_value IS NOT NULL THEN
    v_score := v_score + CASE
      WHEN v_lead.estimated_value > 10000 THEN 20
      WHEN v_lead.estimated_value > 5000 THEN 15
      WHEN v_lead.estimated_value > 2000 THEN 10
      ELSE 5
    END;
  END IF;
  
  v_score := v_score + CASE v_lead.pipeline_stage
    WHEN 'closing' THEN 15
    WHEN 'negotiation' THEN 12
    WHEN 'proposal' THEN 8
    ELSE 5
  END;
  
  IF v_lead.updated_at > NOW() - INTERVAL '7 days' THEN
    v_score := v_score + 20;
  ELSIF v_lead.updated_at > NOW() - INTERVAL '14 days' THEN
    v_score := v_score + 10;
  ELSE
    v_score := v_score + 5;
  END IF;
  
  RETURN LEAST(v_score, 100);
END;
$function$;

-- 4. Update store_financial_anomalies to validate organization membership
CREATE OR REPLACE FUNCTION public.store_financial_anomalies(p_organization_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE 
  anomaly_record RECORD; 
  inserted_count INT := 0; 
  existing_anomaly UUID;
BEGIN
  -- Validate organization membership
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND organization_id = p_organization_id
  ) THEN
    RAISE EXCEPTION 'Access denied: User is not a member of this organization';
  END IF;

  FOR anomaly_record IN SELECT * FROM detect_financial_anomalies(p_organization_id) LOOP
    SELECT id INTO existing_anomaly FROM financial_anomalies WHERE organization_id = p_organization_id AND anomaly_type = anomaly_record.anomaly_type AND is_resolved = false AND period_start = DATE_TRUNC('month', CURRENT_DATE) LIMIT 1;
    IF existing_anomaly IS NULL THEN
      INSERT INTO financial_anomalies (organization_id, anomaly_type, severity, title, message, metric_name, current_value, previous_value, threshold_value, period_start, period_end, action_url)
      VALUES (p_organization_id, anomaly_record.anomaly_type, anomaly_record.severity, anomaly_record.title, anomaly_record.message, anomaly_record.metric_name, anomaly_record.current_value, anomaly_record.previous_value, anomaly_record.threshold_value, DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', anomaly_record.action_url);
      inserted_count := inserted_count + 1;
    END IF;
  END LOOP;
  RETURN inserted_count;
END;
$function$;

-- 5. Update calculate_churn_rate to validate organization membership
CREATE OR REPLACE FUNCTION public.calculate_churn_rate(p_organization_id uuid, p_period_months integer DEFAULT 1)
RETURNS TABLE(period_start date, period_end date, total_customers integer, churned_customers integer, churn_rate numeric, mrr_lost numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Validate organization membership
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND organization_id = p_organization_id
  ) THEN
    RAISE EXCEPTION 'Access denied: User is not a member of this organization';
  END IF;

  RETURN QUERY
  WITH period_data AS (SELECT DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month' * p_period_months)::DATE AS period_start, DATE_TRUNC('month', CURRENT_DATE)::DATE AS period_end),
  churned AS (SELECT COUNT(*) as churned_count, COALESCE(SUM(cs.mrr_lost), 0) as total_mrr_lost FROM churn_surveys cs, period_data pd WHERE cs.organization_id = p_organization_id AND cs.cancellation_date >= pd.period_start AND cs.cancellation_date < pd.period_end),
  customers AS (SELECT 100 as total_count)
  SELECT pd.period_start, pd.period_end, c.total_count, ch.churned_count::INTEGER, CASE WHEN c.total_count > 0 THEN (ch.churned_count::NUMERIC / c.total_count::NUMERIC) * 100 ELSE 0 END as churn_rate, ch.total_mrr_lost FROM period_data pd, churned ch, customers c;
END;
$function$;

-- 6. Update get_churn_reasons_breakdown to validate organization membership
CREATE OR REPLACE FUNCTION public.get_churn_reasons_breakdown(p_organization_id uuid, p_period_months integer DEFAULT 3)
RETURNS TABLE(reason text, reason_category text, count bigint, percentage numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Validate organization membership
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND organization_id = p_organization_id
  ) THEN
    RAISE EXCEPTION 'Access denied: User is not a member of this organization';
  END IF;

  RETURN QUERY
  WITH period_churns AS (SELECT cs.reason, cs.reason_category FROM churn_surveys cs WHERE cs.organization_id = p_organization_id AND cs.cancellation_date >= CURRENT_DATE - INTERVAL '1 month' * p_period_months),
  reason_counts AS (SELECT pc.reason, pc.reason_category, COUNT(*) as count FROM period_churns pc GROUP BY pc.reason, pc.reason_category),
  total_count AS (SELECT COUNT(*) as total FROM period_churns)
  SELECT rc.reason, rc.reason_category, rc.count, CASE WHEN tc.total > 0 THEN (rc.count::NUMERIC / tc.total::NUMERIC) * 100 ELSE 0 END as percentage FROM reason_counts rc, total_count tc ORDER BY rc.count DESC;
END;
$function$;