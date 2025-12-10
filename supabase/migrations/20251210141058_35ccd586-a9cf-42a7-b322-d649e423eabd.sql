-- Migration: Financial Anomalies Detection System + Churn Tracking
-- Created: 2024-12-10

-- ============ FINANCIAL ANOMALIES ============

-- 1. Create financial_anomalies table
CREATE TABLE IF NOT EXISTS financial_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  anomaly_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  current_value NUMERIC,
  previous_value NUMERIC,
  threshold_value NUMERIC,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  action_url TEXT,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add indexes
CREATE INDEX IF NOT EXISTS idx_anomalies_org ON financial_anomalies(organization_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_type ON financial_anomalies(anomaly_type);
CREATE INDEX IF NOT EXISTS idx_anomalies_unresolved ON financial_anomalies(organization_id, is_resolved) WHERE is_resolved = false;
CREATE INDEX IF NOT EXISTS idx_anomalies_created ON financial_anomalies(created_at DESC);

-- 3. Enable RLS
ALTER TABLE financial_anomalies ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for financial_anomalies
CREATE POLICY "Users can view anomalies in their org"
  ON financial_anomalies FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can update anomalies"
  ON financial_anomalies FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 5. Function to detect financial anomalies
CREATE OR REPLACE FUNCTION detect_financial_anomalies(p_organization_id UUID)
RETURNS TABLE (
  anomaly_type TEXT, severity TEXT, title TEXT, message TEXT, metric_name TEXT,
  current_value NUMERIC, previous_value NUMERIC, threshold_value NUMERIC, action_url TEXT
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Function to store detected anomalies
CREATE OR REPLACE FUNCTION store_financial_anomalies(p_organization_id UUID)
RETURNS INT AS $$
DECLARE anomaly_record RECORD; inserted_count INT := 0; existing_anomaly UUID;
BEGIN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Trigger for anomalies
CREATE TRIGGER update_anomalies_updated_at BEFORE UPDATE ON financial_anomalies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============ CHURN TRACKING ============

-- 8. Create churn_surveys table
CREATE TABLE IF NOT EXISTS churn_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cancellation_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  plan_before_cancel TEXT NOT NULL,
  mrr_lost NUMERIC,
  reason TEXT NOT NULL,
  reason_detail TEXT,
  reason_category TEXT GENERATED ALWAYS AS (
    CASE reason WHEN 'too_expensive' THEN 'pricing' WHEN 'missing_feature' THEN 'product' WHEN 'too_complex' THEN 'ux' WHEN 'found_alternative' THEN 'competition' WHEN 'no_longer_needed' THEN 'business' ELSE 'other' END
  ) STORED,
  missing_features TEXT[],
  retention_offer_shown BOOLEAN DEFAULT false,
  retention_offer_type TEXT,
  retention_offer_accepted BOOLEAN DEFAULT false,
  discount_percentage INTEGER,
  discount_duration_months INTEGER,
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
  would_recommend BOOLEAN,
  satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
  competitor_name TEXT,
  competitor_better_price BOOLEAN,
  competitor_better_features BOOLEAN,
  follow_up_scheduled BOOLEAN DEFAULT false,
  follow_up_date TIMESTAMPTZ,
  follow_up_notes TEXT,
  win_back_attempted BOOLEAN DEFAULT false,
  win_back_successful BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Add indexes
CREATE INDEX IF NOT EXISTS idx_churn_org ON churn_surveys(organization_id);
CREATE INDEX IF NOT EXISTS idx_churn_user ON churn_surveys(user_id);
CREATE INDEX IF NOT EXISTS idx_churn_date ON churn_surveys(cancellation_date DESC);
CREATE INDEX IF NOT EXISTS idx_churn_reason ON churn_surveys(reason);
CREATE INDEX IF NOT EXISTS idx_churn_retention ON churn_surveys(retention_offer_accepted) WHERE retention_offer_shown = true;

-- 10. Enable RLS
ALTER TABLE churn_surveys ENABLE ROW LEVEL SECURITY;

-- 11. RLS Policies for churn_surveys
CREATE POLICY "Users can view churn surveys in their org" ON churn_surveys FOR SELECT USING (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own churn survey" ON churn_surveys FOR INSERT WITH CHECK (user_id = auth.uid() AND organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Admins can update churn surveys" ON churn_surveys FOR UPDATE USING (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 12. Function to calculate churn rate
CREATE OR REPLACE FUNCTION calculate_churn_rate(p_organization_id UUID, p_period_months INTEGER DEFAULT 1)
RETURNS TABLE (period_start DATE, period_end DATE, total_customers INTEGER, churned_customers INTEGER, churn_rate NUMERIC, mrr_lost NUMERIC) AS $$
BEGIN
  RETURN QUERY
  WITH period_data AS (SELECT DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month' * p_period_months)::DATE AS period_start, DATE_TRUNC('month', CURRENT_DATE)::DATE AS period_end),
  churned AS (SELECT COUNT(*) as churned_count, COALESCE(SUM(cs.mrr_lost), 0) as total_mrr_lost FROM churn_surveys cs, period_data pd WHERE cs.organization_id = p_organization_id AND cs.cancellation_date >= pd.period_start AND cs.cancellation_date < pd.period_end),
  customers AS (SELECT 100 as total_count)
  SELECT pd.period_start, pd.period_end, c.total_count, ch.churned_count::INTEGER, CASE WHEN c.total_count > 0 THEN (ch.churned_count::NUMERIC / c.total_count::NUMERIC) * 100 ELSE 0 END as churn_rate, ch.total_mrr_lost FROM period_data pd, churned ch, customers c;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 13. Function to get churn reasons breakdown
CREATE OR REPLACE FUNCTION get_churn_reasons_breakdown(p_organization_id UUID, p_period_months INTEGER DEFAULT 3)
RETURNS TABLE (reason TEXT, reason_category TEXT, count BIGINT, percentage NUMERIC) AS $$
BEGIN
  RETURN QUERY
  WITH period_churns AS (SELECT cs.reason, cs.reason_category FROM churn_surveys cs WHERE cs.organization_id = p_organization_id AND cs.cancellation_date >= CURRENT_DATE - INTERVAL '1 month' * p_period_months),
  reason_counts AS (SELECT pc.reason, pc.reason_category, COUNT(*) as count FROM period_churns pc GROUP BY pc.reason, pc.reason_category),
  total_count AS (SELECT COUNT(*) as total FROM period_churns)
  SELECT rc.reason, rc.reason_category, rc.count, CASE WHEN tc.total > 0 THEN (rc.count::NUMERIC / tc.total::NUMERIC) * 100 ELSE 0 END as percentage FROM reason_counts rc, total_count tc ORDER BY rc.count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 14. Function to get retention offer success rate
CREATE OR REPLACE FUNCTION get_retention_success_rate(p_organization_id UUID, p_period_months INTEGER DEFAULT 3)
RETURNS TABLE (offer_type TEXT, offers_shown BIGINT, offers_accepted BIGINT, success_rate NUMERIC, mrr_saved NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT cs.retention_offer_type, COUNT(*) as offers_shown, SUM(CASE WHEN cs.retention_offer_accepted THEN 1 ELSE 0 END) as offers_accepted,
    CASE WHEN COUNT(*) > 0 THEN (SUM(CASE WHEN cs.retention_offer_accepted THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)::NUMERIC) * 100 ELSE 0 END as success_rate,
    COALESCE(SUM(CASE WHEN cs.retention_offer_accepted THEN cs.mrr_lost ELSE 0 END), 0) as mrr_saved
  FROM churn_surveys cs WHERE cs.organization_id = p_organization_id AND cs.retention_offer_shown = true AND cs.cancellation_date >= CURRENT_DATE - INTERVAL '1 month' * p_period_months GROUP BY cs.retention_offer_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 15. Trigger for churn surveys
CREATE TRIGGER update_churn_surveys_updated_at BEFORE UPDATE ON churn_surveys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();