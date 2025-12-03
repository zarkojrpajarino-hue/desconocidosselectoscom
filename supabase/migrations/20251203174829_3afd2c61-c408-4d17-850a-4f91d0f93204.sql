-- =====================================================
-- FEATURE 4: GUÍA DE EMPRENDIMIENTO INTERACTIVA
-- =====================================================

-- Tabla: startup_guide_steps
CREATE TABLE IF NOT EXISTS startup_guide_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_number integer NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  detailed_guide text NOT NULL,
  success_criteria text NOT NULL,
  tips text[],
  recommended_tools text[],
  external_links jsonb DEFAULT '[]'::jsonb,
  points integer DEFAULT 10,
  estimated_time_hours integer,
  prerequisite_steps integer[],
  created_at timestamptz DEFAULT now()
);

-- Tabla: organization_guide_progress
CREATE TABLE IF NOT EXISTS organization_guide_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  step_id uuid REFERENCES startup_guide_steps(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  completion_data jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, step_id)
);

-- Tabla: organization_guide_achievements
CREATE TABLE IF NOT EXISTS organization_guide_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  achievement_type text NOT NULL,
  achievement_name text NOT NULL,
  achievement_description text,
  achievement_icon text,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, achievement_type)
);

-- Tabla: organization_guide_metrics
CREATE TABLE IF NOT EXISTS organization_guide_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  total_steps integer DEFAULT 0,
  completed_steps integer DEFAULT 0,
  in_progress_steps integer DEFAULT 0,
  total_points integer DEFAULT 0,
  current_category text,
  overall_progress_percentage decimal(5,2) DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_guide_steps_number ON startup_guide_steps(step_number);
CREATE INDEX IF NOT EXISTS idx_guide_steps_category ON startup_guide_steps(category);
CREATE INDEX IF NOT EXISTS idx_org_guide_progress_org ON organization_guide_progress(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_guide_progress_status ON organization_guide_progress(status);
CREATE INDEX IF NOT EXISTS idx_org_guide_achievements_org ON organization_guide_achievements(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_guide_metrics_org ON organization_guide_metrics(organization_id);

-- RLS
ALTER TABLE startup_guide_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guide_steps_select_public" ON startup_guide_steps FOR SELECT TO authenticated USING (true);

ALTER TABLE organization_guide_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_progress_select_org" ON organization_guide_progress FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "org_progress_insert_org" ON organization_guide_progress FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "org_progress_update_org" ON organization_guide_progress FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "org_progress_delete_org" ON organization_guide_progress FOR DELETE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()));

ALTER TABLE organization_guide_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements_select_org" ON organization_guide_achievements FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "achievements_insert_org" ON organization_guide_achievements FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "achievements_delete_org" ON organization_guide_achievements FOR DELETE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()));

ALTER TABLE organization_guide_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guide_metrics_select_org" ON organization_guide_metrics FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "guide_metrics_insert_org" ON organization_guide_metrics FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "guide_metrics_update_org" ON organization_guide_metrics FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()));

-- Función updated_at
CREATE OR REPLACE FUNCTION update_guide_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER guide_progress_updated_at
  BEFORE UPDATE ON organization_guide_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_guide_progress_updated_at();

-- Función: Actualizar métricas
CREATE OR REPLACE FUNCTION update_guide_metrics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO organization_guide_metrics (organization_id, total_steps, completed_steps, in_progress_steps, total_points, overall_progress_percentage)
  SELECT 
    NEW.organization_id,
    (SELECT COUNT(*) FROM startup_guide_steps),
    COUNT(*) FILTER (WHERE ogp.status = 'completed'),
    COUNT(*) FILTER (WHERE ogp.status = 'in_progress'),
    COALESCE(SUM(s.points) FILTER (WHERE ogp.status = 'completed'), 0),
    ROUND((COUNT(*) FILTER (WHERE ogp.status = 'completed')::decimal / NULLIF((SELECT COUNT(*) FROM startup_guide_steps), 0)) * 100, 2)
  FROM organization_guide_progress ogp
  JOIN startup_guide_steps s ON ogp.step_id = s.id
  WHERE ogp.organization_id = NEW.organization_id
  ON CONFLICT (organization_id) DO UPDATE SET
    total_steps = EXCLUDED.total_steps,
    completed_steps = EXCLUDED.completed_steps,
    in_progress_steps = EXCLUDED.in_progress_steps,
    total_points = EXCLUDED.total_points,
    overall_progress_percentage = EXCLUDED.overall_progress_percentage,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_guide_metrics
  AFTER INSERT OR UPDATE ON organization_guide_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_guide_metrics();

-- Función: Achievements
CREATE OR REPLACE FUNCTION grant_guide_achievements()
RETURNS TRIGGER AS $$
DECLARE
  completed_count integer;
BEGIN
  IF NEW.status != 'completed' THEN RETURN NEW; END IF;

  INSERT INTO organization_guide_achievements (organization_id, achievement_type, achievement_name, achievement_description, achievement_icon)
  VALUES (NEW.organization_id, 'first_step', 'Primer Paso', 'Completaste tu primer paso', '🎯')
  ON CONFLICT DO NOTHING;

  SELECT COUNT(*) INTO completed_count FROM organization_guide_progress WHERE organization_id = NEW.organization_id AND status = 'completed';

  IF completed_count >= 5 THEN
    INSERT INTO organization_guide_achievements VALUES (gen_random_uuid(), NEW.organization_id, 'milestone_5', 'En Marcha', '5 pasos completados', '🚀', now()) ON CONFLICT DO NOTHING;
  END IF;
  IF completed_count >= 10 THEN
    INSERT INTO organization_guide_achievements VALUES (gen_random_uuid(), NEW.organization_id, 'milestone_10', 'Casi Experto', '10 pasos completados', '⭐', now()) ON CONFLICT DO NOTHING;
  END IF;
  IF completed_count >= 15 THEN
    INSERT INTO organization_guide_achievements VALUES (gen_random_uuid(), NEW.organization_id, 'guide_master', 'Maestro Emprendedor', 'Guía completa', '👑', now()) ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_grant_guide_achievements
  AFTER UPDATE ON organization_guide_progress
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION grant_guide_achievements();

-- Seed: 15 pasos
INSERT INTO startup_guide_steps (step_number, title, description, category, detailed_guide, success_criteria, tips, recommended_tools, external_links, points, estimated_time_hours, prerequisite_steps) VALUES 
(1, 'Define el problema real', 'Identifica el dolor específico que vas a resolver', 'validation', 'No vendas productos, resuelve problemas.', 'Descripción clara del problema en 30 segundos', ARRAY['Enfócate en UN problema', 'Debe ser frecuente'], ARRAY['Notion', 'Miro'], '[{"title": "JTBD", "url": "https://jtbd.info"}]'::jsonb, 10, 2, ARRAY[]::integer[]),
(2, 'Entrevista a 20 personas', 'Valida que el problema existe', 'validation', 'Mínimo 20 entrevistas antes de lanzar.', '20 entrevistas con patrón común', ARRAY['Usa The Mom Test', 'Graba con permiso'], ARRAY['Calendly', 'Zoom'], '[]'::jsonb, 20, 15, ARRAY[1]),
(3, 'Define tu buyer persona', 'Perfil detallado del cliente ideal', 'validation', 'Basándote en entrevistas, crea 1-2 personas.', '1-2 personas con datos reales', ARRAY['Usa datos REALES', 'Ponle nombre'], ARRAY['Notion'], '[]'::jsonb, 15, 3, ARRAY[2]),
(4, 'Analiza la competencia', 'Estudia a otros y dónde puedes ganar', 'validation', 'Directa, indirecta y sustitutos.', '5-10 competidores analizados', ARRAY['Lee reviews negativos'], ARRAY['SimilarWeb', 'Ahrefs'], '[]'::jsonb, 15, 5, ARRAY[1]),
(5, 'Calcula tamaño del mercado', 'Valida que hay suficientes clientes', 'validation', 'Usa TAM-SAM-SOM.', 'Números claros de TAM/SAM/SOM', ARRAY['Sé conservador'], ARRAY['Statista'], '[]'::jsonb, 20, 4, ARRAY[3,4]),
(6, 'Define propuesta de valor', 'Articula por qué te elegirían', 'product', 'Clara en 10 segundos.', 'Propuesta que 5 personas entienden', ARRAY['Enfócate en RESULTADO'], ARRAY['Notion'], '[]'::jsonb, 15, 3, ARRAY[1,3]),
(7, 'Diseña tu MVP', 'Versión más simple que resuelve el problema', 'product', 'MVP = Experimento para aprender.', 'Features priorizados, plan de 4-8 semanas', ARRAY['Si no da vergüenza, tarde'], ARRAY['Figma', 'Trello'], '[]'::jsonb, 25, 6, ARRAY[6]),
(8, 'Construye el MVP', 'Lanza la primera versión', 'product', 'Sprint de 4-8 semanas.', 'MVP funcional con 10-20 beta testers', ARRAY['No busques perfección'], ARRAY['Webflow', 'Supabase'], '[]'::jsonb, 30, 80, ARRAY[7]),
(9, 'Consigue 10 clientes', 'Valida que la gente paga', 'product', 'Consíguelos manualmente.', '10 clientes pagando', ARRAY['Deben PAGAR'], ARRAY['LinkedIn', 'Stripe'], '[]'::jsonb, 25, 20, ARRAY[8]),
(10, 'Define canal de adquisición', 'Cómo conseguirás clientes', 'market', 'Elige 1 canal y domínalo.', '1 canal con plan de 90 días', ARRAY['Un canal bien >> tres mal'], ARRAY['Google Analytics'], '[]'::jsonb, 20, 8, ARRAY[9]),
(11, 'Estrategia de contenido', 'Atrae mediante valor gratuito', 'market', 'El contenido es vendedor 24/7.', '10 piezas publicadas', ARRAY['Consistencia > Perfección'], ARRAY['Buffer', 'Canva'], '[]'::jsonb, 20, 10, ARRAY[10]),
(12, 'Implementa analytics', 'Mide todo para decidir con datos', 'market', 'Si no lo mides, no existe.', 'GA + product analytics configurado', ARRAY['Revisa semanalmente'], ARRAY['Hotjar', 'Mixpanel'], '[]'::jsonb, 15, 6, ARRAY[9]),
(13, 'Optimiza funnel', 'Convierte más visitantes en clientes', 'growth', 'Mide conversión en cada etapa.', 'Funnel mapeado con plan de mejora', ARRAY['Mejora 1%/semana'], ARRAY['Hotjar'], '[]'::jsonb, 25, 10, ARRAY[12]),
(14, 'Sistema de referidos', 'Haz que clientes traigan más', 'growth', 'Clientes felices recomiendan.', 'Programa con 5 clientes refiriendo', ARRAY['Pide cuando más feliz'], ARRAY['ReferralCandy'], '[]'::jsonb, 20, 8, ARRAY[13]),
(15, 'Automatiza procesos', 'Libera tiempo para lo importante', 'operations', 'Automatiza todo lo automatizable.', '5 procesos automatizados', ARRAY['Si haces 3+ veces, automatiza'], ARRAY['Zapier', 'Make'], '[]'::jsonb, 20, 12, ARRAY[12,13])
ON CONFLICT DO NOTHING;