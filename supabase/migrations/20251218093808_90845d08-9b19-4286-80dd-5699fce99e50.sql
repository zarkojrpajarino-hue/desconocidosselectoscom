-- Fix security definer view issue by using security invoker
DROP VIEW IF EXISTS user_lead_stats;

CREATE VIEW user_lead_stats WITH (security_invoker = on) AS
SELECT 
    u.id AS user_id,
    u.full_name,
    u.role,
    l.organization_id,
    COUNT(l.id) AS total_leads,
    COUNT(CASE WHEN l.stage = 'won' THEN 1 END) AS won_leads,
    COUNT(CASE WHEN l.lead_type = 'hot' THEN 1 END) AS hot_leads,
    COALESCE(SUM(CASE WHEN l.stage = 'won' THEN l.estimated_value END), 0) AS total_won_value,
    COALESCE(SUM(l.estimated_value), 0) AS total_pipeline_value
FROM users u
LEFT JOIN leads l ON l.created_by = u.id
WHERE l.organization_id IS NOT NULL
GROUP BY u.id, u.full_name, u.role, l.organization_id
ORDER BY COUNT(l.id) DESC;