// Types para AI Task Resources

export type AIResourceType = 
  | 'video_scripts'
  | 'influencer_list'
  | 'ad_campaign'
  | 'social_posts'
  | 'design_brief'
  | 'outreach_templates'
  | 'email_sequences'
  | 'task_resources'; // Generic resources based on task content

export interface VideoScript {
  title: string;
  duration_seconds: number;
  platform: string;
  hook: string;
  body: string;
  cta: string;
  key_messages: string[];
  visual_suggestions: string[];
  music_style: string;
  hashtags: string[];
  caption: string;
}

export interface SocialPost {
  platform: string;
  post_type: string;
  caption: string;
  hashtags: string[];
  content_pillar: string;
  best_time_to_post: string;
  visual_description: string;
}

export interface Influencer {
  username: string;
  platform: string;
  profile_url: string;
  followers: number;
  engagement_rate: number;
  category: string;
  audience_demographics: {
    age_range: string;
    gender_split: string;
    top_countries: string[];
  };
  estimated_cost_per_post: {
    min: number;
    max: number;
    currency: string;
  };
  why_recommended: string;
  outreach_message_template: string;
}

export interface AdCampaignPlan {
  recommended_platforms: Array<{
    platform: string;
    why: string;
    budget_allocation_percentage: number;
  }>;
  total_budget_recommended: {
    min: number;
    max: number;
    currency: string;
  };
  targeting: {
    demographics: string;
    interests: string[];
    behaviors: string[];
    locations: string[];
  };
  ad_creatives: Array<{
    format: string;
    headline: string;
    description: string;
    cta: string;
  }>;
  kpis_to_track: string[];
  expected_results: string;
}

export interface DesignBrief {
  project_name: string;
  deliverables: string[];
  brand_guidelines: {
    primary_colors: string[];
    secondary_colors: string[];
    fonts: string[];
    tone: string;
  };
  dimensions_by_platform: Array<{
    platform: string;
    width: number;
    height: number;
  }>;
  inspiration_references: string[];
  key_message: string;
  dos_and_donts: {
    dos: string[];
    donts: string[];
  };
}

export interface OutreachTemplate {
  channel: string;
  scenario: string;
  subject_line?: string;
  message_body: string;
  personalization_fields: string[];
  best_practices: string[];
}

export interface EmailSequence {
  sequence_name: string;
  goal: string;
  emails: Array<{
    day: number;
    subject: string;
    body: string;
    cta: string;
  }>;
  expected_open_rate: string;
  expected_click_rate: string;
}

export interface AITaskResource {
  id: string;
  task_id: string;
  organization_id: string;
  resource_type: AIResourceType;
  resources: Record<string, unknown>;
  generated_at: string;
  created_at: string;
  updated_at: string;
}
