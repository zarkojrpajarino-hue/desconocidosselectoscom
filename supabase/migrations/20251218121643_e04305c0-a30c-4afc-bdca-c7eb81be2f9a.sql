-- ============================================
-- DISCOVERY ONBOARDING: Database Migration
-- ============================================

-- 1. Add onboarding_type to trial_email_registry for 3 trials per email (one per type)
ALTER TABLE public.trial_email_registry 
ADD COLUMN IF NOT EXISTS onboarding_type TEXT DEFAULT 'consolidated';

-- Update existing records to have 'consolidated' type
UPDATE public.trial_email_registry 
SET onboarding_type = 'consolidated' 
WHERE onboarding_type IS NULL;

-- Drop old unique constraint and add new composite one
ALTER TABLE public.trial_email_registry 
DROP CONSTRAINT IF EXISTS trial_email_registry_email_key;

ALTER TABLE public.trial_email_registry 
ADD CONSTRAINT trial_email_registry_email_type_key UNIQUE (email, onboarding_type);

-- 2. Create curated_ideas table for the 50-100 base ideas
CREATE TABLE IF NOT EXISTS public.curated_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- tech_saas, services, ecommerce, content_education, marketplace
  description TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  problem_solved TEXT NOT NULL,
  revenue_model TEXT NOT NULL,
  
  -- Requirements
  required_skills TEXT[] DEFAULT '{}',
  min_capital INTEGER DEFAULT 0,
  min_hours_weekly INTEGER DEFAULT 10,
  difficulty_level INTEGER DEFAULT 3, -- 1-5
  time_to_first_revenue TEXT NOT NULL, -- "2-4 weeks", "1-3 months", etc.
  
  -- Scoring weights for matching
  skill_tags TEXT[] DEFAULT '{}',
  industry_tags TEXT[] DEFAULT '{}',
  motivation_tags TEXT[] DEFAULT '{}', -- financial_freedom, passion, impact, flexibility
  
  -- Additional info
  examples TEXT[] DEFAULT '{}', -- Real-world examples
  first_steps TEXT[] DEFAULT '{}', -- What to do first
  common_mistakes TEXT[] DEFAULT '{}',
  resources TEXT[] DEFAULT '{}', -- Helpful links/tools
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create discovery_profiles table to store discovery onboarding data
CREATE TABLE IF NOT EXISTS public.discovery_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Step 1-2: Basic info
  contact_name TEXT,
  contact_email TEXT,
  
  -- Step 3: Current situation
  current_situation TEXT, -- employed, student, unemployed, entrepreneur
  
  -- Step 4: Time availability
  hours_weekly INTEGER DEFAULT 10,
  
  -- Step 5: Risk tolerance
  risk_tolerance INTEGER DEFAULT 3, -- 1-5 scale
  
  -- Step 6: Motivations (Top 3)
  motivations TEXT[] DEFAULT '{}', -- financial_freedom, passion, impact, flexibility, independence, legacy
  
  -- Step 7: Skills (Top 3)
  skills TEXT[] DEFAULT '{}', -- sales, technical, creative, management, marketing, finance, operations
  
  -- Step 8: Industry experience
  industries TEXT[] DEFAULT '{}', -- tech, health, retail, services, education, finance, etc.
  
  -- Step 9: Target audience preference
  target_audience_preference TEXT, -- b2b, b2c, both
  
  -- Step 10: Initial capital
  initial_capital TEXT, -- less_1k, 1k_5k, 5k_20k, more_20k
  
  -- Step 11: Existing idea (optional)
  existing_idea TEXT,
  
  -- Step 12: Business type preference
  business_type_preference TEXT, -- physical_product, digital_saas, services, marketplace
  
  -- Step 13: Time to revenue urgency
  revenue_urgency TEXT, -- 1_3_months, 3_6_months, 6_12_months
  
  -- Generated ideas
  generated_ideas JSONB DEFAULT '[]', -- Array of { idea_id, score, selected }
  selected_idea_id UUID REFERENCES public.curated_ideas(id),
  
  -- Status
  status TEXT DEFAULT 'in_progress', -- in_progress, ideas_generated, idea_selected, completed
  current_step INTEGER DEFAULT 1,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 4. Enable RLS on new tables
ALTER TABLE public.curated_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_profiles ENABLE ROW LEVEL SECURITY;

-- RLS for curated_ideas (read-only for all authenticated users)
CREATE POLICY "Anyone can read active curated ideas" ON public.curated_ideas
  FOR SELECT USING (is_active = true);

-- RLS for discovery_profiles
CREATE POLICY "Users can view their own discovery profiles" ON public.discovery_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own discovery profiles" ON public.discovery_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own discovery profiles" ON public.discovery_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. Update can_use_trial function to check by onboarding_type
CREATE OR REPLACE FUNCTION public.can_use_trial_by_type(user_email TEXT, onboard_type TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.trial_email_registry 
    WHERE email = user_email 
    AND onboarding_type = onboard_type
  );
END;
$$;

-- 6. Update register_trial_email to accept onboarding_type
CREATE OR REPLACE FUNCTION public.register_trial_email_by_type(user_email TEXT, onboard_type TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.trial_email_registry (email, onboarding_type, registered_at)
  VALUES (user_email, onboard_type, now())
  ON CONFLICT (email, onboarding_type) DO NOTHING;
END;
$$;

-- 7. Add business_stage value for discovery
-- (organizations table already has business_stage column, just needs 'discovery' as valid value)

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_curated_ideas_category ON public.curated_ideas(category);
CREATE INDEX IF NOT EXISTS idx_curated_ideas_skill_tags ON public.curated_ideas USING GIN(skill_tags);
CREATE INDEX IF NOT EXISTS idx_curated_ideas_industry_tags ON public.curated_ideas USING GIN(industry_tags);
CREATE INDEX IF NOT EXISTS idx_discovery_profiles_user ON public.discovery_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_discovery_profiles_org ON public.discovery_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_discovery_profiles_status ON public.discovery_profiles(status);

-- 9. Insert initial curated ideas (50 ideas across 5 categories)
INSERT INTO public.curated_ideas (name, slug, category, description, target_audience, problem_solved, revenue_model, required_skills, min_capital, min_hours_weekly, difficulty_level, time_to_first_revenue, skill_tags, industry_tags, motivation_tags, examples, first_steps) VALUES

-- TECH/SAAS (10 ideas)
('Agencia de Automatización con IA', 'agencia-automatizacion-ia', 'tech_saas', 
'Ayuda a empresas a automatizar procesos repetitivos usando herramientas de IA como Make, Zapier y ChatGPT. No necesitas programar, solo entender flujos de trabajo.',
'PYMEs y profesionales independientes', 
'Las empresas pierden horas en tareas manuales que podrían automatizarse',
'Servicios por proyecto (€500-5000) o retainer mensual (€500-2000/mes)',
ARRAY['marketing', 'technical'], 500, 15, 2, '2-4 semanas',
ARRAY['technical', 'sales', 'marketing'], ARRAY['tech', 'services'], ARRAY['financial_freedom', 'flexibility'],
ARRAY['Agencias como Automation Agency', 'Freelancers en Upwork cobrando €50-150/hora'], 
ARRAY['Aprende Make/Zapier gratis', 'Crea 3 automatizaciones para ti mismo', 'Ofrece gratis a 2-3 conocidos', 'Publica caso de estudio']),

('Micro-SaaS de Nicho', 'micro-saas-nicho', 'tech_saas',
'Crea una herramienta simple que resuelve UN problema específico para un nicho concreto. Ejemplo: gestor de citas para peluquerías, calculadora de presupuestos para reformas.',
'Profesionales de un nicho específico',
'Herramientas genéricas no cubren necesidades específicas de ciertos nichos',
'Suscripción mensual €10-50/usuario',
ARRAY['technical'], 1000, 20, 4, '3-6 meses',
ARRAY['technical', 'creative'], ARRAY['tech'], ARRAY['financial_freedom', 'independence'],
ARRAY['Carrd', 'Plausible Analytics', 'Buttondown'], 
ARRAY['Identifica un nicho que conoces', 'Encuentra su problema más repetitivo', 'Valida con 10 entrevistas', 'Construye MVP simple']),

('Consultoría de IA para PyMEs', 'consultoria-ia-pymes', 'tech_saas',
'Asesora a pequeñas y medianas empresas sobre cómo implementar IA en sus operaciones diarias. No necesitas ser técnico, solo entender las herramientas.',
'Dueños de PyMEs tradicionales',
'Las PyMEs no saben cómo aprovechar la IA y se quedan atrás',
'Consultoría por hora (€100-200/h) o proyectos (€2000-10000)',
ARRAY['sales', 'marketing'], 200, 10, 2, '1-2 semanas',
ARRAY['sales', 'technical', 'marketing'], ARRAY['tech', 'services'], ARRAY['financial_freedom', 'impact'],
ARRAY['Consultores independientes en LinkedIn'], 
ARRAY['Domina 5 herramientas de IA clave', 'Crea contenido educativo en LinkedIn', 'Ofrece auditoría gratis', 'Convierte a pagos']),

('Desarrollo de Chatbots Personalizados', 'desarrollo-chatbots', 'tech_saas',
'Crea chatbots de atención al cliente usando herramientas no-code como Botpress, Voiceflow o ChatGPT API.',
'Empresas con alto volumen de consultas',
'El soporte al cliente es caro y repetitivo',
'Setup €500-3000 + mantenimiento mensual €200-500',
ARRAY['technical', 'sales'], 300, 15, 3, '2-4 semanas',
ARRAY['technical', 'creative'], ARRAY['tech', 'services'], ARRAY['financial_freedom', 'flexibility'],
ARRAY['Agencias de chatbots en Clutch'], 
ARRAY['Aprende una plataforma de chatbots', 'Crea bot para tu propio negocio', 'Documenta resultados', 'Ofrece a empresas locales']),

('Plataforma de Cursos de Nicho', 'plataforma-cursos-nicho', 'tech_saas',
'Crea una academia online enfocada en un tema ultra-específico donde eres experto o puedes asociarte con expertos.',
'Profesionales que quieren especializarse',
'Los cursos genéricos no profundizan en nichos específicos',
'Venta de cursos €50-500 o membresía €20-100/mes',
ARRAY['creative', 'marketing'], 500, 20, 3, '1-3 meses',
ARRAY['creative', 'marketing', 'technical'], ARRAY['education', 'tech'], ARRAY['passion', 'impact', 'legacy'],
ARRAY['Domestika', 'Platzi'], 
ARRAY['Define tu expertise o encuentra experto', 'Valida interés con contenido gratis', 'Crea MVP con 1 curso', 'Construye comunidad']),

-- SERVICIOS PROFESIONALES (10 ideas)
('Agencia de Marketing para Sector Específico', 'agencia-marketing-nicho', 'services',
'Especialízate en marketing digital para UN solo sector: dentistas, abogados, gimnasios, restaurantes, etc.',
'Profesionales de un sector específico',
'Las agencias genéricas no entienden las necesidades del sector',
'Retainer mensual €500-3000/cliente',
ARRAY['marketing', 'sales'], 300, 20, 2, '2-4 semanas',
ARRAY['marketing', 'creative', 'sales'], ARRAY['services', 'health', 'retail'], ARRAY['financial_freedom', 'flexibility'],
ARRAY['Dental Marketo', 'Gym Launch'], 
ARRAY['Elige sector que conoces', 'Estudia sus problemas de marketing', 'Crea caso de estudio', 'Contacta 50 negocios']),

('Servicio de Copywriting con IA', 'copywriting-ia', 'services',
'Ofrece servicios de redacción para webs, emails y ads usando IA como asistente pero añadiendo tu toque humano y estratégico.',
'Startups y PyMEs que necesitan contenido',
'El contenido genérico de IA no convierte, necesita estrategia humana',
'Por proyecto €200-2000 o paquetes mensuales €500-2000',
ARRAY['creative', 'marketing'], 100, 15, 2, '1-2 semanas',
ARRAY['creative', 'marketing'], ARRAY['services', 'tech'], ARRAY['flexibility', 'creative_expression'],
ARRAY['Copyhackers', 'Copywriters freelance'], 
ARRAY['Aprende copywriting básico', 'Domina herramientas de IA', 'Crea portfolio con 5 ejemplos', 'Publica en LinkedIn']),

('Asistente Virtual Especializado', 'asistente-virtual', 'services',
'Ofrece servicios de asistencia virtual especializada en un área: contabilidad, real estate, e-commerce, etc.',
'Empresarios y profesionales ocupados',
'Los asistentes genéricos no entienden el contexto del sector',
'Paquetes mensuales €300-1500',
ARRAY['operations', 'management'], 100, 20, 1, '1-2 semanas',
ARRAY['operations', 'management'], ARRAY['services'], ARRAY['flexibility', 'independence'],
ARRAY['Belay', 'Time Etc'], 
ARRAY['Define tu especialización', 'Crea procesos documentados', 'Empieza con 1-2 clientes', 'Escala con sistemas']),

('Gestoría Digital para Autónomos', 'gestoria-digital', 'services',
'Ofrece servicios de gestión administrativa, fiscal y contable para autónomos y pequeños negocios de forma 100% digital.',
'Autónomos y microempresas',
'Las gestorías tradicionales son caras y poco digitales',
'Suscripción mensual €30-150/cliente',
ARRAY['finance', 'operations'], 500, 25, 3, '1-3 meses',
ARRAY['finance', 'operations', 'technical'], ARRAY['finance', 'services'], ARRAY['financial_freedom', 'impact'],
ARRAY['Declarando', 'Txerpa'], 
ARRAY['Obtén certificaciones necesarias', 'Digitaliza procesos', 'Capta primeros 10 clientes', 'Automatiza lo repetitivo']),

('Coaching de Productividad Personal', 'coaching-productividad', 'services',
'Ayuda a profesionales y emprendedores a ser más productivos con metodologías probadas y herramientas digitales.',
'Profesionales sobrecargados de trabajo',
'La falta de sistemas de productividad causa estrés y bajo rendimiento',
'Sesiones €100-300/hora o programas €500-3000',
ARRAY['management', 'sales'], 200, 10, 2, '2-4 semanas',
ARRAY['management', 'creative'], ARRAY['services', 'education'], ARRAY['impact', 'passion'],
ARRAY['Cal Newport', 'Ali Abdaal'], 
ARRAY['Certifícate en metodología', 'Documenta tu sistema', 'Crea contenido educativo', 'Ofrece sesiones gratis iniciales']),

-- E-COMMERCE/PRODUCTO (10 ideas)
('Tienda de Productos Sostenibles de Nicho', 'ecommerce-sostenible', 'ecommerce',
'Cura y vende productos eco-friendly para un nicho específico: bebés, mascotas, oficina, cocina, etc.',
'Consumidores conscientes del medio ambiente',
'Es difícil encontrar productos sostenibles de calidad para necesidades específicas',
'Margen 30-50% sobre productos + posible suscripción',
ARRAY['marketing', 'operations'], 2000, 20, 3, '1-3 meses',
ARRAY['marketing', 'operations', 'creative'], ARRAY['retail', 'ecommerce'], ARRAY['impact', 'passion'],
ARRAY['Package Free', 'EarthHero'], 
ARRAY['Investiga nicho sostenible', 'Encuentra proveedores éticos', 'Crea tienda con Shopify', 'Marketing en Instagram']),

('Dropshipping de Productos de Nicho', 'dropshipping-nicho', 'ecommerce',
'Vende productos sin inventario enfocándote en un nicho específico donde puedas crear contenido y comunidad.',
'Compradores online de nicho específico',
'Los marketplaces grandes no ofrecen curaduría ni comunidad',
'Margen 20-40% sin gestionar inventario',
ARRAY['marketing'], 500, 15, 2, '1-2 meses',
ARRAY['marketing', 'creative'], ARRAY['retail', 'ecommerce'], ARRAY['financial_freedom', 'flexibility'],
ARRAY['Oberlo success stories'], 
ARRAY['Investiga nicho rentable', 'Valida demanda con ads', 'Encuentra proveedores confiables', 'Crea marca diferenciada']),

('Print-on-Demand con Diseños Originales', 'print-on-demand', 'ecommerce',
'Crea y vende productos personalizados (camisetas, tazas, posters) con tus diseños sin manejar inventario.',
'Fans de nichos específicos (gaming, profesiones, hobbies)',
'Los productos genéricos no representan la identidad del nicho',
'Margen 15-30% por producto',
ARRAY['creative'], 200, 10, 2, '2-4 semanas',
ARRAY['creative', 'marketing'], ARRAY['retail', 'ecommerce'], ARRAY['creative_expression', 'flexibility'],
ARRAY['Printful creators', 'Redbubble top sellers'], 
ARRAY['Identifica nicho con pasión', 'Crea 20-30 diseños', 'Sube a plataformas POD', 'Promociona en redes del nicho']),

('Suscripción de Productos Curados', 'subscription-box', 'ecommerce',
'Crea una caja de suscripción mensual con productos curados para un nicho específico.',
'Entusiastas de un hobby o estilo de vida',
'Descubrir nuevos productos del nicho requiere mucho tiempo',
'Suscripción €20-80/mes con margen 40-60%',
ARRAY['operations', 'marketing'], 3000, 25, 4, '2-4 meses',
ARRAY['operations', 'marketing', 'creative'], ARRAY['retail', 'ecommerce'], ARRAY['passion', 'creative_expression'],
ARRAY['Birchbox', 'Loot Crate'], 
ARRAY['Valida concepto con waitlist', 'Negocia con proveedores', 'Crea MVP con 50 suscriptores', 'Itera según feedback']),

('Reventa de Productos Vintage/Segunda Mano', 'reventa-vintage', 'ecommerce',
'Compra, restaura y revende productos vintage o de segunda mano en un nicho específico.',
'Coleccionistas y amantes de lo vintage',
'Encontrar piezas de calidad requiere expertise y tiempo',
'Margen 50-200% según rareza',
ARRAY['sales', 'creative'], 500, 15, 2, '2-4 semanas',
ARRAY['sales', 'creative'], ARRAY['retail'], ARRAY['passion', 'independence'],
ARRAY['Vendedores de Wallapop/Vinted premium'], 
ARRAY['Especialízate en un tipo de producto', 'Aprende a valorar y restaurar', 'Crea presencia en marketplaces', 'Construye reputación']),

-- CONTENIDO/EDUCACIÓN (10 ideas)
('Newsletter de Nicho Premium', 'newsletter-nicho', 'content_education',
'Crea una newsletter de pago enfocada en un tema específico donde aportas análisis y insights únicos.',
'Profesionales y entusiastas del tema',
'La información gratuita es genérica, los expertos pagan por insights',
'Suscripción €5-50/mes o sponsors',
ARRAY['creative', 'marketing'], 100, 10, 2, '2-4 meses',
ARRAY['creative', 'marketing'], ARRAY['media', 'education'], ARRAY['creative_expression', 'impact'],
ARRAY['The Hustle', 'Morning Brew'], 
ARRAY['Define tema y ángulo único', 'Crea 10 ediciones gratis', 'Construye lista de 1000+', 'Lanza versión premium']),

('Canal de YouTube Educativo', 'youtube-educativo', 'content_education',
'Crea contenido educativo en video sobre un tema que dominas o te apasiona.',
'Personas que quieren aprender el tema',
'El contenido de calidad sobre temas específicos es escaso',
'AdSense + sponsors + productos propios',
ARRAY['creative'], 500, 15, 3, '6-12 meses',
ARRAY['creative', 'technical'], ARRAY['media', 'education'], ARRAY['creative_expression', 'impact', 'legacy'],
ARRAY['Ali Abdaal', 'Matt DAvella'], 
ARRAY['Define nicho y formato', 'Crea 30 videos consistentes', 'Optimiza para búsquedas', 'Monetiza con sponsors']),

('Podcast de Entrevistas a Expertos', 'podcast-expertos', 'content_education',
'Entrevista a expertos de un sector específico y monetiza con sponsors y productos.',
'Profesionales del sector',
'El networking con expertos es difícil para la mayoría',
'Sponsors €500-5000/episodio + productos',
ARRAY['creative', 'sales'], 300, 10, 2, '3-6 meses',
ARRAY['creative', 'sales'], ARRAY['media'], ARRAY['impact', 'passion'],
ARRAY['How I Built This', 'My First Million'], 
ARRAY['Define nicho y formato', 'Contacta primeros 10 invitados', 'Publica consistentemente', 'Busca sponsors']),

('Comunidad de Pago Online', 'comunidad-online', 'content_education',
'Crea una comunidad privada donde los miembros pagan por acceso a recursos, networking y contenido exclusivo.',
'Profesionales que buscan networking y aprendizaje',
'Las comunidades gratuitas tienen bajo engagement y calidad',
'Membresía €20-200/mes',
ARRAY['management', 'marketing'], 200, 15, 3, '2-4 meses',
ARRAY['management', 'marketing', 'creative'], ARRAY['education', 'services'], ARRAY['impact', 'passion'],
ARRAY['Trends.vc', 'Hampton'], 
ARRAY['Define propuesta de valor única', 'Construye audiencia primero', 'Lanza con grupo fundador', 'Itera según engagement']),

('Ebook/Guía Definitiva de Nicho', 'ebook-guia-nicho', 'content_education',
'Escribe la guía más completa sobre un tema específico y véndela online.',
'Principiantes y profesionales del tema',
'No existe una guía completa y actualizada sobre el tema',
'Venta única €20-100 o bundle con otros productos',
ARRAY['creative'], 100, 20, 2, '1-3 meses',
ARRAY['creative', 'marketing'], ARRAY['education'], ARRAY['creative_expression', 'legacy'],
ARRAY['Guías de Gumroad exitosas'], 
ARRAY['Investiga qué guías faltan', 'Estructura contenido completo', 'Escribe y diseña', 'Lanza con lista de espera']),

-- MARKETPLACE (10 ideas)
('Plataforma de Freelancers de Nicho', 'marketplace-freelancers', 'marketplace',
'Crea un marketplace que conecta freelancers especializados con clientes de un sector específico.',
'Empresas que buscan freelancers especializados',
'Los marketplaces genéricos tienen demasiado ruido',
'Comisión 10-20% por transacción',
ARRAY['technical', 'marketing'], 5000, 30, 5, '6-12 meses',
ARRAY['technical', 'marketing', 'operations'], ARRAY['tech', 'services'], ARRAY['financial_freedom', 'impact'],
ARRAY['Toptal', '99designs'], 
ARRAY['Identifica nicho desatendido', 'Valida con ambos lados', 'Construye MVP simple', 'Resuelve chicken-egg problem']),

('Directorio Premium de Industria', 'directorio-premium', 'marketplace',
'Crea un directorio curado de proveedores/profesionales de un sector con reseñas y filtros avanzados.',
'Empresas buscando proveedores confiables',
'Encontrar proveedores de calidad es difícil y costoso',
'Listados premium €50-500/mes + leads',
ARRAY['marketing', 'sales'], 1000, 15, 3, '2-4 meses',
ARRAY['marketing', 'sales'], ARRAY['services'], ARRAY['financial_freedom'],
ARRAY['Clutch', 'G2'], 
ARRAY['Elige sector con búsquedas activas', 'Crea directorio inicial gratuito', 'Añade valor con reseñas', 'Monetiza con premium']),

('Plataforma de Alquiler P2P de Nicho', 'alquiler-p2p', 'marketplace',
'Crea un marketplace para alquilar productos específicos entre particulares: equipos de foto, herramientas, deportes, etc.',
'Personas que necesitan productos ocasionalmente',
'Comprar productos de uso ocasional es caro e ineficiente',
'Comisión 15-25% por alquiler + seguro',
ARRAY['technical', 'operations'], 3000, 25, 4, '4-6 meses',
ARRAY['technical', 'operations', 'marketing'], ARRAY['services', 'retail'], ARRAY['impact', 'financial_freedom'],
ARRAY['Fat Llama', 'Spinlister'], 
ARRAY['Identifica categoría con demanda', 'Resuelve tema de seguros', 'Construye MVP local', 'Escala por ciudades']),

('Agregador de Servicios Locales', 'agregador-local', 'marketplace',
'Agrega y compara servicios locales de un tipo específico: reformas, mudanzas, eventos, etc.',
'Consumidores buscando servicios locales',
'Comparar y elegir proveedores locales es frustrante',
'Comisión por lead €10-100 o suscripción proveedores',
ARRAY['marketing', 'operations'], 2000, 20, 3, '3-6 meses',
ARRAY['marketing', 'operations', 'sales'], ARRAY['services'], ARRAY['financial_freedom'],
ARRAY['Habitissimo', 'GetYourGuide'], 
ARRAY['Elige categoría local rentable', 'Agrega proveedores manualmente', 'Genera demanda con SEO/ads', 'Automatiza matching']),

('Plataforma de Trueque Profesional', 'trueque-profesional', 'marketplace',
'Crea un marketplace donde profesionales intercambian servicios sin dinero: diseño por marketing, legal por contabilidad, etc.',
'Profesionales independientes y startups',
'Las startups necesitan servicios pero no tienen efectivo',
'Membresía €20-50/mes o comisión en créditos',
ARRAY['marketing', 'operations'], 1500, 20, 3, '3-6 meses',
ARRAY['marketing', 'operations'], ARRAY['services'], ARRAY['impact', 'flexibility'],
ARRAY['Simbi', 'BarterOnly'], 
ARRAY['Valida interés en comunidad', 'Define sistema de créditos', 'Construye MVP simple', 'Modera calidad'])

ON CONFLICT (slug) DO NOTHING;

-- 10. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_discovery_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_discovery_profiles_updated_at ON public.discovery_profiles;
CREATE TRIGGER trigger_update_discovery_profiles_updated_at
  BEFORE UPDATE ON public.discovery_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_discovery_profiles_updated_at();