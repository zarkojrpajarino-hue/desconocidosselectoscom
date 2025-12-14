-- ═══════════════════════════════════════════════════════════════════════════
-- FIX: get_user_organizations - Bug de slug
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_user_organizations(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  plan TEXT,
  subscription_status TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  is_owner BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    -- Generar slug desde name: lowercase y reemplazar espacios con guiones
    LOWER(REPLACE(COALESCE(o.name, ''), ' ', '-'))::TEXT as slug,
    o.plan,
    o.subscription_status,
    o.current_period_end,
    o.created_at,
    (o.created_by = p_user_id) as is_owner
  FROM public.organizations o
  WHERE o.created_by = p_user_id
     OR o.id IN (SELECT organization_id FROM public.user_roles WHERE user_id = p_user_id)
  ORDER BY o.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_user_organizations IS 
'Retorna todas las organizaciones de un usuario con slug generado automáticamente desde el nombre.';