-- =====================================================
-- FEATURE: PAÍS/REGIÓN DE VENTA
-- Tablas, RLS, índices, triggers y seed data
-- =====================================================

-- Tabla: country_data (datos estáticos por país)
CREATE TABLE IF NOT EXISTS country_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text UNIQUE NOT NULL,
  country_name text NOT NULL,
  currency text NOT NULL,
  vat_rate decimal(5,2),
  corporate_tax_rate decimal(5,2),
  population bigint,
  median_age integer,
  internet_penetration decimal(5,2),
  ecommerce_penetration decimal(5,2),
  gdp_per_capita decimal(10,2),
  unemployment_rate decimal(5,2),
  top_social_platforms jsonb DEFAULT '[]'::jsonb,
  top_ecommerce_platforms jsonb DEFAULT '[]'::jsonb,
  data_privacy_law text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla: competitive_landscape (competidores por país + industria)
CREATE TABLE IF NOT EXISTS competitive_landscape (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text REFERENCES country_data(country_code),
  industry text NOT NULL,
  competitor_name text NOT NULL,
  competitor_website text,
  market_position text,
  estimated_market_share decimal(5,2),
  strengths text[],
  weaknesses text[],
  created_at timestamptz DEFAULT now()
);

-- Tabla: buyer_personas (generados por IA)
CREATE TABLE IF NOT EXISTS buyer_personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  age integer,
  location text,
  occupation text,
  income_range text,
  demographics jsonb DEFAULT '{}'::jsonb,
  psychographics jsonb DEFAULT '{}'::jsonb,
  pain_points text[],
  goals text[],
  preferred_channels text[],
  buying_behavior jsonb DEFAULT '{}'::jsonb,
  country_code text REFERENCES country_data(country_code),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Modificar tabla organizations (añadir columnas de país)
ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS country_code text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS primary_markets text[],
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Europe/Madrid';

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_country_data_code ON country_data(country_code);
CREATE INDEX IF NOT EXISTS idx_competitive_landscape_country_industry ON competitive_landscape(country_code, industry);
CREATE INDEX IF NOT EXISTS idx_organizations_country_code ON organizations(country_code);
CREATE INDEX IF NOT EXISTS idx_buyer_personas_org ON buyer_personas(organization_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- country_data: Lectura pública para usuarios autenticados
ALTER TABLE country_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "country_data_select_authenticated"
  ON country_data FOR SELECT TO authenticated
  USING (true);

-- competitive_landscape: Lectura pública para usuarios autenticados
ALTER TABLE competitive_landscape ENABLE ROW LEVEL SECURITY;

CREATE POLICY "competitive_landscape_select_authenticated"
  ON competitive_landscape FOR SELECT TO authenticated
  USING (true);

-- buyer_personas: CRUD por organización
ALTER TABLE buyer_personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "buyer_personas_select_org"
  ON buyer_personas FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "buyer_personas_insert_org"
  ON buyer_personas FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "buyer_personas_update_org"
  ON buyer_personas FOR UPDATE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "buyer_personas_delete_org"
  ON buyer_personas FOR DELETE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
  ));

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE OR REPLACE FUNCTION update_country_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS country_data_updated_at ON country_data;
CREATE TRIGGER country_data_updated_at
  BEFORE UPDATE ON country_data
  FOR EACH ROW EXECUTE FUNCTION update_country_data_updated_at();

DROP TRIGGER IF EXISTS buyer_personas_updated_at ON buyer_personas;
CREATE TRIGGER buyer_personas_updated_at
  BEFORE UPDATE ON buyer_personas
  FOR EACH ROW EXECUTE FUNCTION update_country_data_updated_at();

-- =====================================================
-- SEED DATA: 9 países principales
-- =====================================================
INSERT INTO country_data (
  country_code, country_name, currency, vat_rate, corporate_tax_rate,
  population, median_age, internet_penetration, ecommerce_penetration,
  gdp_per_capita, unemployment_rate, top_social_platforms, top_ecommerce_platforms, data_privacy_law
) VALUES 
  ('ES', 'España', 'EUR', 21.00, 25.00, 47500000, 44, 93.20, 72.50, 30000.00, 12.50,
   '["Instagram", "WhatsApp", "TikTok", "LinkedIn", "Facebook"]'::jsonb,
   '["Amazon.es", "El Corte Inglés", "Carrefour", "AliExpress", "Zara"]'::jsonb, 'GDPR'),
  ('FR', 'Francia', 'EUR', 20.00, 25.00, 67800000, 42, 92.30, 81.70, 43000.00, 7.30,
   '["Instagram", "WhatsApp", "TikTok", "LinkedIn", "Snapchat"]'::jsonb,
   '["Amazon.fr", "Cdiscount", "Fnac", "La Redoute", "Veepee"]'::jsonb, 'GDPR'),
  ('DE', 'Alemania', 'EUR', 19.00, 30.00, 83200000, 46, 94.60, 87.10, 48000.00, 5.40,
   '["WhatsApp", "Instagram", "TikTok", "LinkedIn", "Facebook"]'::jsonb,
   '["Amazon.de", "Otto", "Zalando", "MediaMarkt", "eBay"]'::jsonb, 'GDPR'),
  ('IT', 'Italia', 'EUR', 22.00, 24.00, 59100000, 47, 88.70, 67.30, 35000.00, 7.60,
   '["WhatsApp", "Instagram", "Facebook", "TikTok", "LinkedIn"]'::jsonb,
   '["Amazon.it", "eBay", "Subito", "Zalando", "Yoox"]'::jsonb, 'GDPR'),
  ('GB', 'Reino Unido', 'GBP', 20.00, 19.00, 67500000, 40, 96.40, 89.50, 46000.00, 4.20,
   '["WhatsApp", "Instagram", "TikTok", "Facebook", "LinkedIn"]'::jsonb,
   '["Amazon.co.uk", "eBay", "ASOS", "Argos", "Tesco"]'::jsonb, 'UK GDPR'),
  ('US', 'Estados Unidos', 'USD', 0.00, 21.00, 331900000, 38, 92.00, 81.00, 69000.00, 3.70,
   '["Instagram", "TikTok", "Facebook", "LinkedIn", "Twitter"]'::jsonb,
   '["Amazon.com", "Walmart", "eBay", "Target", "Best Buy"]'::jsonb, 'CCPA'),
  ('MX', 'México', 'MXN', 16.00, 30.00, 128900000, 29, 72.00, 58.30, 9600.00, 3.50,
   '["WhatsApp", "Facebook", "Instagram", "TikTok", "Twitter"]'::jsonb,
   '["Amazon.com.mx", "Mercado Libre", "Liverpool", "Coppel", "Walmart"]'::jsonb, 'LFPDPPP'),
  ('AR', 'Argentina', 'ARS', 21.00, 35.00, 45800000, 32, 87.20, 51.40, 10600.00, 8.50,
   '["WhatsApp", "Instagram", "Facebook", "TikTok", "Twitter"]'::jsonb,
   '["Mercado Libre", "Amazon.com", "Tienda Nube", "Frávega", "Garbarino"]'::jsonb, 'Ley 25.326'),
  ('CO', 'Colombia', 'COP', 19.00, 35.00, 51300000, 31, 73.00, 48.20, 6400.00, 11.20,
   '["WhatsApp", "Facebook", "Instagram", "TikTok", "Twitter"]'::jsonb,
   '["Mercado Libre", "Amazon", "Falabella", "Éxito", "Linio"]'::jsonb, 'Ley 1581')
ON CONFLICT (country_code) DO NOTHING;

-- Seed competitive_landscape ejemplos
INSERT INTO competitive_landscape (country_code, industry, competitor_name, competitor_website, market_position, estimated_market_share, strengths, weaknesses) VALUES 
  ('ES', 'food_delivery', 'Glovo', 'https://glovoapp.com', 'leader', 35.00,
   ARRAY['red extensa', 'inversión fuerte', 'multi-vertical'],
   ARRAY['comisiones altas', 'servicio inconsistente']),
  ('ES', 'food_delivery', 'Just Eat', 'https://www.just-eat.es', 'challenger', 28.00,
   ARRAY['marca establecida', 'partnerships restaurantes'],
   ARRAY['innovación lenta', 'perdiendo cuota']),
  ('ES', 'ecommerce_fashion', 'Zara', 'https://www.zara.com', 'leader', 42.00,
   ARRAY['fast fashion líder', 'omnichannel', 'logística eficiente'],
   ARRAY['competencia shein', 'sostenibilidad cuestionada']),
  ('MX', 'ecommerce_marketplace', 'Mercado Libre', 'https://www.mercadolibre.com.mx', 'leader', 62.00,
   ARRAY['líder indiscutible', 'logística propia', 'fintech integrado'],
   ARRAY['comisiones crecientes', 'competencia Amazon']),
  ('US', 'saas_crm', 'Salesforce', 'https://www.salesforce.com', 'leader', 23.00,
   ARRAY['ecosistema completo', 'enterprise-grade', 'innovación'],
   ARRAY['precio alto', 'complejidad']),
  ('US', 'saas_crm', 'HubSpot', 'https://www.hubspot.com', 'challenger', 12.00,
   ARRAY['freemium atractivo', 'fácil de usar'],
   ARRAY['funcionalidad limitada tier bajo'])
ON CONFLICT DO NOTHING;