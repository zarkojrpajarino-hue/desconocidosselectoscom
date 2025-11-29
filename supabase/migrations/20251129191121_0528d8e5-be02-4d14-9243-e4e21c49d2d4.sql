-- ============================================
-- SCHEMA: SISTEMA FINANCIERO
-- ============================================

-- TABLA: revenue_entries (Ingresos)
CREATE TABLE IF NOT EXISTS revenue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  product_category TEXT NOT NULL,
  product_name TEXT,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC,
  customer_name TEXT,
  customer_type TEXT,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- TABLA: expense_entries (Gastos)
CREATE TABLE IF NOT EXISTS expense_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT NOT NULL,
  vendor TEXT,
  payment_method TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- TABLA: financial_metrics (Métricas calculadas mensuales)
CREATE TABLE IF NOT EXISTS financial_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month DATE NOT NULL UNIQUE,
  total_revenue NUMERIC DEFAULT 0,
  total_expenses NUMERIC DEFAULT 0,
  gross_margin NUMERIC DEFAULT 0,
  net_margin NUMERIC DEFAULT 0,
  margin_percentage NUMERIC DEFAULT 0,
  burn_rate NUMERIC DEFAULT 0,
  runway_months NUMERIC,
  mrr NUMERIC DEFAULT 0,
  arr NUMERIC DEFAULT 0,
  customer_count INTEGER DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  avg_order_value NUMERIC DEFAULT 0,
  cac NUMERIC,
  ltv NUMERIC,
  ltv_cac_ratio NUMERIC,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: cash_balance (Saldo de caja)
CREATE TABLE IF NOT EXISTS cash_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  balance NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- TABLA: marketing_spend (Gasto en marketing por canal)
CREATE TABLE IF NOT EXISTS marketing_spend (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  channel TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  leads_generated INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue_generated NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- ÍNDICES para optimización
CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_category ON revenue_entries(product_category);
CREATE INDEX IF NOT EXISTS idx_revenue_customer_type ON revenue_entries(customer_type);
CREATE INDEX IF NOT EXISTS idx_expense_date ON expense_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_expense_category ON expense_entries(category);
CREATE INDEX IF NOT EXISTS idx_expense_recurring ON expense_entries(is_recurring);
CREATE INDEX IF NOT EXISTS idx_financial_metrics_month ON financial_metrics(month DESC);
CREATE INDEX IF NOT EXISTS idx_cash_balance_date ON cash_balance(date DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_channel ON marketing_spend(channel);
CREATE INDEX IF NOT EXISTS idx_marketing_date ON marketing_spend(date DESC);

-- FUNCIÓN: Calcular métricas del mes
CREATE OR REPLACE FUNCTION calculate_monthly_metrics(target_month DATE)
RETURNS TABLE(
  total_revenue NUMERIC,
  total_expenses NUMERIC,
  gross_margin NUMERIC,
  margin_percentage NUMERIC,
  customer_count INTEGER,
  new_customers INTEGER,
  avg_order_value NUMERIC
) AS $$
DECLARE
  month_start DATE;
  month_end DATE;
  prev_month_start DATE;
  prev_month_end DATE;
BEGIN
  month_start := DATE_TRUNC('month', target_month)::DATE;
  month_end := (DATE_TRUNC('month', target_month) + INTERVAL '1 month - 1 day')::DATE;
  prev_month_start := (month_start - INTERVAL '1 month')::DATE;
  prev_month_end := (month_start - INTERVAL '1 day')::DATE;
  
  SELECT COALESCE(SUM(amount), 0) INTO total_revenue
  FROM revenue_entries
  WHERE date BETWEEN month_start AND month_end;
  
  SELECT COALESCE(SUM(amount), 0) INTO total_expenses
  FROM expense_entries
  WHERE date BETWEEN month_start AND month_end;
  
  gross_margin := total_revenue - total_expenses;
  
  IF total_revenue > 0 THEN
    margin_percentage := (gross_margin / total_revenue) * 100;
  ELSE
    margin_percentage := 0;
  END IF;
  
  SELECT COUNT(DISTINCT customer_name) INTO customer_count
  FROM revenue_entries
  WHERE date BETWEEN month_start AND month_end
  AND customer_name IS NOT NULL;
  
  SELECT COUNT(DISTINCT r.customer_name) INTO new_customers
  FROM revenue_entries r
  WHERE r.date BETWEEN month_start AND month_end
  AND r.customer_name IS NOT NULL
  AND r.customer_name NOT IN (
    SELECT DISTINCT customer_name 
    FROM revenue_entries 
    WHERE date BETWEEN prev_month_start AND prev_month_end
    AND customer_name IS NOT NULL
  );
  
  SELECT COALESCE(AVG(amount), 0) INTO avg_order_value
  FROM revenue_entries
  WHERE date BETWEEN month_start AND month_end;
  
  RETURN QUERY SELECT 
    calculate_monthly_metrics.total_revenue,
    calculate_monthly_metrics.total_expenses,
    calculate_monthly_metrics.gross_margin,
    calculate_monthly_metrics.margin_percentage,
    calculate_monthly_metrics.customer_count,
    calculate_monthly_metrics.new_customers,
    calculate_monthly_metrics.avg_order_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- FUNCIÓN: Actualizar métricas mensuales
CREATE OR REPLACE FUNCTION update_financial_metrics(target_month DATE)
RETURNS VOID AS $$
DECLARE
  metrics RECORD;
  month_start DATE;
  current_balance NUMERIC;
BEGIN
  month_start := DATE_TRUNC('month', target_month)::DATE;
  
  SELECT * INTO metrics FROM calculate_monthly_metrics(target_month);
  
  SELECT balance INTO current_balance
  FROM cash_balance
  ORDER BY date DESC
  LIMIT 1;
  
  INSERT INTO financial_metrics (
    month,
    total_revenue,
    total_expenses,
    gross_margin,
    net_margin,
    margin_percentage,
    burn_rate,
    runway_months,
    customer_count,
    new_customers,
    avg_order_value
  ) VALUES (
    month_start,
    metrics.total_revenue,
    metrics.total_expenses,
    metrics.gross_margin,
    metrics.gross_margin,
    metrics.margin_percentage,
    metrics.total_expenses,
    CASE 
      WHEN metrics.total_expenses > 0 THEN current_balance / metrics.total_expenses
      ELSE NULL
    END,
    metrics.customer_count,
    metrics.new_customers,
    metrics.avg_order_value
  )
  ON CONFLICT (month) DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    total_expenses = EXCLUDED.total_expenses,
    gross_margin = EXCLUDED.gross_margin,
    net_margin = EXCLUDED.net_margin,
    margin_percentage = EXCLUDED.margin_percentage,
    burn_rate = EXCLUDED.burn_rate,
    runway_months = EXCLUDED.runway_months,
    customer_count = EXCLUDED.customer_count,
    new_customers = EXCLUDED.new_customers,
    avg_order_value = EXCLUDED.avg_order_value,
    calculated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- VISTA: Ingresos por producto este mes
CREATE OR REPLACE VIEW revenue_by_product_current_month AS
SELECT 
  product_category,
  SUM(amount) as total_revenue,
  SUM(quantity) as total_quantity,
  AVG(unit_price) as avg_price,
  COUNT(*) as order_count,
  ROUND(SUM(amount) / NULLIF((SELECT SUM(amount) FROM revenue_entries WHERE date >= DATE_TRUNC('month', CURRENT_DATE)), 0) * 100, 2) as percentage_of_total
FROM revenue_entries
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY product_category
ORDER BY total_revenue DESC;

-- VISTA: Gastos por categoría este mes
CREATE OR REPLACE VIEW expenses_by_category_current_month AS
SELECT 
  category,
  SUM(amount) as total_amount,
  COUNT(*) as transaction_count,
  AVG(amount) as avg_amount,
  ROUND(SUM(amount) / NULLIF((SELECT SUM(amount) FROM expense_entries WHERE date >= DATE_TRUNC('month', CURRENT_DATE)), 0) * 100, 2) as percentage_of_total
FROM expense_entries
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY category
ORDER BY total_amount DESC;

-- VISTA: ROI de marketing por canal
CREATE OR REPLACE VIEW marketing_roi_by_channel AS
SELECT 
  channel,
  SUM(amount) as total_spend,
  SUM(leads_generated) as total_leads,
  SUM(conversions) as total_conversions,
  SUM(revenue_generated) as total_revenue,
  CASE 
    WHEN SUM(amount) > 0 THEN ROUND(SUM(revenue_generated) / SUM(amount), 2)
    ELSE 0
  END as roi_ratio,
  CASE 
    WHEN SUM(conversions) > 0 THEN ROUND(SUM(amount) / SUM(conversions), 2)
    ELSE 0
  END as cac,
  CASE 
    WHEN SUM(leads_generated) > 0 THEN ROUND(SUM(conversions)::NUMERIC / SUM(leads_generated) * 100, 2)
    ELSE 0
  END as conversion_rate
FROM marketing_spend
WHERE date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3 months'
GROUP BY channel
ORDER BY roi_ratio DESC;

-- Políticas de seguridad (RLS)
ALTER TABLE revenue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_spend ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and leaders can view revenue"
  ON revenue_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'leader')
    )
  );

CREATE POLICY "Admins and leaders can manage revenue"
  ON revenue_entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'leader')
    )
  );

CREATE POLICY "Admins and leaders can view expenses"
  ON expense_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'leader')
    )
  );

CREATE POLICY "Admins and leaders can manage expenses"
  ON expense_entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'leader')
    )
  );

CREATE POLICY "Admins and leaders can view metrics"
  ON financial_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'leader')
    )
  );

CREATE POLICY "Admins can manage cash balance"
  ON cash_balance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins and leaders can manage marketing spend"
  ON marketing_spend FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'leader')
    )
  );

-- DATOS DE EJEMPLO (Noviembre 2025)
INSERT INTO revenue_entries (date, amount, product_category, product_name, quantity, unit_price, customer_type)
VALUES 
  ('2025-11-01', 87, 'premium', 'Cesta Premium Deluxe', 1, 87, 'individual'),
  ('2025-11-03', 125, 'personalizadas', 'Cesta Personalizada Bodas', 1, 125, 'individual'),
  ('2025-11-05', 87, 'premium', 'Cesta Premium Deluxe', 1, 87, 'individual'),
  ('2025-11-08', 250, 'personalizadas', 'Cesta Corporativa Personalizada', 2, 125, 'corporativo'),
  ('2025-11-10', 65, 'estandar', 'Cesta Estándar', 1, 65, 'individual'),
  ('2025-11-12', 435, 'premium', 'Cesta Premium Deluxe', 5, 87, 'corporativo'),
  ('2025-11-15', 125, 'personalizadas', 'Cesta Personalizada Aniversario', 1, 125, 'individual'),
  ('2025-11-18', 45, 'basicas', 'Cesta Básica', 1, 45, 'individual'),
  ('2025-11-20', 174, 'premium', 'Cesta Premium Deluxe', 2, 87, 'recurring'),
  ('2025-11-22', 65, 'estandar', 'Cesta Estándar', 1, 65, 'individual'),
  ('2025-11-25', 375, 'personalizadas', 'Cesta Personalizada Empresas', 3, 125, 'corporativo'),
  ('2025-11-27', 87, 'premium', 'Cesta Premium Deluxe', 1, 87, 'individual'),
  ('2025-11-28', 130, 'estandar', 'Cesta Estándar', 2, 65, 'recurring')
ON CONFLICT DO NOTHING;

INSERT INTO expense_entries (date, amount, category, subcategory, description, is_recurring)
VALUES 
  ('2025-11-01', 1200, 'produccion', 'ingredientes', 'Compra ingredientes premium mes noviembre', false),
  ('2025-11-01', 450, 'produccion', 'packaging', 'Cajas y packaging personalizado', false),
  ('2025-11-05', 300, 'marketing', 'ads_instagram', 'Campaña Instagram Stories', false),
  ('2025-11-10', 150, 'marketing', 'ads_facebook', 'Facebook Ads - Retargeting', false),
  ('2025-11-15', 2600, 'salarios', 'equipo', 'Nóminas equipo noviembre', true),
  ('2025-11-15', 89, 'herramientas', 'software', 'Suscripción Canva Pro', true),
  ('2025-11-20', 350, 'produccion', 'ingredientes', 'Reposición ingredientes', false),
  ('2025-11-22', 120, 'operaciones', 'envios', 'Costos de envío mes', false),
  ('2025-11-25', 200, 'marketing', 'ads_instagram', 'Campaña Black Friday', false)
ON CONFLICT DO NOTHING;

INSERT INTO marketing_spend (date, channel, amount, leads_generated, conversions, revenue_generated)
VALUES 
  ('2025-11-01', 'instagram', 300, 45, 30, 2610),
  ('2025-11-01', 'facebook', 150, 38, 9, 783),
  ('2025-11-15', 'organico', 0, 22, 15, 1305),
  ('2025-11-15', 'email', 50, 12, 6, 522)
ON CONFLICT DO NOTHING;

INSERT INTO cash_balance (date, balance, notes)
VALUES 
  ('2025-11-01', 15000, 'Balance inicio noviembre'),
  ('2025-11-29', 18450, 'Balance actual estimado')
ON CONFLICT DO NOTHING;

SELECT update_financial_metrics('2025-11-01');

COMMENT ON TABLE revenue_entries IS 'Registro de todos los ingresos';
COMMENT ON TABLE expense_entries IS 'Registro de todos los gastos';
COMMENT ON TABLE financial_metrics IS 'Métricas financieras calculadas mensualmente';
COMMENT ON TABLE cash_balance IS 'Balance de caja histórico';
COMMENT ON TABLE marketing_spend IS 'Gasto en marketing por canal con ROI';