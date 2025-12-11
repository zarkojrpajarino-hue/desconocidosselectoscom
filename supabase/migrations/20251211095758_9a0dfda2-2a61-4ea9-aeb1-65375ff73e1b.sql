-- Fix RLS on workflow_runs and user_custom_roles
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_custom_roles ENABLE ROW LEVEL SECURITY;