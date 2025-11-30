-- FIX: Recrear todas las vistas con security_invoker=on para respetar RLS
-- Esto evita que las vistas expongan datos inadvertidamente al bypassear RLS

-- 1. crm_global_stats
DROP VIEW IF EXISTS public.crm_global_stats;
CREATE VIEW public.crm_global_stats
WITH (security_invoker=on)
AS
SELECT 
  COUNT(*) AS total_leads,
  COUNT(CASE WHEN stage IN ('new', 'lead') THEN 1 END) AS new_leads,
  COUNT(CASE WHEN lead_type = 'hot' THEN 1 END) AS hot_leads,
  COUNT(CASE WHEN stage = 'won' THEN 1 END) AS won_leads,
  COUNT(CASE WHEN stage = 'lost' THEN 1 END) AS lost_leads,
  COALESCE(SUM(estimated_value), 0) AS total_pipeline_value,
  COALESCE(SUM(CASE WHEN stage = 'won' THEN estimated_value END), 0) AS total_won_value,
  COALESCE(AVG(CASE WHEN stage = 'won' THEN estimated_value END), 0) AS avg_deal_size
FROM leads;

-- 2. expenses_by_category_current_month
DROP VIEW IF EXISTS public.expenses_by_category_current_month;
CREATE VIEW public.expenses_by_category_current_month
WITH (security_invoker=on)
AS
SELECT 
  category,
  SUM(amount) AS total_amount,
  COUNT(*) AS transaction_count,
  AVG(amount) AS avg_amount,
  ROUND((SUM(amount) / NULLIF((SELECT SUM(amount) FROM expense_entries WHERE date >= DATE_TRUNC('month', CURRENT_DATE)), 0)) * 100, 2) AS percentage_of_total
FROM expense_entries
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY category
ORDER BY SUM(amount) DESC;

-- 3. marketing_roi_by_channel
DROP VIEW IF EXISTS public.marketing_roi_by_channel;
CREATE VIEW public.marketing_roi_by_channel
WITH (security_invoker=on)
AS
SELECT 
  channel,
  SUM(amount) AS total_spend,
  SUM(leads_generated) AS total_leads,
  SUM(conversions) AS total_conversions,
  SUM(revenue_generated) AS total_revenue,
  CASE WHEN SUM(amount) > 0 THEN ROUND(SUM(revenue_generated) / SUM(amount), 2) ELSE 0 END AS roi_ratio,
  CASE WHEN SUM(conversions) > 0 THEN ROUND(SUM(amount) / SUM(conversions)::NUMERIC, 2) ELSE 0 END AS cac,
  CASE WHEN SUM(leads_generated) > 0 THEN ROUND((SUM(conversions)::NUMERIC / SUM(leads_generated)::NUMERIC) * 100, 2) ELSE 0 END AS conversion_rate
FROM marketing_spend
WHERE date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3 months'
GROUP BY channel
ORDER BY roi_ratio DESC;

-- 4. okr_financial_summary
DROP VIEW IF EXISTS public.okr_financial_summary;
CREATE VIEW public.okr_financial_summary
WITH (security_invoker=on)
AS
SELECT 
  o.id AS objective_id,
  o.title AS objective_title,
  o.budget_allocated,
  o.revenue_impact,
  o.cost_savings,
  COUNT(DISTINCT kr.id) AS key_results_count,
  COUNT(DISTINCT otl.task_id) AS linked_tasks_count,
  COALESCE(SUM(tfi.revenue_generated), 0) AS total_revenue_from_tasks,
  COALESCE(SUM(tfi.cost_incurred), 0) AS total_cost_from_tasks,
  CASE WHEN COALESCE(SUM(tfi.cost_incurred), 0) > 0 
    THEN ((COALESCE(SUM(tfi.revenue_generated), 0) - COALESCE(SUM(tfi.cost_incurred), 0)) / COALESCE(SUM(tfi.cost_incurred), 0)) * 100
    ELSE 0
  END AS roi_percentage
FROM objectives o
LEFT JOIN key_results kr ON kr.objective_id = o.id
LEFT JOIN okr_task_links otl ON otl.key_result_id = kr.id
LEFT JOIN task_financial_impact tfi ON tfi.task_id = otl.task_id
GROUP BY o.id, o.title, o.budget_allocated, o.revenue_impact, o.cost_savings;

-- 5. okrs_with_progress
DROP VIEW IF EXISTS public.okrs_with_progress;
CREATE VIEW public.okrs_with_progress
WITH (security_invoker=on)
AS
SELECT 
  o.id AS objective_id,
  o.title AS objective_title,
  o.description AS objective_description,
  o.quarter,
  o.year,
  o.status AS objective_status,
  o.target_date,
  o.owner_user_id,
  u.full_name AS owner_name,
  calculate_objective_progress(o.id) AS objective_progress,
  COUNT(DISTINCT kr.id) AS total_key_results,
  COUNT(DISTINCT CASE WHEN kr.status = 'achieved' THEN kr.id END) AS achieved_krs,
  COUNT(DISTINCT CASE WHEN kr.status = 'on_track' THEN kr.id END) AS on_track_krs,
  COUNT(DISTINCT CASE WHEN kr.status = 'at_risk' THEN kr.id END) AS at_risk_krs,
  COUNT(DISTINCT CASE WHEN kr.status = 'behind' THEN kr.id END) AS behind_krs,
  COUNT(DISTINCT otl.task_id) AS linked_tasks,
  o.created_at,
  o.updated_at
FROM objectives o
LEFT JOIN users u ON o.owner_user_id = u.id
LEFT JOIN key_results kr ON kr.objective_id = o.id
LEFT JOIN okr_task_links otl ON otl.key_result_id = kr.id
GROUP BY o.id, u.full_name;

-- 6. pipeline_overview
DROP VIEW IF EXISTS public.pipeline_overview;
CREATE VIEW public.pipeline_overview
WITH (security_invoker=on)
AS
SELECT 
  stage,
  COUNT(*) AS count,
  SUM(estimated_value) AS total_value,
  SUM(expected_revenue) AS total_expected,
  AVG(estimated_value) AS avg_value,
  AVG(probability) AS avg_probability
FROM leads
WHERE stage NOT IN ('won', 'lost')
GROUP BY stage
ORDER BY CASE stage
  WHEN 'lead' THEN 1
  WHEN 'qualified' THEN 2
  WHEN 'proposal' THEN 3
  WHEN 'negotiation' THEN 4
END;

-- 7. revenue_by_product_current_month
DROP VIEW IF EXISTS public.revenue_by_product_current_month;
CREATE VIEW public.revenue_by_product_current_month
WITH (security_invoker=on)
AS
SELECT 
  product_category,
  SUM(amount) AS total_revenue,
  SUM(quantity) AS total_quantity,
  AVG(unit_price) AS avg_price,
  COUNT(*) AS order_count,
  ROUND((SUM(amount) / NULLIF((SELECT SUM(amount) FROM revenue_entries WHERE date >= DATE_TRUNC('month', CURRENT_DATE)), 0)) * 100, 2) AS percentage_of_total
FROM revenue_entries
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY product_category
ORDER BY SUM(amount) DESC;

-- 8. user_lead_stats (IMPORTANTE: Esta vista ya está siendo usada en RLS policies, por eso no causa errores pero debe ser security_invoker también)
DROP VIEW IF EXISTS public.user_lead_stats CASCADE;
CREATE VIEW public.user_lead_stats
WITH (security_invoker=on)
AS
SELECT 
  u.id AS user_id,
  u.full_name,
  u.role,
  COUNT(l.id) AS total_leads,
  COUNT(CASE WHEN l.stage = 'won' THEN 1 END) AS won_leads,
  COUNT(CASE WHEN l.lead_type = 'hot' THEN 1 END) AS hot_leads,
  COALESCE(SUM(CASE WHEN l.stage = 'won' THEN l.estimated_value END), 0) AS total_won_value,
  COALESCE(SUM(l.estimated_value), 0) AS total_pipeline_value
FROM users u
LEFT JOIN leads l ON l.created_by = u.id
GROUP BY u.id, u.full_name, u.role
ORDER BY COUNT(l.id) DESC;