-- =====================================================
-- MULTI-TENANCY COMPLETO: organization_id para todas las tablas
-- =====================================================

-- 1. TABLAS FINANCIERAS: Agregar organization_id
ALTER TABLE public.revenue_entries 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

ALTER TABLE public.expense_entries 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

ALTER TABLE public.marketing_spend 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

ALTER TABLE public.cash_balance 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 2. Crear índices
CREATE INDEX IF NOT EXISTS idx_revenue_entries_organization_id ON public.revenue_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_expense_entries_organization_id ON public.expense_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_marketing_spend_organization_id ON public.marketing_spend(organization_id);
CREATE INDEX IF NOT EXISTS idx_cash_balance_organization_id ON public.cash_balance(organization_id);

-- 3. Función helper para verificar si user es admin/leader
CREATE OR REPLACE FUNCTION public.is_admin_or_leader(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = _user_id 
    AND role IN ('admin', 'leader')
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
    AND role = 'admin'
  );
$$;

-- 4. RLS POLICIES FINANCIERAS

-- Revenue Entries
DROP POLICY IF EXISTS "Admins and leaders can manage revenue" ON public.revenue_entries;
DROP POLICY IF EXISTS "Admins and leaders can view revenue" ON public.revenue_entries;

CREATE POLICY "Users can view revenue in their organization"
ON public.revenue_entries FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT ur.organization_id FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage revenue in their organization"
ON public.revenue_entries FOR ALL TO authenticated
USING (
  organization_id IN (
    SELECT ur.organization_id FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  ) AND public.is_admin_or_leader(auth.uid())
)
WITH CHECK (
  organization_id IN (
    SELECT ur.organization_id FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  ) AND public.is_admin_or_leader(auth.uid())
);

-- Expense Entries
DROP POLICY IF EXISTS "Admins and leaders can manage expenses" ON public.expense_entries;
DROP POLICY IF EXISTS "Admins and leaders can view expenses" ON public.expense_entries;

CREATE POLICY "Users can view expenses in their organization"
ON public.expense_entries FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT ur.organization_id FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage expenses in their organization"
ON public.expense_entries FOR ALL TO authenticated
USING (
  organization_id IN (
    SELECT ur.organization_id FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  ) AND public.is_admin_or_leader(auth.uid())
)
WITH CHECK (
  organization_id IN (
    SELECT ur.organization_id FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  ) AND public.is_admin_or_leader(auth.uid())
);

-- Marketing Spend
DROP POLICY IF EXISTS "Admins and leaders can manage marketing spend" ON public.marketing_spend;

CREATE POLICY "Users can view marketing in their organization"
ON public.marketing_spend FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT ur.organization_id FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage marketing in their organization"
ON public.marketing_spend FOR ALL TO authenticated
USING (
  organization_id IN (
    SELECT ur.organization_id FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  ) AND public.is_admin_or_leader(auth.uid())
)
WITH CHECK (
  organization_id IN (
    SELECT ur.organization_id FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  ) AND public.is_admin_or_leader(auth.uid())
);

-- Cash Balance
DROP POLICY IF EXISTS "Admins can manage cash balance" ON public.cash_balance;

CREATE POLICY "Users can view cash balance in their organization"
ON public.cash_balance FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT ur.organization_id FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage cash balance in their organization"
ON public.cash_balance FOR ALL TO authenticated
USING (
  organization_id IN (
    SELECT ur.organization_id FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  ) AND has_role(auth.uid(), 'admin')
)
WITH CHECK (
  organization_id IN (
    SELECT ur.organization_id FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  ) AND has_role(auth.uid(), 'admin')
);

-- 5. SMART ALERTS
DROP POLICY IF EXISTS "Users can view relevant alerts" ON public.smart_alerts;
DROP POLICY IF EXISTS "Users can update their alerts" ON public.smart_alerts;

CREATE POLICY "Users can view alerts in their organization"
ON public.smart_alerts FOR SELECT TO authenticated
USING (
  (target_user_id IS NULL) OR 
  (target_user_id = auth.uid()) OR
  (target_user_id IN (
    SELECT ur.user_id FROM public.user_roles ur 
    WHERE ur.organization_id IN (
      SELECT ur2.organization_id FROM public.user_roles ur2 WHERE ur2.user_id = auth.uid()
    )
  ))
);

CREATE POLICY "Users can update alerts in their organization"
ON public.smart_alerts FOR UPDATE TO authenticated
USING (
  (target_user_id = auth.uid()) OR
  (target_user_id IN (
    SELECT ur.user_id FROM public.user_roles ur 
    WHERE ur.organization_id IN (
      SELECT ur2.organization_id FROM public.user_roles ur2 WHERE ur2.user_id = auth.uid()
    )
  ))
);

-- 6. POINTS HISTORY
DROP POLICY IF EXISTS "Users can view their own points" ON public.points_history;

CREATE POLICY "Users can view points in their organization"
ON public.points_history FOR SELECT TO authenticated
USING (
  user_id IN (
    SELECT ur.user_id FROM public.user_roles ur 
    WHERE ur.organization_id IN (
      SELECT ur2.organization_id FROM public.user_roles ur2 WHERE ur2.user_id = auth.uid()
    )
  )
);

-- 7. FINANCIAL METRICS
ALTER TABLE public.financial_metrics 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

CREATE INDEX IF NOT EXISTS idx_financial_metrics_organization_id ON public.financial_metrics(organization_id);

DROP POLICY IF EXISTS "Admins and leaders can view metrics" ON public.financial_metrics;

CREATE POLICY "Users can view financial metrics in their organization"
ON public.financial_metrics FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT ur.organization_id FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  )
);

-- 8. SALES TARGETS
ALTER TABLE public.sales_targets 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

CREATE INDEX IF NOT EXISTS idx_sales_targets_organization_id ON public.sales_targets(organization_id);

DROP POLICY IF EXISTS "Admins and leaders manage sales targets" ON public.sales_targets;

CREATE POLICY "Users can view sales targets in their organization"
ON public.sales_targets FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT ur.organization_id FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage sales targets in their organization"
ON public.sales_targets FOR ALL TO authenticated
USING (
  organization_id IN (
    SELECT ur.organization_id FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  ) AND public.is_admin_or_leader(auth.uid())
)
WITH CHECK (
  organization_id IN (
    SELECT ur.organization_id FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  ) AND public.is_admin_or_leader(auth.uid())
);