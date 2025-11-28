-- ============================================
-- FASE 2: SISTEMA EQUITATIVO DE COLABORACIÓN
-- TODOS colaboran con TODOS
-- 108 tareas: 72 con líder (67%) + 36 individuales (33%)
-- ============================================

-- ============================================
-- ZARKO (direccion) - 12 tareas
-- 8 con líder: [Angel, Carla, Diego, Fernando, Fer, Miguel, Manu, Casti]
-- 4 individuales
-- ============================================
INSERT INTO tasks (id, user_id, leader_id, title, description, area, phase, order_index) VALUES
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', 'Definir visión trimestral con equipo', 'Sesión estratégica para definir objetivos del Q2', 'direccion', 2, 1),
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', '936b22a4-98f3-4504-9f61-954d59183287', 'Revisar estrategia de comunicación', 'Alinear mensajes clave para stakeholders', 'direccion', 2, 2),
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', 'ea1bc697-8936-4aa5-977d-cef3093d921a', 'Evaluar proyectos de innovación', 'Priorizar iniciativas de innovación para Q2', 'direccion', 2, 3),
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', 'f971aede-c68c-4f51-9045-86e751711697', 'Coordinar estrategia comercial', 'Alinear objetivos de ventas con estrategia general', 'direccion', 2, 4),
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'Optimizar funnel de conversión', 'Revisar proceso de generación de leads', 'direccion', 2, 5),
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'Mejorar procesos operativos', 'Identificar cuellos de botella en operaciones', 'direccion', 2, 6),
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'Analizar métricas de negocio', 'Dashboard ejecutivo con KPIs principales', 'direccion', 2, 7),
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', 'Actualizar políticas internas', 'Revisar compliance y normativas', 'direccion', 2, 8),
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', NULL, 'Gestionar relaciones con inversores', 'Preparar reportes financieros para inversores', 'direccion', 2, 9),
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', NULL, 'Planificar expansión geográfica', 'Evaluar nuevos mercados potenciales', 'direccion', 2, 10),
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', NULL, 'Desarrollar plan de contratación', 'Identificar posiciones clave para Q2', 'direccion', 2, 11),
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', NULL, 'Revisar estructura organizacional', 'Optimizar organigramay responsabilidades', 'direccion', 2, 12);

-- ============================================
-- ÁNGEL (redes) - 12 tareas
-- 8 con líder: [Zarko, Carla, Diego, Fernando, Fer, Miguel, Manu, Casti]
-- 4 individuales
-- ============================================
INSERT INTO tasks (id, user_id, leader_id, title, description, area, phase, order_index) VALUES
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', '915657d7-a65e-498d-97cf-993220a0cc59', 'Estrategia de contenido Q2', 'Plan editorial para redes sociales trimestral', 'redes', 2, 1),
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', '936b22a4-98f3-4504-9f61-954d59183287', 'Campaña de engagement', 'Aumentar interacción con comunidad', 'redes', 2, 2),
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', 'ea1bc697-8936-4aa5-977d-cef3093d921a', 'Probar nuevos formatos', 'Experimentar con Reels e IG Stories', 'redes', 2, 3),
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', 'f971aede-c68c-4f51-9045-86e751711697', 'Contenido para ventas', 'Material de apoyo para equipo comercial', 'redes', 2, 4),
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'Lead magnets visuales', 'Diseñar recursos descargables', 'redes', 2, 5),
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'Automatizar publicaciones', 'Configurar herramientas de scheduling', 'redes', 2, 6),
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'Analizar performance redes', 'Métricas de alcance y engagement', 'redes', 2, 7),
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', 'Guidelines de marca', 'Manual de estilo para redes sociales', 'redes', 2, 8),
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', NULL, 'Community management', 'Gestión diaria de interacciones', 'redes', 2, 9),
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', NULL, 'Influencer outreach', 'Identificar y contactar influencers', 'redes', 2, 10),
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', NULL, 'Gestión de crisis online', 'Protocolo de respuesta ante crisis', 'redes', 2, 11),
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', NULL, 'Crear banco de contenido', 'Biblioteca de assets reutilizables', 'redes', 2, 12);

-- ============================================
-- CARLA (redes) - 12 tareas
-- 8 con líder: [Zarko, Angel, Diego, Fernando, Fer, Miguel, Manu, Casti]
-- 4 individuales
-- ============================================
INSERT INTO tasks (id, user_id, leader_id, title, description, area, phase, order_index) VALUES
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', '915657d7-a65e-498d-97cf-993220a0cc59', 'Alinear comunicación corporativa', 'Mensajes clave para stakeholders', 'redes', 2, 1),
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', 'Coordinar calendario editorial', 'Planificar contenido semanal', 'redes', 2, 2),
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', 'ea1bc697-8936-4aa5-977d-cef3093d921a', 'Contenido de innovación', 'Comunicar proyectos de innovación', 'redes', 2, 3),
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', 'f971aede-c68c-4f51-9045-86e751711697', 'Casos de éxito clientes', 'Testimonios y case studies', 'redes', 2, 4),
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'Contenido para captar leads', 'Posts educativos para audiencia fría', 'redes', 2, 5),
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'Optimizar procesos de diseño', 'Flujo de trabajo para crear contenido', 'redes', 2, 6),
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'Reportes de audiencia', 'Análisis demográfico y comportamiento', 'redes', 2, 7),
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', 'Políticas de publicación', 'Normativas para contenido en redes', 'redes', 2, 8),
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', NULL, 'Crear stories diarios', 'Contenido efímero para engagement', 'redes', 2, 9),
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', NULL, 'Gestionar mensajes directos', 'Responder DMs y consultas', 'redes', 2, 10),
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', NULL, 'Auditoría de competencia', 'Analizar estrategia de competidores', 'redes', 2, 11),
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', NULL, 'Capacitación en herramientas', 'Entrenar en nuevas plataformas', 'redes', 2, 12);

-- ============================================
-- DIEGO (innovacion) - 12 tareas
-- 8 con líder: [Zarko, Angel, Carla, Fernando, Fer, Miguel, Manu, Casti]
-- 4 individuales
-- ============================================
INSERT INTO tasks (id, user_id, leader_id, title, description, area, phase, order_index) VALUES
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', '915657d7-a65e-498d-97cf-993220a0cc59', 'Roadmap de innovación Q2', 'Planificar proyectos de innovación', 'innovacion', 2, 1),
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', 'Innovar en contenido digital', 'Nuevos formatos para redes sociales', 'innovacion', 2, 2),
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', '936b22a4-98f3-4504-9f61-954d59183287', 'Estrategia de comunicación tech', 'Comunicar innovaciones al mercado', 'innovacion', 2, 3),
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', 'f971aede-c68c-4f51-9045-86e751711697', 'Herramientas de ventas', 'Implementar CRM avanzado', 'innovacion', 2, 4),
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'Automatización de leads', 'Sistema automático de scoring', 'innovacion', 2, 5),
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'Optimizar operaciones con IA', 'Implementar automatizaciones', 'innovacion', 2, 6),
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'Dashboard predictivo', 'Analytics con machine learning', 'innovacion', 2, 7),
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', 'Compliance en innovación', 'Asegurar normativas en proyectos', 'innovacion', 2, 8),
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', NULL, 'Investigar nuevas tecnologías', 'Explorar IA, blockchain, Web3', 'innovacion', 2, 9),
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', NULL, 'Prototipo MVP nuevo producto', 'Validar idea con clientes', 'innovacion', 2, 10),
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', NULL, 'Hackathon interno', 'Organizar sesión de innovación', 'innovacion', 2, 11),
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', NULL, 'Alianzas tecnológicas', 'Identificar partners estratégicos', 'innovacion', 2, 12);

-- ============================================
-- FERNANDO (ventas) - 12 tareas
-- 8 con líder: [Zarko, Angel, Carla, Diego, Fer, Miguel, Manu, Casti]
-- 4 individuales
-- ============================================
INSERT INTO tasks (id, user_id, leader_id, title, description, area, phase, order_index) VALUES
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', '915657d7-a65e-498d-97cf-993220a0cc59', 'Definir objetivos de ventas Q2', 'Metas de revenue y crecimiento', 'ventas', 2, 1),
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', 'Material de ventas actualizado', 'Presentaciones y decks comerciales', 'ventas', 2, 2),
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', '936b22a4-98f3-4504-9f61-954d59183287', 'Casos de éxito para ventas', 'Recopilar testimonios de clientes', 'ventas', 2, 3),
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', 'ea1bc697-8936-4aa5-977d-cef3093d921a', 'CRM y automatización', 'Implementar herramientas de ventas', 'ventas', 2, 4),
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'Coordinar leads con marketing', 'Flujo de MQL a SQL', 'ventas', 2, 5),
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'Optimizar proceso de ventas', 'Reducir tiempo de cierre', 'ventas', 2, 6),
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'Análisis de pipeline', 'Forecast y proyección de ventas', 'ventas', 2, 7),
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', 'Contratos y términos', 'Actualizar documentación legal', 'ventas', 2, 8),
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', NULL, 'Prospectar cuentas enterprise', 'Identificar grandes clientes', 'ventas', 2, 9),
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', NULL, 'Capacitación equipo ventas', 'Entrenar en nuevas técnicas', 'ventas', 2, 10),
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', NULL, 'Gestionar cuentas clave', 'Account management estratégico', 'ventas', 2, 11),
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', NULL, 'Eventos y networking', 'Asistir a ferias y conferencias', 'ventas', 2, 12);

-- ============================================
-- FER (leads) - 12 tareas
-- 8 con líder: [Zarko, Angel, Carla, Diego, Fernando, Miguel, Manu, Casti]
-- 4 individuales
-- ============================================
INSERT INTO tasks (id, user_id, leader_id, title, description, area, phase, order_index) VALUES
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', '915657d7-a65e-498d-97cf-993220a0cc59', 'Estrategia de generación Q2', 'Plan de lead generation trimestral', 'leads', 2, 1),
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', 'Campañas en redes para leads', 'Ads en Facebook e Instagram', 'leads', 2, 2),
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', '936b22a4-98f3-4504-9f61-954d59183287', 'Lead magnets creativos', 'Ebooks y recursos descargables', 'leads', 2, 3),
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'ea1bc697-8936-4aa5-977d-cef3093d921a', 'Automatización de nurturing', 'Workflows y secuencias de emails', 'leads', 2, 4),
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'f971aede-c68c-4f51-9045-86e751711697', 'Calificar leads para ventas', 'Sistema de scoring y segmentación', 'leads', 2, 5),
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'Optimizar landing pages', 'Mejorar conversión de formularios', 'leads', 2, 6),
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'Análisis de conversión', 'Métricas de funnel y CAC', 'leads', 2, 7),
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', 'Compliance en captación', 'GDPR y políticas de privacidad', 'leads', 2, 8),
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', NULL, 'Webinars para captar leads', 'Organizar eventos online', 'leads', 2, 9),
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', NULL, 'SEO y contenido orgánico', 'Optimizar para búsquedas', 'leads', 2, 10),
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', NULL, 'Email marketing campaigns', 'Newsletters y secuencias', 'leads', 2, 11),
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', NULL, 'Partnerships para leads', 'Co-marketing con aliados', 'leads', 2, 12);

-- ============================================
-- MIGUEL (operaciones) - 12 tareas
-- 8 con líder: [Zarko, Angel, Carla, Diego, Fernando, Fer, Manu, Casti]
-- 4 individuales
-- ============================================
INSERT INTO tasks (id, user_id, leader_id, title, description, area, phase, order_index) VALUES
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', '915657d7-a65e-498d-97cf-993220a0cc59', 'Plan operativo Q2', 'Definir procesos y recursos', 'operaciones', 2, 1),
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', 'Procesos de contenido', 'Flujo de trabajo para redes', 'operaciones', 2, 2),
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', '936b22a4-98f3-4504-9f61-954d59183287', 'Operativa de diseño', 'Estandarizar creación de assets', 'operaciones', 2, 3),
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'ea1bc697-8936-4aa5-977d-cef3093d921a', 'Gestión de proyectos tech', 'Metodología ágil para innovación', 'operaciones', 2, 4),
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'f971aede-c68c-4f51-9045-86e751711697', 'Operaciones de ventas', 'CRM y procesos comerciales', 'operaciones', 2, 5),
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'Automatización marketing', 'Workflows y herramientas', 'operaciones', 2, 6),
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'Infraestructura de datos', 'Setup de analytics y reportes', 'operaciones', 2, 7),
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', 'Documentación de procesos', 'Manuales y SOPs', 'operaciones', 2, 8),
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', NULL, 'Gestión de proveedores', 'Contratar y supervisar vendors', 'operaciones', 2, 9),
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', NULL, 'Control de presupuesto', 'Monitorear gastos operativos', 'operaciones', 2, 10),
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', NULL, 'Optimizar herramientas', 'Consolidar stack tecnológico', 'operaciones', 2, 11),
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', NULL, 'Capacitación operativa', 'Entrenar en procesos y sistemas', 'operaciones', 2, 12);

-- ============================================
-- MANU (analiticas) - 12 tareas
-- 8 con líder: [Zarko, Angel, Carla, Diego, Fernando, Fer, Miguel, Casti]
-- 4 individuales
-- ============================================
INSERT INTO tasks (id, user_id, leader_id, title, description, area, phase, order_index) VALUES
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', '915657d7-a65e-498d-97cf-993220a0cc59', 'Dashboard ejecutivo', 'KPIs principales para dirección', 'analiticas', 2, 1),
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', 'Métricas de redes sociales', 'Análisis de engagement y alcance', 'analiticas', 2, 2),
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', '936b22a4-98f3-4504-9f61-954d59183287', 'Performance de contenido', 'Qué posts funcionan mejor', 'analiticas', 2, 3),
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'ea1bc697-8936-4aa5-977d-cef3093d921a', 'ROI de proyectos innovación', 'Medir impacto de iniciativas', 'analiticas', 2, 4),
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'f971aede-c68c-4f51-9045-86e751711697', 'Analytics de ventas', 'Pipeline, conversión, forecast', 'analiticas', 2, 5),
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'Análisis de leads', 'CAC, conversión, calidad', 'analiticas', 2, 6),
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'Métricas operativas', 'Eficiencia y productividad', 'analiticas', 2, 7),
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', 'Reportes de compliance', 'Auditoría y seguimiento', 'analiticas', 2, 8),
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', NULL, 'Configurar Google Analytics', 'Setup completo de tracking', 'analiticas', 2, 9),
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', NULL, 'A/B testing framework', 'Implementar cultura de testing', 'analiticas', 2, 10),
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', NULL, 'Análisis de competencia', 'Benchmarking de mercado', 'analiticas', 2, 11),
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', NULL, 'Capacitación en analytics', 'Entrenar al equipo en métricas', 'analiticas', 2, 12);

-- ============================================
-- CASTI (cumplimiento) - 12 tareas
-- 8 con líder: [Zarko, Angel, Carla, Diego, Fernando, Fer, Miguel, Manu]
-- 4 individuales
-- ============================================
INSERT INTO tasks (id, user_id, leader_id, title, description, area, phase, order_index) VALUES
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', '915657d7-a65e-498d-97cf-993220a0cc59', 'Auditoría de políticas', 'Revisar compliance general', 'cumplimiento', 2, 1),
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', 'Guidelines de comunicación', 'Normativas para redes sociales', 'cumplimiento', 2, 2),
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', '936b22a4-98f3-4504-9f61-954d59183287', 'Derechos de autor contenido', 'Verificar uso de imágenes y música', 'cumplimiento', 2, 3),
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', 'ea1bc697-8936-4aa5-977d-cef3093d921a', 'Compliance en innovación', 'Normativas para nuevos productos', 'cumplimiento', 2, 4),
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', 'f971aede-c68c-4f51-9045-86e751711697', 'Contratos y términos ventas', 'Revisar documentación legal', 'cumplimiento', 2, 5),
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'GDPR y privacidad leads', 'Compliance en captación datos', 'cumplimiento', 2, 6),
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'Auditoría de procesos', 'Verificar cumplimiento operativo', 'cumplimiento', 2, 7),
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'Reportes regulatorios', 'Documentación para autoridades', 'cumplimiento', 2, 8),
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', NULL, 'Actualizar políticas internas', 'Revisar código de conducta', 'cumplimiento', 2, 9),
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', NULL, 'Capacitación en compliance', 'Entrenar al equipo en normativas', 'cumplimiento', 2, 10),
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', NULL, 'Gestión de riesgos', 'Identificar y mitigar riesgos', 'cumplimiento', 2, 11),
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', NULL, 'Certificaciones ISO', 'Preparar auditorías externas', 'cumplimiento', 2, 12);
