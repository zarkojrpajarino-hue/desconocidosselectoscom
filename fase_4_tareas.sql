-- ============================================
-- FASE 4: SISTEMA EQUITATIVO DE COLABORACIÓN
-- TODOS colaboran con TODOS
-- 108 tareas: 72 con líder (67%) + 36 individuales (33%)
-- ============================================

-- ============================================
-- ZARKO (direccion) - 12 tareas
-- ============================================
INSERT INTO tasks (id, user_id, leader_id, title, description, area, phase, order_index) VALUES
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', 'Visión 2025', 'Planificar próximo año', 'direccion', 4, 1),
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', '936b22a4-98f3-4504-9f61-954d59183287', 'Brand evolution', 'Evolucionar identidad de marca', 'direccion', 4, 2),
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', 'ea1bc697-8936-4aa5-977d-cef3093d921a', 'R&D investment', 'Presupuesto para innovación', 'direccion', 4, 3),
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', 'f971aede-c68c-4f51-9045-86e751711697', 'Go-to-market strategy', 'Estrategia de penetración', 'direccion', 4, 4),
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'Customer acquisition', 'Estrategia de adquisición', 'direccion', 4, 5),
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'Org design', 'Rediseñar estructura', 'direccion', 4, 6),
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'Data-driven culture', 'Fomentar decisiones basadas en datos', 'direccion', 4, 7),
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', 'Risk management', 'Matriz de riesgos empresariales', 'direccion', 4, 8),
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', NULL, 'M&A strategy', 'Evaluar adquisiciones', 'direccion', 4, 9),
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', NULL, 'Strategic partnerships', 'Alianzas estratégicas clave', 'direccion', 4, 10),
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', NULL, 'Leadership development', 'Programa de liderazgo', 'direccion', 4, 11),
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', NULL, 'Exit strategy', 'Planificar IPO o exit', 'direccion', 4, 12);

-- ============================================
-- ÁNGEL (redes) - 12 tareas
-- ============================================
INSERT INTO tasks (id, user_id, leader_id, title, description, area, phase, order_index) VALUES
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', '915657d7-a65e-498d-97cf-993220a0cc59', 'Estrategia 2025', 'Plan anual de redes sociales', 'redes', 4, 1),
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', '936b22a4-98f3-4504-9f61-954d59183287', 'Brand refresh', 'Actualizar guidelines visuales', 'redes', 4, 2),
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', 'ea1bc697-8936-4aa5-977d-cef3093d921a', 'AI-powered content', 'Usar IA para creación', 'redes', 4, 3),
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', 'f971aede-c68c-4f51-9045-86e751711697', 'Sales enablement content', 'Recursos para cerrar ventas', 'redes', 4, 4),
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'Performance marketing', 'Optimizar ads para conversión', 'redes', 4, 5),
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'Content factory', 'Sistema de producción escalable', 'redes', 4, 6),
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'Social listening', 'Monitoreo de marca 24/7', 'redes', 4, 7),
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', 'Legal compliance', 'Asegurar cumplimiento en publicaciones', 'redes', 4, 8),
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', NULL, 'Thought leadership', 'Posicionar como referente', 'redes', 4, 9),
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', NULL, 'Multi-platform strategy', 'Presencia en todos los canales', 'redes', 4, 10),
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', NULL, 'Influencer partnerships', 'Programa de embajadores pro', 'redes', 4, 11),
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', NULL, 'Community platform', 'Crear espacio propio de comunidad', 'redes', 4, 12);

-- ============================================
-- CARLA (redes) - 12 tareas
-- ============================================
INSERT INTO tasks (id, user_id, leader_id, title, description, area, phase, order_index) VALUES
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', '915657d7-a65e-498d-97cf-993220a0cc59', 'Corporate storytelling', 'Narrativa empresarial coherente', 'redes', 4, 1),
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', 'Content excellence', 'Estándares de calidad máxima', 'redes', 4, 2),
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', 'ea1bc697-8936-4aa5-977d-cef3093d921a', 'Innovation showcase', 'Comunicar proyectos disruptivos', 'redes', 4, 3),
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', 'f971aede-c68c-4f51-9045-86e751711697', 'Customer advocates', 'Programa de clientes promotores', 'redes', 4, 4),
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'Conversion-focused content', 'Contenido que convierte', 'redes', 4, 5),
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'DAM implementation', 'Sistema de gestión de assets', 'redes', 4, 6),
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'Content intelligence', 'Analytics avanzado de contenido', 'redes', 4, 7),
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', 'Brand safety', 'Proteger reputación online', 'redes', 4, 8),
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', NULL, 'Documentary series', 'Producción audiovisual', 'redes', 4, 9),
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', NULL, 'Interactive experiences', 'Contenido inmersivo', 'redes', 4, 10),
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', NULL, 'Annual report', 'Reporte anual digital', 'redes', 4, 11),
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', NULL, 'Awards strategy', 'Participar en premios', 'redes', 4, 12);

-- ============================================
-- DIEGO (innovacion) - 12 tareas
-- ============================================
INSERT INTO tasks (id, user_id, leader_id, title, description, area, phase, order_index) VALUES
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', '915657d7-a65e-498d-97cf-993220a0cc59', 'Innovation roadmap 2025', 'Plan anual de innovación', 'innovacion', 4, 1),
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', 'Metaverse strategy', 'Presencia en mundos virtuales', 'innovacion', 4, 2),
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', '936b22a4-98f3-4504-9f61-954d59183287', 'Transmedia storytelling', 'Narrativas multiplataforma', 'innovacion', 4, 3),
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', 'f971aede-c68c-4f51-9045-86e751711697', 'AI sales assistant', 'Asistente virtual para ventas', 'innovacion', 4, 4),
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'Personalization engine', 'Hiperpersonalización con ML', 'innovacion', 4, 5),
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'No-code platform', 'Herramientas sin programación', 'innovacion', 4, 6),
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'Advanced analytics', 'Ciencia de datos aplicada', 'innovacion', 4, 7),
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', 'AI ethics framework', 'Marco ético para IA', 'innovacion', 4, 8),
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', NULL, 'Quantum computing', 'Explorar computación cuántica', 'innovacion', 4, 9),
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', NULL, 'Web3 experiments', 'Proyectos blockchain', 'innovacion', 4, 10),
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', NULL, 'Innovation hub', 'Centro de innovación físico', 'innovacion', 4, 11),
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', NULL, 'Patent strategy', 'Proteger innovaciones', 'innovacion', 4, 12);

-- ============================================
-- FERNANDO (ventas) - 12 tareas
-- ============================================
INSERT INTO tasks (id, user_id, leader_id, title, description, area, phase, order_index) VALUES
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', '915657d7-a65e-498d-97cf-993220a0cc59', 'Sales strategy 2025', 'Plan comercial anual', 'ventas', 4, 1),
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', 'Sales storytelling', 'Narrativas de venta potentes', 'ventas', 4, 2),
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', '936b22a4-98f3-4504-9f61-954d59183287', 'Customer stories', 'Banco de casos de éxito', 'ventas', 4, 3),
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', 'ea1bc697-8936-4aa5-977d-cef3093d921a', 'Sales tech stack', 'Automatización completa', 'ventas', 4, 4),
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'Lead nurturing', 'Colaboración marketing-ventas', 'ventas', 4, 5),
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'Revenue operations', 'Alinear operaciones con revenue', 'ventas', 4, 6),
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'Predictive sales', 'Forecasting con IA', 'ventas', 4, 7),
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', 'Contract management', 'Sistema de contratos digitales', 'ventas', 4, 8),
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', NULL, 'Enterprise sales', 'Desarrollar equipo enterprise', 'ventas', 4, 9),
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', NULL, 'Customer retention', 'Programa de fidelización', 'ventas', 4, 10),
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', NULL, 'Global expansion', 'Ventas internacionales', 'ventas', 4, 11),
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', NULL, 'Sales academy', 'Capacitación continua', 'ventas', 4, 12);

-- ============================================
-- FER (leads) - 12 tareas
-- ============================================
INSERT INTO tasks (id, user_id, leader_id, title, description, area, phase, order_index) VALUES
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', '915657d7-a65e-498d-97cf-993220a0cc59', 'Growth plan 2025', 'Estrategia de crecimiento anual', 'leads', 4, 1),
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', 'Organic growth', 'SEO y contenido orgánico', 'leads', 4, 2),
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', '936b22a4-98f3-4504-9f61-954d59183287', 'Content marketing', 'Hub de recursos educativos', 'leads', 4, 3),
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'ea1bc697-8936-4aa5-977d-cef3093d921a', 'Marketing automation', 'Plataforma all-in-one', 'leads', 4, 4),
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'f971aede-c68c-4f51-9045-86e751711697', 'Sales alignment', 'SLA entre marketing y ventas', 'leads', 4, 5),
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'Marketing ops', 'Infraestructura de marketing', 'leads', 4, 6),
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'Marketing analytics', 'ROI y attribution completo', 'leads', 4, 7),
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', 'Data privacy', 'Cumplimiento total GDPR', 'leads', 4, 8),
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', NULL, 'Product-led growth', 'Modelo PLG', 'leads', 4, 9),
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', NULL, 'Community-led growth', 'Crecimiento por comunidad', 'leads', 4, 10),
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', NULL, 'Influencer marketing', 'Programa estructurado', 'leads', 4, 11),
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', NULL, 'Event marketing', 'Conferencias y webinars', 'leads', 4, 12);

-- ============================================
-- MIGUEL (operaciones) - 12 tareas
-- ============================================
INSERT INTO tasks (id, user_id, leader_id, title, description, area, phase, order_index) VALUES
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', '915657d7-a65e-498d-97cf-993220a0cc59', 'Operational excellence', 'Programa de mejora continua', 'operaciones', 4, 1),
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', 'Content supply chain', 'Optimizar producción', 'operaciones', 4, 2),
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', '936b22a4-98f3-4504-9f61-954d59183287', 'Creative operations', 'Workflows de diseño', 'operaciones', 4, 3),
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'ea1bc697-8936-4aa5-977d-cef3093d921a', 'Product operations', 'Gestión de proyectos tech', 'operaciones', 4, 4),
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'f971aede-c68c-4f51-9045-86e751711697', 'Revenue operations', 'Alinear con objetivos de revenue', 'operaciones', 4, 5),
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'Marketing operations', 'Tech stack integrado', 'operaciones', 4, 6),
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'Data operations', 'Pipelines y gobernanza', 'operaciones', 4, 7),
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', 'Compliance operations', 'Auditorías automatizadas', 'operaciones', 4, 8),
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', NULL, 'Change management', 'Gestión del cambio', 'operaciones', 4, 9),
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', NULL, 'IT infrastructure', 'Arquitectura escalable', 'operaciones', 4, 10),
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', NULL, 'Cybersecurity', 'Protección de sistemas', 'operaciones', 4, 11),
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', NULL, 'Disaster recovery', 'Plan de recuperación', 'operaciones', 4, 12);

-- ============================================
-- MANU (analiticas) - 12 tareas
-- ============================================
INSERT INTO tasks (id, user_id, leader_id, title, description, area, phase, order_index) VALUES
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', '915657d7-a65e-498d-97cf-993220a0cc59', 'Analytics strategy', 'Roadmap de analytics', 'analiticas', 4, 1),
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', 'Social intelligence', 'Insights de audiencias', 'analiticas', 4, 2),
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', '936b22a4-98f3-4504-9f61-954d59183287', 'Content optimization', 'Analytics de performance', 'analiticas', 4, 3),
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'ea1bc697-8936-4aa5-977d-cef3093d921a', 'Product analytics', 'Métricas de uso', 'analiticas', 4, 4),
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'f971aede-c68c-4f51-9045-86e751711697', 'Revenue analytics', 'Análisis de ingresos', 'analiticas', 4, 5),
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'Customer analytics', 'Lifetime value y churn', 'analiticas', 4, 6),
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'Operational analytics', 'Eficiencia y productividad', 'analiticas', 4, 7),
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', 'Risk analytics', 'Modelado de riesgos', 'analiticas', 4, 8),
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', NULL, 'AI/ML platform', 'Infraestructura de ML', 'analiticas', 4, 9),
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', NULL, 'Real-time analytics', 'Dashboards en vivo', 'analiticas', 4, 10),
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', NULL, 'Data science team', 'Contratar científicos de datos', 'analiticas', 4, 11),
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', NULL, 'Analytics training', 'Capacitar toda la empresa', 'analiticas', 4, 12);

-- ============================================
-- CASTI (cumplimiento) - 12 tareas
-- ============================================
INSERT INTO tasks (id, user_id, leader_id, title, description, area, phase, order_index) VALUES
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', '915657d7-a65e-498d-97cf-993220a0cc59', 'Compliance framework', 'Marco de cumplimiento integral', 'cumplimiento', 4, 1),
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', 'Social compliance', 'Verificar cumplimiento en RRSS', 'cumplimiento', 4, 2),
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', '936b22a4-98f3-4504-9f61-954d59183287', 'Content audits', 'Auditorías de publicaciones', 'cumplimiento', 4, 3),
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', 'ea1bc697-8936-4aa5-977d-cef3093d921a', 'Tech compliance', 'Normativas tecnológicas', 'cumplimiento', 4, 4),
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', 'f971aede-c68c-4f51-9045-86e751711697', 'Contract compliance', 'Revisión legal de contratos', 'cumplimiento', 4, 5),
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'Marketing compliance', 'GDPR y regulaciones', 'cumplimiento', 4, 6),
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'Operational compliance', 'Procesos auditables', 'cumplimiento', 4, 7),
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'Data governance', 'Políticas de datos', 'cumplimiento', 4, 8),
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', NULL, 'Regulatory affairs', 'Relaciones con reguladores', 'cumplimiento', 4, 9),
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', NULL, 'Internal audit', 'Programa de auditoría interna', 'cumplimiento', 4, 10),
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', NULL, 'Training program', 'Capacitación en compliance', 'cumplimiento', 4, 11),
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', NULL, 'Compliance culture', 'Fomentar cultura de cumplimiento', 'cumplimiento', 4, 12);
