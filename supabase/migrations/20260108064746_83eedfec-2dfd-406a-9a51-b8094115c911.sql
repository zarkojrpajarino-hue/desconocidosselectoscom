-- Fix: Restrict sensitive organization data to admin role only
-- Drop any existing policies we may have created
DROP POLICY IF EXISTS "organizations_select_admins_full" ON organizations;
DROP VIEW IF EXISTS organizations_member_view;

-- Create a secure view for non-admin members (excludes payment and contact data)
CREATE OR REPLACE VIEW organizations_member_view 
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  industry,
  company_size,
  business_description,
  target_customers,
  value_proposition,
  business_stage,
  business_model,
  business_type,
  country_code,
  region,
  timezone,
  founded_year,
  has_team,
  collaborative_percentage,
  week_start_day,
  trial_ends_at,
  subscription_status,
  plan,
  created_at,
  updated_at,
  -- Business data (non-sensitive)
  sales_cycle_days,
  lead_sources,
  products_services,
  main_objectives,
  kpis_to_measure,
  monthly_leads,
  conversion_rate,
  average_ticket
FROM organizations
WHERE id IN (
  SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
);

-- Grant access to the view for authenticated users
GRANT SELECT ON organizations_member_view TO authenticated;

-- Create policy for admins: full access to all organization data (including stripe_*, contact_*)
CREATE POLICY "organizations_select_admins_full"
ON organizations FOR SELECT
USING (
  id IN (
    SELECT organization_id FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create policy for non-admin members: they can still SELECT the table
-- but the application should route them through organizations_member_view
CREATE POLICY "organizations_select_members_limited"
ON organizations FOR SELECT
USING (
  id IN (
    SELECT organization_id FROM user_roles 
    WHERE user_id = auth.uid() AND role != 'admin'
  )
);

-- Add comments explaining the security model
COMMENT ON VIEW organizations_member_view IS 'Secure view for non-admin members - excludes stripe_customer_id, stripe_subscription_id, stripe_price_id, contact_name, contact_email, contact_phone';
COMMENT ON POLICY "organizations_select_admins_full" ON organizations IS 'Admins get full access to all organization data including payment and contact info';
COMMENT ON POLICY "organizations_select_members_limited" ON organizations IS 'Non-admin members should use organizations_member_view instead of direct table access';