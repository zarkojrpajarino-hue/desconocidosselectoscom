// Discovery Onboarding Types

export interface DiscoveryFormData {
  // Step 0: Account
  contactName: string;
  accountEmail: string;
  accountPassword: string;
  
  // Step 1: Current Situation
  currentSituation: 'employed' | 'student' | 'unemployed' | 'entrepreneur' | '';
  
  // Step 2: Time Availability
  hoursWeekly: number;
  
  // Step 3: Risk Tolerance
  riskTolerance: number; // 1-5
  
  // Step 4: Motivations (Top 3)
  motivations: string[];
  
  // Step 5: Skills (Top 3)
  skills: string[];
  
  // Step 6: Industry Experience
  industries: string[];
  
  // Step 7: Target Audience
  targetAudiencePreference: 'b2b' | 'b2c' | 'both' | '';
  
  // Step 8: Initial Capital
  initialCapital: 'less_1k' | '1k_5k' | '5k_20k' | 'more_20k' | '';
  
  // Step 9: Existing Idea (Optional)
  existingIdea: string;
  
  // Step 10: Business Type Preference
  businessTypePreference: 'physical_product' | 'digital_saas' | 'services' | 'marketplace' | '';
  
  // Step 11: Revenue Urgency
  revenueUrgency: '1_3_months' | '3_6_months' | '6_12_months' | '';
}

export interface CuratedIdea {
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

export interface ScoredIdea extends CuratedIdea {
  score: number;
  matchBreakdown: {
    skillMatch: number;
    industryMatch: number;
    timeMatch: number;
    capitalMatch: number;
    motivationMatch: number;
  };
}

export interface DiscoveryProfile {
  id: string;
  user_id: string;
  organization_id?: string;
  contact_name?: string;
  contact_email?: string;
  current_situation?: string;
  hours_weekly?: number;
  risk_tolerance?: number;
  motivations?: string[];
  skills?: string[];
  industries?: string[];
  target_audience_preference?: string;
  initial_capital?: string;
  existing_idea?: string;
  business_type_preference?: string;
  revenue_urgency?: string;
  generated_ideas?: ScoredIdea[];
  selected_idea_id?: string;
  status: 'in_progress' | 'ideas_generated' | 'idea_selected' | 'completed';
  current_step: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// Option types for selects
export const SITUATION_OPTIONS = [
  { value: 'employed', label: 'Empleado/a', icon: '💼' },
  { value: 'student', label: 'Estudiante', icon: '🎓' },
  { value: 'unemployed', label: 'Buscando empleo', icon: '🔍' },
  { value: 'entrepreneur', label: 'Ya emprendedor/a', icon: '🚀' }
];

export const MOTIVATION_OPTIONS = [
  { value: 'financial_freedom', label: 'Libertad financiera', icon: '💰' },
  { value: 'passion', label: 'Seguir mi pasión', icon: '❤️' },
  { value: 'impact', label: 'Impacto social', icon: '🌍' },
  { value: 'flexibility', label: 'Flexibilidad horaria', icon: '⏰' },
  { value: 'independence', label: 'Ser mi propio jefe', icon: '👑' },
  { value: 'legacy', label: 'Dejar un legado', icon: '🏆' },
  { value: 'creative_expression', label: 'Expresión creativa', icon: '🎨' },
  { value: 'challenge', label: 'Reto personal', icon: '💪' }
];

export const SKILL_OPTIONS = [
  { value: 'sales', label: 'Ventas/Comercial', icon: '🎯' },
  { value: 'technical', label: 'Técnicas/Programación', icon: '💻' },
  { value: 'creative', label: 'Creatividad/Diseño', icon: '🎨' },
  { value: 'management', label: 'Gestión/Liderazgo', icon: '👥' },
  { value: 'marketing', label: 'Marketing/Comunicación', icon: '📢' },
  { value: 'finance', label: 'Finanzas/Contabilidad', icon: '📊' },
  { value: 'operations', label: 'Operaciones/Logística', icon: '⚙️' },
  { value: 'customer_service', label: 'Atención al cliente', icon: '🤝' }
];

export const INDUSTRY_OPTIONS = [
  { value: 'tech', label: 'Tecnología', icon: '💻' },
  { value: 'health', label: 'Salud/Bienestar', icon: '🏥' },
  { value: 'retail', label: 'Retail/Comercio', icon: '🛒' },
  { value: 'services', label: 'Servicios profesionales', icon: '💼' },
  { value: 'education', label: 'Educación', icon: '📚' },
  { value: 'finance', label: 'Finanzas/Seguros', icon: '🏦' },
  { value: 'food', label: 'Alimentación/Hostelería', icon: '🍽️' },
  { value: 'real_estate', label: 'Inmobiliaria', icon: '🏠' },
  { value: 'media', label: 'Medios/Entretenimiento', icon: '🎬' },
  { value: 'manufacturing', label: 'Fabricación/Industrial', icon: '🏭' },
  { value: 'ecommerce', label: 'E-commerce', icon: '📦' },
  { value: 'consulting', label: 'Consultoría', icon: '🎓' }
];

export const CAPITAL_OPTIONS = [
  { value: 'less_1k', label: 'Menos de €1,000', icon: '💵' },
  { value: '1k_5k', label: '€1,000 - €5,000', icon: '💶' },
  { value: '5k_20k', label: '€5,000 - €20,000', icon: '💷' },
  { value: 'more_20k', label: 'Más de €20,000', icon: '💰' }
];

export const TARGET_AUDIENCE_OPTIONS = [
  { value: 'b2b', label: 'Empresas (B2B)', icon: '🏢', description: 'Vender a otras empresas' },
  { value: 'b2c', label: 'Consumidores (B2C)', icon: '👥', description: 'Vender al público general' },
  { value: 'both', label: 'Ambos', icon: '🎯', description: 'Flexible según oportunidad' }
];

export const BUSINESS_TYPE_OPTIONS = [
  { value: 'physical_product', label: 'Producto físico', icon: '📦', description: 'E-commerce, retail, fabricación' },
  { value: 'digital_saas', label: 'Digital/SaaS', icon: '💻', description: 'Software, apps, herramientas online' },
  { value: 'services', label: 'Servicios', icon: '🛠️', description: 'Consultoría, agencia, freelance' },
  { value: 'marketplace', label: 'Marketplace', icon: '🏪', description: 'Conectar oferta y demanda' }
];

export const REVENUE_URGENCY_OPTIONS = [
  { value: '1_3_months', label: '1-3 meses', icon: '⚡', description: 'Necesito ingresos rápido' },
  { value: '3_6_months', label: '3-6 meses', icon: '🎯', description: 'Tengo algo de margen' },
  { value: '6_12_months', label: '6-12 meses', icon: '🌱', description: 'Puedo construir con calma' }
];
