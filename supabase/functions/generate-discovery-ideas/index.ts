import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiscoveryProfile {
  id: string;
  skills: string[];
  industries: string[];
  motivations: string[];
  hours_weekly: number;
  initial_capital: string;
  risk_tolerance: number;
  business_type_preference: string;
  revenue_urgency: string;
  target_audience_preference: string;
  existing_idea: string;
}

interface CuratedIdea {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  target_audience: string;
  problem_solved: string;
  revenue_model: string;
  required_skills: string[];
  min_capital: number;
  min_hours_weekly: number;
  difficulty_level: number;
  time_to_first_revenue: string;
  skill_tags: string[];
  industry_tags: string[];
  motivation_tags: string[];
  examples: string[];
  first_steps: string[];
  common_mistakes: string[];
  resources: string[];
}

interface ScoredIdea extends CuratedIdea {
  score: number;
  matchBreakdown: {
    skillMatch: number;
    industryMatch: number;
    timeMatch: number;
    capitalMatch: number;
    motivationMatch: number;
  };
}

// Calculate skill match (0-100)
function calculateSkillMatch(userSkills: string[], ideaSkills: string[]): number {
  if (!userSkills?.length || !ideaSkills?.length) return 50;
  const matches = userSkills.filter(s => ideaSkills.includes(s)).length;
  const maxPossible = Math.min(userSkills.length, ideaSkills.length);
  return Math.round((matches / maxPossible) * 100);
}

// Calculate industry match (0-100)
function calculateIndustryMatch(userIndustries: string[], ideaIndustries: string[]): number {
  if (!userIndustries?.length || !ideaIndustries?.length) return 50;
  const matches = userIndustries.filter(i => ideaIndustries.includes(i)).length;
  return matches > 0 ? Math.min(100, matches * 40 + 20) : 30;
}

// Calculate time match (0-100)
function calculateTimeMatch(userHours: number, ideaMinHours: number): number {
  if (userHours >= ideaMinHours * 1.5) return 100;
  if (userHours >= ideaMinHours) return 80;
  if (userHours >= ideaMinHours * 0.7) return 60;
  return 40;
}

// Calculate capital match (0-100)
function calculateCapitalMatch(userCapital: string, ideaMinCapital: number): number {
  const capitalRanges: Record<string, number> = {
    'less_1k': 500,
    '1k_5k': 3000,
    '5k_20k': 12500,
    'more_20k': 30000
  };
  
  const userAmount = capitalRanges[userCapital] || 1000;
  
  if (userAmount >= ideaMinCapital * 2) return 100;
  if (userAmount >= ideaMinCapital) return 85;
  if (userAmount >= ideaMinCapital * 0.5) return 60;
  return 40;
}

// Calculate motivation match (0-100)
function calculateMotivationMatch(userMotivations: string[], ideaMotivations: string[]): number {
  if (!userMotivations?.length || !ideaMotivations?.length) return 50;
  const matches = userMotivations.filter(m => ideaMotivations.includes(m)).length;
  return Math.min(100, matches * 35 + 15);
}

// Calculate overall score
function calculateIdeaScore(profile: DiscoveryProfile, idea: CuratedIdea): ScoredIdea {
  const skillMatch = calculateSkillMatch(profile.skills, idea.skill_tags);
  const industryMatch = calculateIndustryMatch(profile.industries, idea.industry_tags);
  const timeMatch = calculateTimeMatch(profile.hours_weekly, idea.min_hours_weekly);
  const capitalMatch = calculateCapitalMatch(profile.initial_capital, idea.min_capital);
  const motivationMatch = calculateMotivationMatch(profile.motivations, idea.motivation_tags);

  // Weighted average (skills most important, then capital/time, then industry/motivation)
  const score = Math.round(
    skillMatch * 0.30 +
    capitalMatch * 0.20 +
    timeMatch * 0.20 +
    industryMatch * 0.15 +
    motivationMatch * 0.15
  );

  // Apply business type preference bonus
  let businessTypeBonus = 0;
  if (profile.business_type_preference) {
    const categoryMap: Record<string, string[]> = {
      'digital_saas': ['tech_saas'],
      'services': ['services'],
      'physical_product': ['ecommerce'],
      'marketplace': ['marketplace']
    };
    if (categoryMap[profile.business_type_preference]?.includes(idea.category)) {
      businessTypeBonus = 5;
    }
  }

  // Apply urgency bonus (fast ideas get bonus for urgent users)
  let urgencyBonus = 0;
  if (profile.revenue_urgency === '1_3_months') {
    if (idea.time_to_first_revenue.includes('semana') || idea.time_to_first_revenue.includes('1-2')) {
      urgencyBonus = 5;
    }
  }

  return {
    ...idea,
    score: Math.min(99, score + businessTypeBonus + urgencyBonus),
    matchBreakdown: {
      skillMatch,
      industryMatch,
      timeMatch,
      capitalMatch,
      motivationMatch
    }
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { profileId } = await req.json();

    if (!profileId) {
      throw new Error('Profile ID is required');
    }

    // Get discovery profile
    const { data: profile, error: profileError } = await supabase
      .from('discovery_profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      throw new Error('Profile not found');
    }

    // Get all active curated ideas
    const { data: ideas, error: ideasError } = await supabase
      .from('curated_ideas')
      .select('*')
      .eq('is_active', true);

    if (ideasError || !ideas?.length) {
      throw new Error('No ideas found');
    }

    // Score all ideas
    const scoredIdeas = ideas.map(idea => calculateIdeaScore(profile as DiscoveryProfile, idea as CuratedIdea));

    // Sort by score and take top 3
    const topIdeas = scoredIdeas
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    console.log(`Generated ${topIdeas.length} ideas for profile ${profileId}`);

    return new Response(
      JSON.stringify({ ideas: topIdeas }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating discovery ideas:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
