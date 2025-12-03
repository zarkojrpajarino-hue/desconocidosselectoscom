
-- =====================================================
-- FEATURE: BRAND KIT GENERATOR
-- Tablas corregidas con RLS usando user_roles
-- =====================================================

-- Tabla: brand_kits (un brand kit por organización)
CREATE TABLE IF NOT EXISTS public.brand_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  
  -- Colores (hex codes)
  primary_color text NOT NULL,
  secondary_color text NOT NULL,
  accent_color text NOT NULL,
  neutral_light text DEFAULT '#F5F5F5',
  neutral_dark text DEFAULT '#2C2C2C',
  
  -- Tipografías
  font_heading text NOT NULL,
  font_body text NOT NULL,
  font_heading_url text,
  font_body_url text,
  
  -- Tono de voz
  tone_of_voice text NOT NULL,
  tone_description text,
  
  -- Logo
  logo_url text,
  logo_concept text,
  
  -- Metadatos
  industry text,
  target_audience text,
  brand_personality jsonb DEFAULT '[]'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(organization_id)
);

-- Tabla: landing_pages
CREATE TABLE IF NOT EXISTS public.landing_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  brand_kit_id uuid REFERENCES public.brand_kits(id) ON DELETE CASCADE,
  
  -- Contenido
  hero_headline text NOT NULL,
  hero_subheadline text,
  hero_cta_text text DEFAULT 'Comenzar',
  
  features jsonb DEFAULT '[]'::jsonb,
  benefits jsonb DEFAULT '[]'::jsonb,
  
  cta_headline text,
  cta_description text,
  cta_button_text text DEFAULT 'Contactar',
  
  contact_form_fields jsonb DEFAULT '["name", "email", "message"]'::jsonb,
  
  html_content text,
  css_content text,
  
  is_published boolean DEFAULT false,
  slug text UNIQUE,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla: brand_color_palettes (paletas predefinidas)
CREATE TABLE IF NOT EXISTS public.brand_color_palettes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  industry text NOT NULL,
  description text,
  
  primary_color text NOT NULL,
  secondary_color text NOT NULL,
  accent_color text NOT NULL,
  neutral_light text NOT NULL,
  neutral_dark text NOT NULL,
  
  psychology text,
  
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_brand_kits_org ON public.brand_kits(organization_id);
CREATE INDEX IF NOT EXISTS idx_landing_pages_org ON public.landing_pages(organization_id);
CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON public.landing_pages(slug);
CREATE INDEX IF NOT EXISTS idx_brand_palettes_industry ON public.brand_color_palettes(industry);

-- =====================================================
-- RLS POLICIES (usando user_roles, NO organization_members)
-- =====================================================

ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_color_palettes ENABLE ROW LEVEL SECURITY;

-- brand_kits policies
CREATE POLICY "brand_kits_select_org" ON public.brand_kits
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "brand_kits_insert_org" ON public.brand_kits
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "brand_kits_update_org" ON public.brand_kits
  FOR UPDATE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "brand_kits_delete_org" ON public.brand_kits
  FOR DELETE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
  ));

-- landing_pages policies
CREATE POLICY "landing_pages_select_org" ON public.landing_pages
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "landing_pages_insert_org" ON public.landing_pages
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "landing_pages_update_org" ON public.landing_pages
  FOR UPDATE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "landing_pages_delete_org" ON public.landing_pages
  FOR DELETE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
  ));

-- brand_color_palettes: lectura pública
CREATE POLICY "brand_palettes_select_public" ON public.brand_color_palettes
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- TRIGGERS para updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_brand_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER brand_kits_updated_at
  BEFORE UPDATE ON public.brand_kits
  FOR EACH ROW EXECUTE FUNCTION public.update_brand_tables_updated_at();

CREATE TRIGGER landing_pages_updated_at
  BEFORE UPDATE ON public.landing_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_brand_tables_updated_at();

-- =====================================================
-- SEED DATA: Paletas por industria
-- =====================================================

INSERT INTO public.brand_color_palettes (name, industry, description, primary_color, secondary_color, accent_color, neutral_light, neutral_dark, psychology) VALUES 
  ('Tech Blue', 'technology', 'Moderna y profesional, ideal para SaaS y startups tech', '#0066FF', '#00D4FF', '#FF6B35', '#F7F9FC', '#1A1F2E', 'Transmite innovación, confianza y profesionalismo. El azul es el color preferido en tech.'),
  ('Dark Mode Pro', 'technology', 'Elegante y minimalista, perfecta para productos premium', '#6366F1', '#8B5CF6', '#EC4899', '#F9FAFB', '#111827', 'Sofisticación y modernidad. Ideal para productos dirigidos a desarrolladores.'),
  ('Vibrant Commerce', 'ecommerce', 'Energética y llamativa, convierte visitantes en compradores', '#FF3366', '#FFB800', '#00C896', '#FFFFFF', '#2D2D2D', 'Colores que llaman a la acción. El rojo incrementa urgencia, dorado sugiere valor.'),
  ('Minimal Store', 'ecommerce', 'Limpia y elegante, deja que tus productos brillen', '#000000', '#4A4A4A', '#D4AF37', '#FAFAFA', '#1A1A1A', 'Elegancia minimalista. Usado por marcas premium como Apple, Nike.'),
  ('Fresh & Organic', 'food_beverage', 'Natural y saludable, perfecta para orgánico y healthy', '#7CB342', '#FFA726', '#F06292', '#F5F5F5', '#3E2723', 'Verde = salud y naturaleza. Naranja = energía y apetito.'),
  ('Gourmet Luxury', 'food_beverage', 'Sofisticada y premium, para restaurantes de alto nivel', '#C9A961', '#2C1810', '#E74C3C', '#FBF8F3', '#1A1511', 'Dorado y marrón evocan lujo y calidez. Perfecto para alta cocina.'),
  ('Energy Fitness', 'health_fitness', 'Motivadora y energética, inspira acción', '#FF5722', '#2196F3', '#4CAF50', '#FAFAFA', '#212121', 'Naranja = energía. Azul = confianza. Verde = salud.'),
  ('Calm Wellness', 'health_fitness', 'Tranquila y relajante, ideal para yoga y bienestar', '#00897B', '#7E57C2', '#FFB74D', '#F5F5F5', '#263238', 'Tonos calmantes que transmiten paz y equilibrio interior.'),
  ('Trust Finance', 'finance', 'Seria y confiable, transmite seguridad', '#1E3A8A', '#059669', '#F59E0B', '#F9FAFB', '#1F2937', 'Azul marino = confianza institucional. Verde = crecimiento financiero.'),
  ('Smart Learning', 'education', 'Amigable e inspiradora, fomenta el aprendizaje', '#3B82F6', '#F59E0B', '#10B981', '#F3F4F6', '#1F2937', 'Azul = conocimiento. Naranja = creatividad. Verde = crecimiento.'),
  ('Bold Creative', 'creative', 'Atrevida y única, perfecta para agencias y creativos', '#8B5CF6', '#EC4899', '#F59E0B', '#FFFFFF', '#18181B', 'Colores vibrantes que expresan creatividad e innovación sin límites.'),
  ('Professional Corp', 'consulting', 'Corporativa y seria, para consultoras y B2B', '#1E40AF', '#64748B', '#0891B2', '#F8FAFC', '#0F172A', 'Paleta conservadora que transmite experiencia y profesionalismo.'),
  ('Premium Property', 'real_estate', 'Elegante y confiable, vende sueños', '#115E59', '#D97706', '#DC2626', '#F5F5F4', '#1C1917', 'Verde = estabilidad. Dorado = lujo. Rojo = urgencia.'),
  ('Haute Couture', 'fashion', 'Elegante y sofisticada, para moda de lujo', '#000000', '#E5E7EB', '#EF4444', '#FFFFFF', '#111827', 'Blanco y negro = elegancia atemporal. Rojo = pasión y deseo.')
ON CONFLICT DO NOTHING;
