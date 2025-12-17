-- =============================================
-- 1. TRIGGER: Marketing Spend → Auto-crear Leads en CRM
-- =============================================

CREATE OR REPLACE FUNCTION public.sync_marketing_to_leads()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lead_count INTEGER;
  i INTEGER;
  campaign_source TEXT;
BEGIN
  -- Solo si hay leads generados
  IF NEW.leads_generated IS NOT NULL AND NEW.leads_generated > 0 THEN
    campaign_source := COALESCE(NEW.campaign_name, NEW.channel, 'Marketing Campaign');
    
    -- Crear leads automáticamente
    FOR i IN 1..NEW.leads_generated LOOP
      INSERT INTO leads (
        organization_id,
        name,
        email,
        source,
        stage,
        status,
        notes,
        created_by
      ) VALUES (
        NEW.organization_id,
        'Lead desde ' || campaign_source || ' #' || i,
        NULL, -- Email se completa manualmente
        campaign_source,
        'new',
        'active',
        'Generado automáticamente desde Marketing Spend. Campaña: ' || campaign_source || '. Fecha: ' || NEW.date,
        NEW.created_by
      );
    END LOOP;
    
    -- Registrar en notificaciones
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      category,
      action_url
    )
    SELECT 
      ur.user_id,
      'info',
      '🎯 Nuevos Leads desde Marketing',
      NEW.leads_generated || ' leads creados automáticamente desde campaña ' || campaign_source,
      'crm',
      '/crm'
    FROM user_roles ur
    WHERE ur.organization_id = NEW.organization_id
    AND ur.role = 'admin';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_sync_marketing_to_leads ON marketing_spend;

CREATE TRIGGER trigger_sync_marketing_to_leads
AFTER INSERT ON marketing_spend
FOR EACH ROW
EXECUTE FUNCTION sync_marketing_to_leads();

-- =============================================
-- 2. FUNCIÓN: Detectar cambios críticos CAC/LTV
-- =============================================

CREATE OR REPLACE FUNCTION public.check_kpi_critical_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prev_cac NUMERIC;
  prev_ltv NUMERIC;
  current_cac NUMERIC;
  current_ltv NUMERIC;
  cac_change_pct NUMERIC;
  ltv_cac_ratio NUMERIC;
  alert_message TEXT;
BEGIN
  -- Obtener CAC y LTV anteriores
  SELECT cac, lifetime_value INTO prev_cac, prev_ltv
  FROM business_metrics
  WHERE organization_id = NEW.organization_id
  AND id != NEW.id
  ORDER BY metric_date DESC, created_at DESC
  LIMIT 1;
  
  current_cac := COALESCE(NEW.cac, 0);
  current_ltv := COALESCE(NEW.lifetime_value, 0);
  
  -- Calcular cambio en CAC
  IF prev_cac IS NOT NULL AND prev_cac > 0 AND current_cac > 0 THEN
    cac_change_pct := ((current_cac - prev_cac) / prev_cac) * 100;
    
    -- Alerta si CAC sube más del 20%
    IF cac_change_pct > 20 THEN
      INSERT INTO smart_alerts (
        alert_type,
        severity,
        title,
        message,
        context,
        source,
        category,
        actionable,
        action_label,
        action_url,
        target_role
      ) VALUES (
        'cac_spike',
        'important',
        '📈 CAC Incrementó Significativamente',
        format('Tu CAC subió %s%% (de €%s a €%s). Revisa eficiencia de campañas.',
          ROUND(cac_change_pct),
          ROUND(prev_cac),
          ROUND(current_cac)
        ),
        jsonb_build_object(
          'previous_cac', prev_cac,
          'current_cac', current_cac,
          'change_percentage', cac_change_pct
        ),
        'kpi_monitor',
        'insight',
        true,
        'Analizar Marketing',
        '/business-metrics',
        'admin'
      );
    END IF;
  END IF;
  
  -- Calcular ratio LTV/CAC
  IF current_cac > 0 AND current_ltv > 0 THEN
    ltv_cac_ratio := current_ltv / current_cac;
    
    -- Alerta si LTV/CAC cae por debajo de 3:1
    IF ltv_cac_ratio < 3 THEN
      INSERT INTO smart_alerts (
        alert_type,
        severity,
        title,
        message,
        context,
        source,
        category,
        actionable,
        action_label,
        action_url,
        target_role
      ) VALUES (
        'ltv_cac_warning',
        CASE WHEN ltv_cac_ratio < 2 THEN 'urgent' ELSE 'important' END,
        '⚠️ Ratio LTV/CAC Bajo',
        format('Tu ratio LTV/CAC es %s:1 (debería ser >3:1). Cada cliente no genera suficiente valor vs costo de adquisición.',
          ROUND(ltv_cac_ratio, 1)
        ),
        jsonb_build_object(
          'ltv', current_ltv,
          'cac', current_cac,
          'ratio', ltv_cac_ratio,
          'recommended_ratio', 3
        ),
        'kpi_monitor',
        'risk',
        true,
        'Ver Métricas',
        '/business-metrics',
        'admin'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_check_kpi_critical_changes ON business_metrics;

CREATE TRIGGER trigger_check_kpi_critical_changes
AFTER INSERT OR UPDATE ON business_metrics
FOR EACH ROW
EXECUTE FUNCTION check_kpi_critical_changes();

-- =============================================
-- 3. MEJORAR: Sync revenue más detallado
-- =============================================

CREATE OR REPLACE FUNCTION public.sync_business_metrics_to_financial_v2()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  entry_date DATE;
BEGIN
  entry_date := COALESCE(NEW.metric_date, CURRENT_DATE);
  
  -- Sincronizar revenue con más detalle
  IF NEW.revenue IS NOT NULL AND NEW.revenue > 0 THEN
    INSERT INTO revenue_entries (
      organization_id,
      date,
      amount,
      product_category,
      product_name,
      created_by,
      notes
    ) VALUES (
      NEW.organization_id,
      entry_date,
      NEW.revenue,
      'kpi_ventas',
      'Ventas registradas desde KPIs',
      NEW.user_id,
      format('KPI Ventas: €%s | Ticket Promedio: €%s | Pedidos: %s', 
        ROUND(NEW.revenue::numeric, 2),
        COALESCE(ROUND(NEW.avg_ticket::numeric, 2), 0),
        COALESCE(NEW.orders_count, 0)
      )
    )
    ON CONFLICT DO NOTHING;
    
    -- Notificar
    INSERT INTO notifications (user_id, type, title, message, category, action_url)
    SELECT ur.user_id, 'success', '💰 Ingreso sincronizado', 
      format('€%s registrado en Finanzas desde KPIs', ROUND(NEW.revenue::numeric, 2)),
      'financial', '/financial'
    FROM user_roles ur
    WHERE ur.organization_id = NEW.organization_id AND ur.role = 'admin';
  END IF;
  
  -- Sincronizar costos operacionales
  IF NEW.operational_costs IS NOT NULL AND NEW.operational_costs > 0 THEN
    INSERT INTO expense_entries (
      organization_id,
      date,
      amount,
      category,
      description,
      created_by,
      notes
    ) VALUES (
      NEW.organization_id,
      entry_date,
      NEW.operational_costs,
      'operaciones',
      'Costos operacionales desde KPIs',
      NEW.user_id,
      format('KPI Operaciones: €%s | Capacidad usada: %s%%', 
        ROUND(NEW.operational_costs::numeric, 2),
        COALESCE(NEW.capacity_used, 0)
      )
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update trigger for financial sync
DROP TRIGGER IF EXISTS trigger_sync_business_metrics_to_financial ON business_metrics;

CREATE TRIGGER trigger_sync_business_metrics_to_financial
AFTER INSERT ON business_metrics
FOR EACH ROW
EXECUTE FUNCTION sync_business_metrics_to_financial_v2();