-- Agregar columnas para el onboarding mejorado de 9 pasos

-- Paso 3: Negocio Detallado (nuevos campos)
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS founded_year integer;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS geographic_market jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS business_model text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS competitive_advantage text;

-- Paso 5: Proceso Comercial (nuevos campos)
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS monthly_leads integer;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS conversion_rate numeric;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS average_ticket numeric;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS monthly_marketing_budget numeric;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS icp_criteria text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS customer_pain_points jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS buying_motivations jsonb DEFAULT '[]'::jsonb;

-- Paso 7: Competencia y Mercado (NUEVO)
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS top_competitors jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS market_size text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS market_growth_rate text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS market_share_goal numeric;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS pricing_strategy text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS brand_perception text;

-- Paso 8: Customer Journey (NUEVO)
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS customer_acquisition_channels jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS research_process text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS main_objections jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS decision_makers text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS purchase_triggers jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS customer_retention_rate numeric;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS repurchase_frequency integer;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS nps_score integer;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS churn_reasons jsonb DEFAULT '[]'::jsonb;

-- Paso 9: Objetivos (nuevos campos)
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS revenue_goal_12_months numeric;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS customers_goal_12_months integer;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS growth_priority text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS urgency text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS budget_constraints text;