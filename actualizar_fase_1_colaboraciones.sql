-- ============================================
-- ACTUALIZACIÓN FASE 1: AGREGAR COLABORACIONES
-- Sistema equitativo: TODOS colaboran con TODOS
-- 108 tareas: 72 con líder (67%) + 36 individuales (33%)
-- ============================================

-- UUIDs de usuarios
-- zarko: 915657d7-a65e-498d-97cf-993220a0cc59
-- angel: e0d86f6b-cb40-4161-bb54-1b0de68a6c2d
-- carla: 936b22a4-98f3-4504-9f61-954d59183287
-- miguel: 24f62bb3-1c3c-4567-8976-a0505fa4ced8
-- fer: 4a3418ab-ae98-4c79-9ca9-e61bd17a092d
-- fernando: f971aede-c68c-4f51-9045-86e751711697
-- manu: 9d00b78e-ab95-4abe-a974-af29b1d3e86d
-- casti: cc4d5090-2e50-407f-8f5b-eae910c00f1d
-- diego: ea1bc697-8936-4aa5-977d-cef3093d921a

-- ============================================
-- ZARKO (direccion) - 8 con líder, 4 individuales
-- ============================================
UPDATE tasks SET leader_id = 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d' 
WHERE user_id = '915657d7-a65e-498d-97cf-993220a0cc59' AND phase = 1 AND order_index = 1;

UPDATE tasks SET leader_id = '936b22a4-98f3-4504-9f61-954d59183287' 
WHERE user_id = '915657d7-a65e-498d-97cf-993220a0cc59' AND phase = 1 AND order_index = 2;

UPDATE tasks SET leader_id = 'ea1bc697-8936-4aa5-977d-cef3093d921a' 
WHERE user_id = '915657d7-a65e-498d-97cf-993220a0cc59' AND phase = 1 AND order_index = 3;

UPDATE tasks SET leader_id = 'f971aede-c68c-4f51-9045-86e751711697' 
WHERE user_id = '915657d7-a65e-498d-97cf-993220a0cc59' AND phase = 1 AND order_index = 4;

UPDATE tasks SET leader_id = '4a3418ab-ae98-4c79-9ca9-e61bd17a092d' 
WHERE user_id = '915657d7-a65e-498d-97cf-993220a0cc59' AND phase = 1 AND order_index = 5;

UPDATE tasks SET leader_id = '24f62bb3-1c3c-4567-8976-a0505fa4ced8' 
WHERE user_id = '915657d7-a65e-498d-97cf-993220a0cc59' AND phase = 1 AND order_index = 6;

UPDATE tasks SET leader_id = '9d00b78e-ab95-4abe-a974-af29b1d3e86d' 
WHERE user_id = '915657d7-a65e-498d-97cf-993220a0cc59' AND phase = 1 AND order_index = 7;

UPDATE tasks SET leader_id = 'cc4d5090-2e50-407f-8f5b-eae910c00f1d' 
WHERE user_id = '915657d7-a65e-498d-97cf-993220a0cc59' AND phase = 1 AND order_index = 8;

-- Tareas 9-12 de Zarko son INDIVIDUALES (leader_id = NULL ya está correcto)

-- ============================================
-- ÁNGEL (redes) - 8 con líder, 4 individuales
-- ============================================
UPDATE tasks SET leader_id = '915657d7-a65e-498d-97cf-993220a0cc59' 
WHERE user_id = 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d' AND phase = 1 AND order_index = 1;

UPDATE tasks SET leader_id = '936b22a4-98f3-4504-9f61-954d59183287' 
WHERE user_id = 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d' AND phase = 1 AND order_index = 2;

UPDATE tasks SET leader_id = 'ea1bc697-8936-4aa5-977d-cef3093d921a' 
WHERE user_id = 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d' AND phase = 1 AND order_index = 3;

UPDATE tasks SET leader_id = 'f971aede-c68c-4f51-9045-86e751711697' 
WHERE user_id = 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d' AND phase = 1 AND order_index = 4;

UPDATE tasks SET leader_id = '4a3418ab-ae98-4c79-9ca9-e61bd17a092d' 
WHERE user_id = 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d' AND phase = 1 AND order_index = 5;

UPDATE tasks SET leader_id = '24f62bb3-1c3c-4567-8976-a0505fa4ced8' 
WHERE user_id = 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d' AND phase = 1 AND order_index = 6;

UPDATE tasks SET leader_id = '9d00b78e-ab95-4abe-a974-af29b1d3e86d' 
WHERE user_id = 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d' AND phase = 1 AND order_index = 7;

UPDATE tasks SET leader_id = 'cc4d5090-2e50-407f-8f5b-eae910c00f1d' 
WHERE user_id = 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d' AND phase = 1 AND order_index = 8;

-- ============================================
-- CARLA (redes) - 8 con líder, 4 individuales
-- ============================================
UPDATE tasks SET leader_id = '915657d7-a65e-498d-97cf-993220a0cc59' 
WHERE user_id = '936b22a4-98f3-4504-9f61-954d59183287' AND phase = 1 AND order_index = 1;

UPDATE tasks SET leader_id = 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d' 
WHERE user_id = '936b22a4-98f3-4504-9f61-954d59183287' AND phase = 1 AND order_index = 2;

UPDATE tasks SET leader_id = 'ea1bc697-8936-4aa5-977d-cef3093d921a' 
WHERE user_id = '936b22a4-98f3-4504-9f61-954d59183287' AND phase = 1 AND order_index = 3;

UPDATE tasks SET leader_id = 'f971aede-c68c-4f51-9045-86e751711697' 
WHERE user_id = '936b22a4-98f3-4504-9f61-954d59183287' AND phase = 1 AND order_index = 4;

UPDATE tasks SET leader_id = '4a3418ab-ae98-4c79-9ca9-e61bd17a092d' 
WHERE user_id = '936b22a4-98f3-4504-9f61-954d59183287' AND phase = 1 AND order_index = 5;

UPDATE tasks SET leader_id = '24f62bb3-1c3c-4567-8976-a0505fa4ced8' 
WHERE user_id = '936b22a4-98f3-4504-9f61-954d59183287' AND phase = 1 AND order_index = 6;

UPDATE tasks SET leader_id = '9d00b78e-ab95-4abe-a974-af29b1d3e86d' 
WHERE user_id = '936b22a4-98f3-4504-9f61-954d59183287' AND phase = 1 AND order_index = 7;

UPDATE tasks SET leader_id = 'cc4d5090-2e50-407f-8f5b-eae910c00f1d' 
WHERE user_id = '936b22a4-98f3-4504-9f61-954d59183287' AND phase = 1 AND order_index = 8;

-- ============================================
-- DIEGO (innovacion) - 8 con líder, 4 individuales
-- ============================================
UPDATE tasks SET leader_id = '915657d7-a65e-498d-97cf-993220a0cc59' 
WHERE user_id = 'ea1bc697-8936-4aa5-977d-cef3093d921a' AND phase = 1 AND order_index = 1;

UPDATE tasks SET leader_id = 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d' 
WHERE user_id = 'ea1bc697-8936-4aa5-977d-cef3093d921a' AND phase = 1 AND order_index = 2;

UPDATE tasks SET leader_id = '936b22a4-98f3-4504-9f61-954d59183287' 
WHERE user_id = 'ea1bc697-8936-4aa5-977d-cef3093d921a' AND phase = 1 AND order_index = 3;

UPDATE tasks SET leader_id = 'f971aede-c68c-4f51-9045-86e751711697' 
WHERE user_id = 'ea1bc697-8936-4aa5-977d-cef3093d921a' AND phase = 1 AND order_index = 4;

UPDATE tasks SET leader_id = '4a3418ab-ae98-4c79-9ca9-e61bd17a092d' 
WHERE user_id = 'ea1bc697-8936-4aa5-977d-cef3093d921a' AND phase = 1 AND order_index = 5;

UPDATE tasks SET leader_id = '24f62bb3-1c3c-4567-8976-a0505fa4ced8' 
WHERE user_id = 'ea1bc697-8936-4aa5-977d-cef3093d921a' AND phase = 1 AND order_index = 6;

UPDATE tasks SET leader_id = '9d00b78e-ab95-4abe-a974-af29b1d3e86d' 
WHERE user_id = 'ea1bc697-8936-4aa5-977d-cef3093d921a' AND phase = 1 AND order_index = 7;

UPDATE tasks SET leader_id = 'cc4d5090-2e50-407f-8f5b-eae910c00f1d' 
WHERE user_id = 'ea1bc697-8936-4aa5-977d-cef3093d921a' AND phase = 1 AND order_index = 8;

-- ============================================
-- FERNANDO (ventas) - 8 con líder, 4 individuales
-- ============================================
UPDATE tasks SET leader_id = '915657d7-a65e-498d-97cf-993220a0cc59' 
WHERE user_id = 'f971aede-c68c-4f51-9045-86e751711697' AND phase = 1 AND order_index = 1;

UPDATE tasks SET leader_id = 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d' 
WHERE user_id = 'f971aede-c68c-4f51-9045-86e751711697' AND phase = 1 AND order_index = 2;

UPDATE tasks SET leader_id = '936b22a4-98f3-4504-9f61-954d59183287' 
WHERE user_id = 'f971aede-c68c-4f51-9045-86e751711697' AND phase = 1 AND order_index = 3;

UPDATE tasks SET leader_id = 'ea1bc697-8936-4aa5-977d-cef3093d921a' 
WHERE user_id = 'f971aede-c68c-4f51-9045-86e751711697' AND phase = 1 AND order_index = 4;

UPDATE tasks SET leader_id = '4a3418ab-ae98-4c79-9ca9-e61bd17a092d' 
WHERE user_id = 'f971aede-c68c-4f51-9045-86e751711697' AND phase = 1 AND order_index = 5;

UPDATE tasks SET leader_id = '24f62bb3-1c3c-4567-8976-a0505fa4ced8' 
WHERE user_id = 'f971aede-c68c-4f51-9045-86e751711697' AND phase = 1 AND order_index = 6;

UPDATE tasks SET leader_id = '9d00b78e-ab95-4abe-a974-af29b1d3e86d' 
WHERE user_id = 'f971aede-c68c-4f51-9045-86e751711697' AND phase = 1 AND order_index = 7;

UPDATE tasks SET leader_id = 'cc4d5090-2e50-407f-8f5b-eae910c00f1d' 
WHERE user_id = 'f971aede-c68c-4f51-9045-86e751711697' AND phase = 1 AND order_index = 8;

-- ============================================
-- FER (leads) - 8 con líder, 4 individuales
-- ============================================
UPDATE tasks SET leader_id = '915657d7-a65e-498d-97cf-993220a0cc59' 
WHERE user_id = '4a3418ab-ae98-4c79-9ca9-e61bd17a092d' AND phase = 1 AND order_index = 1;

UPDATE tasks SET leader_id = 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d' 
WHERE user_id = '4a3418ab-ae98-4c79-9ca9-e61bd17a092d' AND phase = 1 AND order_index = 2;

UPDATE tasks SET leader_id = '936b22a4-98f3-4504-9f61-954d59183287' 
WHERE user_id = '4a3418ab-ae98-4c79-9ca9-e61bd17a092d' AND phase = 1 AND order_index = 3;

UPDATE tasks SET leader_id = 'ea1bc697-8936-4aa5-977d-cef3093d921a' 
WHERE user_id = '4a3418ab-ae98-4c79-9ca9-e61bd17a092d' AND phase = 1 AND order_index = 4;

UPDATE tasks SET leader_id = 'f971aede-c68c-4f51-9045-86e751711697' 
WHERE user_id = '4a3418ab-ae98-4c79-9ca9-e61bd17a092d' AND phase = 1 AND order_index = 5;

UPDATE tasks SET leader_id = '24f62bb3-1c3c-4567-8976-a0505fa4ced8' 
WHERE user_id = '4a3418ab-ae98-4c79-9ca9-e61bd17a092d' AND phase = 1 AND order_index = 6;

UPDATE tasks SET leader_id = '9d00b78e-ab95-4abe-a974-af29b1d3e86d' 
WHERE user_id = '4a3418ab-ae98-4c79-9ca9-e61bd17a092d' AND phase = 1 AND order_index = 7;

UPDATE tasks SET leader_id = 'cc4d5090-2e50-407f-8f5b-eae910c00f1d' 
WHERE user_id = '4a3418ab-ae98-4c79-9ca9-e61bd17a092d' AND phase = 1 AND order_index = 8;

-- ============================================
-- MIGUEL (operaciones) - 8 con líder, 4 individuales
-- ============================================
UPDATE tasks SET leader_id = '915657d7-a65e-498d-97cf-993220a0cc59' 
WHERE user_id = '24f62bb3-1c3c-4567-8976-a0505fa4ced8' AND phase = 1 AND order_index = 1;

UPDATE tasks SET leader_id = 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d' 
WHERE user_id = '24f62bb3-1c3c-4567-8976-a0505fa4ced8' AND phase = 1 AND order_index = 2;

UPDATE tasks SET leader_id = '936b22a4-98f3-4504-9f61-954d59183287' 
WHERE user_id = '24f62bb3-1c3c-4567-8976-a0505fa4ced8' AND phase = 1 AND order_index = 3;

UPDATE tasks SET leader_id = 'ea1bc697-8936-4aa5-977d-cef3093d921a' 
WHERE user_id = '24f62bb3-1c3c-4567-8976-a0505fa4ced8' AND phase = 1 AND order_index = 4;

UPDATE tasks SET leader_id = 'f971aede-c68c-4f51-9045-86e751711697' 
WHERE user_id = '24f62bb3-1c3c-4567-8976-a0505fa4ced8' AND phase = 1 AND order_index = 5;

UPDATE tasks SET leader_id = '4a3418ab-ae98-4c79-9ca9-e61bd17a092d' 
WHERE user_id = '24f62bb3-1c3c-4567-8976-a0505fa4ced8' AND phase = 1 AND order_index = 6;

UPDATE tasks SET leader_id = '9d00b78e-ab95-4abe-a974-af29b1d3e86d' 
WHERE user_id = '24f62bb3-1c3c-4567-8976-a0505fa4ced8' AND phase = 1 AND order_index = 7;

UPDATE tasks SET leader_id = 'cc4d5090-2e50-407f-8f5b-eae910c00f1d' 
WHERE user_id = '24f62bb3-1c3c-4567-8976-a0505fa4ced8' AND phase = 1 AND order_index = 8;

-- ============================================
-- MANU (analiticas) - 8 con líder, 4 individuales
-- ============================================
UPDATE tasks SET leader_id = '915657d7-a65e-498d-97cf-993220a0cc59' 
WHERE user_id = '9d00b78e-ab95-4abe-a974-af29b1d3e86d' AND phase = 1 AND order_index = 1;

UPDATE tasks SET leader_id = 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d' 
WHERE user_id = '9d00b78e-ab95-4abe-a974-af29b1d3e86d' AND phase = 1 AND order_index = 2;

UPDATE tasks SET leader_id = '936b22a4-98f3-4504-9f61-954d59183287' 
WHERE user_id = '9d00b78e-ab95-4abe-a974-af29b1d3e86d' AND phase = 1 AND order_index = 3;

UPDATE tasks SET leader_id = 'ea1bc697-8936-4aa5-977d-cef3093d921a' 
WHERE user_id = '9d00b78e-ab95-4abe-a974-af29b1d3e86d' AND phase = 1 AND order_index = 4;

UPDATE tasks SET leader_id = 'f971aede-c68c-4f51-9045-86e751711697' 
WHERE user_id = '9d00b78e-ab95-4abe-a974-af29b1d3e86d' AND phase = 1 AND order_index = 5;

UPDATE tasks SET leader_id = '4a3418ab-ae98-4c79-9ca9-e61bd17a092d' 
WHERE user_id = '9d00b78e-ab95-4abe-a974-af29b1d3e86d' AND phase = 1 AND order_index = 6;

UPDATE tasks SET leader_id = '24f62bb3-1c3c-4567-8976-a0505fa4ced8' 
WHERE user_id = '9d00b78e-ab95-4abe-a974-af29b1d3e86d' AND phase = 1 AND order_index = 7;

UPDATE tasks SET leader_id = 'cc4d5090-2e50-407f-8f5b-eae910c00f1d' 
WHERE user_id = '9d00b78e-ab95-4abe-a974-af29b1d3e86d' AND phase = 1 AND order_index = 8;

-- ============================================
-- CASTI (cumplimiento) - 8 con líder, 4 individuales
-- ============================================
UPDATE tasks SET leader_id = '915657d7-a65e-498d-97cf-993220a0cc59' 
WHERE user_id = 'cc4d5090-2e50-407f-8f5b-eae910c00f1d' AND phase = 1 AND order_index = 1;

UPDATE tasks SET leader_id = 'e0d86f6b-cb40-4161-bb54-1b0de68a6c2d' 
WHERE user_id = 'cc4d5090-2e50-407f-8f5b-eae910c00f1d' AND phase = 1 AND order_index = 2;

UPDATE tasks SET leader_id = '936b22a4-98f3-4504-9f61-954d59183287' 
WHERE user_id = 'cc4d5090-2e50-407f-8f5b-eae910c00f1d' AND phase = 1 AND order_index = 3;

UPDATE tasks SET leader_id = 'ea1bc697-8936-4aa5-977d-cef3093d921a' 
WHERE user_id = 'cc4d5090-2e50-407f-8f5b-eae910c00f1d' AND phase = 1 AND order_index = 4;

UPDATE tasks SET leader_id = 'f971aede-c68c-4f51-9045-86e751711697' 
WHERE user_id = 'cc4d5090-2e50-407f-8f5b-eae910c00f1d' AND phase = 1 AND order_index = 5;

UPDATE tasks SET leader_id = '4a3418ab-ae98-4c79-9ca9-e61bd17a092d' 
WHERE user_id = 'cc4d5090-2e50-407f-8f5b-eae910c00f1d' AND phase = 1 AND order_index = 6;

UPDATE tasks SET leader_id = '24f62bb3-1c3c-4567-8976-a0505fa4ced8' 
WHERE user_id = 'cc4d5090-2e50-407f-8f5b-eae910c00f1d' AND phase = 1 AND order_index = 7;

UPDATE tasks SET leader_id = '9d00b78e-ab95-4abe-a974-af29b1d3e86d' 
WHERE user_id = 'cc4d5090-2e50-407f-8f5b-eae910c00f1d' AND phase = 1 AND order_index = 8;

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================
-- Esta query debe mostrar 12 tareas por usuario (8 con líder, 4 individuales):
-- SELECT 
--   u.username,
--   COUNT(DISTINCT t.id) as total_tareas,
--   COUNT(DISTINCT t.id) FILTER (WHERE t.leader_id IS NULL) as individuales,
--   COUNT(DISTINCT t.id) FILTER (WHERE t.leader_id IS NOT NULL) as con_lider,
--   COUNT(DISTINCT t2.id) as soy_lider_de
-- FROM users u
-- LEFT JOIN tasks t ON t.user_id = u.id AND t.phase = 1
-- LEFT JOIN tasks t2 ON t2.leader_id = u.id AND t2.phase = 1
-- GROUP BY u.username
-- ORDER BY u.username;
