-- ═══════════════════════════════════════════════════════════════════════════
-- FUNCIÓN AUXILIAR: Verificar si email existe
-- ═══════════════════════════════════════════════════════════════════════════

-- Esta función se usa en el onboarding para detectar si un email ya tiene cuenta
CREATE OR REPLACE FUNCTION public.check_email_exists(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email_count INTEGER;
BEGIN
  -- Contar usuarios con ese email en auth.users
  SELECT COUNT(*) INTO email_count
  FROM auth.users
  WHERE LOWER(email) = LOWER(p_email);
  
  RETURN email_count > 0;
END;
$$;

COMMENT ON FUNCTION public.check_email_exists IS 
'Verifica si un email ya está registrado en auth.users. Retorna true si existe, false si no. Usado en onboarding para mostrar mensaje "email ya existe".';

-- ═══════════════════════════════════════════════════════════════════════════
-- EJEMPLO DE USO
-- ═══════════════════════════════════════════════════════════════════════════

/*
-- En TypeScript/JavaScript:

const { data, error } = await supabase.rpc('check_email_exists', {
  p_email: 'juan@email.com'
});

if (data === true) {
  // Email ya existe
  toast.error('Este email ya tiene una cuenta');
} else {
  // Email disponible
  // Continuar con signup
}
*/
