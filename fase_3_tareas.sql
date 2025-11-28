-- ============================================
-- FASE 3: SISTEMA EQUITATIVO DE COLABORACIÓN
-- TODOS colaboran con TODOS
-- 108 tareas: 72 con líder (67%) + 36 individuales (33%)
-- ============================================

-- ============================================
-- ZARKO (direccion) - 12 tareas
-- ============================================
INSERT INTO tasks (id, user_id, leader_id, title, description, area, phase, order_index) VALUES
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', 'Estrategia de marca Q3', 'Evolución de branding y posicionamiento', 'direccion', 3, 1),
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', '936b22a4-98f3-4504-9f61-954d59183287', 'Plan de comunicación externa', 'PR y relaciones con medios', 'direccion', 3, 2),
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', 'ea1bc697-8936-4aa5-977d-cef3093d921a', 'Portfolio de productos', 'Planificar nuevas líneas de negocio', 'direccion', 3, 3),
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', 'f971aede-c68c-4f51-9045-86e751711697', 'Estrategia de pricing', 'Revisar modelo de monetización', 'direccion', 3, 4),
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'Estrategia de growth', 'Plan de crecimiento acelerado', 'direccion', 3, 5),
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'Escalabilidad operativa', 'Preparar para crecimiento 10x', 'direccion', 3, 6),
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'OKRs trimestrales', 'Definir objetivos y KRs Q3', 'direccion', 3, 7),
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', 'Gobierno corporativo', 'Estructurar board y governance', 'direccion', 3, 8),
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', NULL, 'Ronda de financiamiento', 'Preparar Series A', 'direccion', 3, 9),
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', NULL, 'Plan de internacionalización', 'Estrategia de expansión global', 'direccion', 3, 10),
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', NULL, 'Cultura organizacional', 'Definir valores y cultura', 'direccion', 3, 11),
(gen_random_uuid(), '915657d7-a65e-498d-97cf-993220a0cc59', NULL, 'Plan de sucesión', 'Identificar líderes futuros', 'direccion', 3, 12);

-- ============================================
-- ÁNGEL (redes) - 12 tareas
-- ============================================
INSERT INTO tasks (id, user_id, leader_id, title, description, area, phase, order_index) VALUES
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', '915657d7-a65e-498d-97cf-993220a0cc59', 'Rebranding en redes', 'Actualizar identidad visual', 'redes', 3, 1),
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', '936b22a4-98f3-4504-9f61-954d59183287', 'Calendario de campañas', 'Planificar lanzamientos Q3', 'redes', 3, 2),
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', 'ea1bc697-8936-4aa5-977d-cef3093d921a', 'Contenido de producto', 'Comunicar nuevos features', 'redes', 3, 3),
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', 'f971aede-c68c-4f51-9045-86e751711697', 'Social selling', 'Capacitar ventas en LinkedIn', 'redes', 3, 4),
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'Ads optimization', 'Mejorar ROI de campañas pagadas', 'redes', 3, 5),
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'Workflow de aprobaciones', 'Proceso de review de contenido', 'redes', 3, 6),
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'Análisis de sentimiento', 'Monitorear percepción de marca', 'redes', 3, 7),
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', 'Políticas de moderación', 'Guidelines para comentarios', 'redes', 3, 8),
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', NULL, 'Live streaming strategy', 'Eventos en vivo semanales', 'redes', 3, 9),
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', NULL, 'User generated content', 'Programa de embajadores', 'redes', 3, 10),
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', NULL, 'TikTok strategy', 'Expandir a nueva plataforma', 'redes', 3, 11),
(gen_random_uuid(), 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', NULL, 'Crisis management plan', 'Protocolo ante problemas virales', 'redes', 3, 12);

-- ============================================
-- CARLA (redes) - 12 tareas
-- ============================================
INSERT INTO tasks (id, user_id, leader_id, title, description, area, phase, order_index) VALUES
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', '915657d7-a65e-498d-97cf-993220a0cc59', 'Comunicación de valores', 'Transmitir cultura empresarial', 'redes', 3, 1),
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', 'Biblioteca de templates', 'Crear recursos reutilizables', 'redes', 3, 2),
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', 'ea1bc697-8936-4aa5-977d-cef3093d921a', 'Comunicar innovación', 'Behind the scenes de proyectos', 'redes', 3, 3),
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', 'f971aede-c68c-4f51-9045-86e751711697', 'Success stories', 'Historias de clientes exitosos', 'redes', 3, 4),
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'Contenido educativo', 'Tutoriales y how-tos', 'redes', 3, 5),
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'Asset management', 'Organizar biblioteca de medios', 'redes', 3, 6),
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'Content performance', 'Analizar qué funciona mejor', 'redes', 3, 7),
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', 'Accesibilidad en contenido', 'Subtítulos y alt text', 'redes', 3, 8),
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', NULL, 'Podcast production', 'Lanzar canal de audio', 'redes', 3, 9),
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', NULL, 'Newsletter mensual', 'Contenido exclusivo por email', 'redes', 3, 10),
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', NULL, 'Employer branding', 'Contenido de cultura laboral', 'redes', 3, 11),
(gen_random_uuid(), '936b22a4-98f3-4504-9f61-954d59183287', NULL, 'Video marketing', 'Producción de videos mensuales', 'redes', 3, 12);

-- ============================================
-- DIEGO (innovacion) - 12 tareas
-- ============================================
INSERT INTO tasks (id, user_id, leader_id, title, description, area, phase, order_index) VALUES
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', '915657d7-a65e-498d-97cf-993220a0cc59', 'Producto innovador Q3', 'Desarrollar nueva línea de negocio', 'innovacion', 3, 1),
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', 'Experiencias interactivas', 'AR/VR en redes sociales', 'innovacion', 3, 2),
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', '936b22a4-98f3-4504-9f61-954d59183287', 'Storytelling tecnológico', 'Comunicar innovación de forma simple', 'innovacion', 3, 3),
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', 'f971aede-c68c-4f51-9045-86e751711697', 'Sales enablement tech', 'Herramientas para equipo comercial', 'innovacion', 3, 4),
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'Marketing automation', 'Plataforma all-in-one', 'innovacion', 3, 5),
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'Process automation', 'RPA para tareas repetitivas', 'innovacion', 3, 6),
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'Predictive analytics', 'ML para forecasting', 'innovacion', 3, 7),
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', 'Tech compliance', 'Seguridad y privacidad en proyectos', 'innovacion', 3, 8),
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', NULL, 'Laboratorio de ideas', 'Incubadora de proyectos internos', 'innovacion', 3, 9),
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', NULL, 'Open innovation', 'Colaborar con startups externas', 'innovacion', 3, 10),
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', NULL, 'Tech scouting', 'Monitorear tendencias emergentes', 'innovacion', 3, 11),
(gen_random_uuid(), 'ea1bc697-8936-4aa5-977d-cef3093d921a', NULL, 'Innovation metrics', 'Medir ROI de innovación', 'innovacion', 3, 12);

-- ============================================
-- FERNANDO (ventas) - 12 tareas
-- ============================================
INSERT INTO tasks (id, user_id, leader_id, title, description, area, phase, order_index) VALUES
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', '915657d7-a65e-498d-97cf-993220a0cc59', 'Plan comercial Q3', 'Estrategia de ventas trimestral', 'ventas', 3, 1),
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', 'Contenido de ventas', 'One-pagers y case studies', 'ventas', 3, 2),
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', '936b22a4-98f3-4504-9f61-954d59183287', 'Testimonios en video', 'Grabar casos de éxito', 'ventas', 3, 3),
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', 'ea1bc697-8936-4aa5-977d-cef3093d921a', 'Herramientas de prospección', 'Automatizar outbound', 'ventas', 3, 4),
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'Handoff marketing-sales', 'Mejorar traspaso de leads', 'ventas', 3, 5),
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'CRM optimization', 'Configurar pipelines y automatizaciones', 'ventas', 3, 6),
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'Sales dashboards', 'Reportes en tiempo real', 'ventas', 3, 7),
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', 'Compliance en contratos', 'Templates legales actualizados', 'ventas', 3, 8),
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', NULL, 'Partner channel strategy', 'Desarrollar canal indirecto', 'ventas', 3, 9),
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', NULL, 'Upsell y cross-sell', 'Estrategia de expansión de cuentas', 'ventas', 3, 10),
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', NULL, 'Sales playbook', 'Documentar mejores prácticas', 'ventas', 3, 11),
(gen_random_uuid(), 'f971aede-c68c-4f51-9045-86e751711697', NULL, 'Customer success handoff', 'Transición post-venta', 'ventas', 3, 12);

-- ============================================
-- FER (leads) - 12 tareas
-- ============================================
INSERT INTO tasks (id, user_id, leader_id, title, description, area, phase, order_index) VALUES
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', '915657d7-a65e-498d-97cf-993220a0cc59', 'Growth hacking Q3', 'Experimentos de crecimiento', 'leads', 3, 1),
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', 'Viral campaigns', 'Contenido con potencial viral', 'leads', 3, 2),
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', '936b22a4-98f3-4504-9f61-954d59183287', 'Content upgrade', 'Mejorar lead magnets existentes', 'leads', 3, 3),
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'ea1bc697-8936-4aa5-977d-cef3093d921a', 'Chatbot inteligente', 'IA para calificación inicial', 'leads', 3, 4),
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'f971aede-c68c-4f51-9045-86e751711697', 'MQL to SQL optimization', 'Mejorar calidad de leads', 'leads', 3, 5),
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'Lead routing automation', 'Distribución inteligente de leads', 'leads', 3, 6),
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'Attribution modeling', 'Entender qué canales funcionan', 'leads', 3, 7),
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', 'Double opt-in compliance', 'Asegurar consentimiento', 'leads', 3, 8),
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', NULL, 'Referral program', 'Programa de referidos', 'leads', 3, 9),
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', NULL, 'Retargeting campaigns', 'Recuperar visitantes perdidos', 'leads', 3, 10),
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', NULL, 'Community building', 'Crear comunidad de usuarios', 'leads', 3, 11),
(gen_random_uuid(), '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', NULL, 'Freemium strategy', 'Modelo de conversión gratuito-pago', 'leads', 3, 12);

-- ============================================
-- MIGUEL (operaciones) - 12 tareas
-- ============================================
INSERT INTO tasks (id, user_id, leader_id, title, description, area, phase, order_index) VALUES
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', '915657d7-a65e-498d-97cf-993220a0cc59', 'Escalabilidad Q3', 'Preparar para crecimiento 3x', 'operaciones', 3, 1),
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', 'Content ops', 'Escalar producción de contenido', 'operaciones', 3, 2),
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', '936b22a4-98f3-4504-9f61-954d59183287', 'Design system', 'Biblioteca de componentes', 'operaciones', 3, 3),
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'ea1bc697-8936-4aa5-977d-cef3093d921a', 'Agile at scale', 'Metodología para múltiples equipos', 'operaciones', 3, 4),
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'f971aede-c68c-4f51-9045-86e751711697', 'Sales ops excellence', 'Optimizar proceso comercial', 'operaciones', 3, 5),
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'Marketing ops platform', 'Stack tecnológico integrado', 'operaciones', 3, 6),
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'Data infrastructure', 'Warehouse y pipelines', 'operaciones', 3, 7),
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', 'Process documentation', 'Wiki de procesos completo', 'operaciones', 3, 8),
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', NULL, 'Vendor management', 'Consolidar proveedores', 'operaciones', 3, 9),
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', NULL, 'Team collaboration tools', 'Optimizar herramientas internas', 'operaciones', 3, 10),
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', NULL, 'Knowledge base', 'Central de documentación', 'operaciones', 3, 11),
(gen_random_uuid(), '24f62bb3-1c3c-4567-8976-a0505fa4ced8', NULL, 'Business continuity plan', 'Plan de contingencia', 'operaciones', 3, 12);

-- ============================================
-- MANU (analiticas) - 12 tareas
-- ============================================
INSERT INTO tasks (id, user_id, leader_id, title, description, area, phase, order_index) VALUES
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', '915657d7-a65e-498d-97cf-993220a0cc59', 'North Star Metric', 'Definir métrica principal del negocio', 'analiticas', 3, 1),
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', 'Social media ROI', 'Calcular retorno de inversión', 'analiticas', 3, 2),
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', '936b22a4-98f3-4504-9f61-954d59183287', 'Content analytics', 'Métricas de performance', 'analiticas', 3, 3),
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'ea1bc697-8936-4aa5-977d-cef3093d921a', 'Innovation metrics', 'Medir impacto de proyectos', 'analiticas', 3, 4),
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'f971aede-c68c-4f51-9045-86e751711697', 'Sales forecasting', 'Predicción de ventas con ML', 'analiticas', 3, 5),
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'Lead quality score', 'Modelo predictivo de conversión', 'analiticas', 3, 6),
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'Operational efficiency', 'KPIs de productividad', 'analiticas', 3, 7),
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', 'Audit reporting', 'Dashboards de compliance', 'analiticas', 3, 8),
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', NULL, 'Data governance', 'Políticas de uso de datos', 'analiticas', 3, 9),
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', NULL, 'Experimentation platform', 'Infraestructura de A/B tests', 'analiticas', 3, 10),
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', NULL, 'BI self-service', 'Democratizar acceso a datos', 'analiticas', 3, 11),
(gen_random_uuid(), '9d00b78e-ab95-4abe-a974-af29b1d3e86d', NULL, 'Predictive churn model', 'Detectar clientes en riesgo', 'analiticas', 3, 12);

-- ============================================
-- CASTI (cumplimiento) - 12 tareas
-- ============================================
INSERT INTO tasks (id, user_id, leader_id, title, description, area, phase, order_index) VALUES
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', '915657d7-a65e-498d-97cf-993220a0cc59', 'Corporate governance', 'Estructura de gobierno', 'cumplimiento', 3, 1),
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d', 'Social media policies', 'Manual de uso de redes', 'cumplimiento', 3, 2),
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', '936b22a4-98f3-4504-9f61-954d59183287', 'Content compliance', 'Verificar cumplimiento en publicaciones', 'cumplimiento', 3, 3),
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', 'ea1bc697-8936-4aa5-977d-cef3093d921a', 'IP protection', 'Proteger propiedad intelectual', 'cumplimiento', 3, 4),
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', 'f971aede-c68c-4f51-9045-86e751711697', 'Sales compliance', 'Normativas para equipo comercial', 'cumplimiento', 3, 5),
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', '4a3418ab-ae98-4c79-9ca9-e61bd17a092d', 'Marketing compliance', 'GDPR y CAN-SPAM', 'cumplimiento', 3, 6),
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', '24f62bb3-1c3c-4567-8976-a0505fa4ced8', 'Operational compliance', 'Auditoría de procesos', 'cumplimiento', 3, 7),
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', '9d00b78e-ab95-4abe-a974-af29b1d3e86d', 'Data protection', 'Seguridad de información', 'cumplimiento', 3, 8),
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', NULL, 'Code of ethics', 'Código de conducta empresarial', 'cumplimiento', 3, 9),
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', NULL, 'Whistleblower policy', 'Canal de denuncias', 'cumplimiento', 3, 10),
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', NULL, 'ESG reporting', 'Reportes de sostenibilidad', 'cumplimiento', 3, 11),
(gen_random_uuid(), 'cc4d5090-2e50-407f-8f5b-eae910c00f1d', NULL, 'Regulatory monitoring', 'Seguimiento de cambios normativos', 'cumplimiento', 3, 12);
