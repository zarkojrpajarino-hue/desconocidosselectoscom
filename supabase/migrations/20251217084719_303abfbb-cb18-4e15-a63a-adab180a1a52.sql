-- Drop existing check constraint and add new one with task_resources type
ALTER TABLE public.ai_task_resources 
DROP CONSTRAINT IF EXISTS ai_task_resources_resource_type_check;

ALTER TABLE public.ai_task_resources 
ADD CONSTRAINT ai_task_resources_resource_type_check 
CHECK (resource_type IN ('video_scripts', 'influencer_list', 'ad_campaign', 'social_posts', 'design_brief', 'outreach_templates', 'email_sequences', 'task_resources'));