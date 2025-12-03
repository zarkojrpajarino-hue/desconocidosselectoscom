/**
 * TIPOS COMPLETOS PARA STARTUP ONBOARDING
 */

// ============================================
// PASO 1: VISIÓN
// ============================================
export interface StartupStep1Data {
  businessName: string;
  tagline: string;
  problemStatement: string;
  solutionDescription: string;
  uniqueValueProposition: string;
  whyNow: string;
  inspiration: string;
}

// ============================================
// PASO 2: MERCADO
// ============================================
export interface Competitor {
  name: string;
  strengths: string;
  weaknesses: string;
}

export interface StartupStep2Data {
  idealCustomerProfile: string;
  customerPainPoints: string[];
  marketSize: {
    TAM: string;
    SAM: string;
    SOM: string;
  };
  competitors: Competitor[];
  competitiveAdvantage: string;
  distributionChannels: string[];
}

// ============================================
// PASO 3: MODELO DE NEGOCIO
// ============================================
export type MonetizationStrategy = 
  | 'subscription' 
  | 'one-time' 
  | 'freemium' 
  | 'marketplace' 
  | 'advertising' 
  | 'other';

export interface CostStructureItem {
  category: string;
  estimatedMonthlyCost: number;
}

export interface StartupStep3Data {
  monetizationStrategy: MonetizationStrategy;
  pricingHypothesis: {
    lowestTier: number;
    middleTier: number;
    highestTier: number;
    currency: string;
  };
  revenueStreams: string[];
  costStructure: CostStructureItem[];
  unitEconomics: {
    estimatedCAC: number;
    estimatedLTV: number;
    targetLTVCACRatio: number;
  };
}

// ============================================
// PASO 4: PRODUCTO/MVP
// ============================================
export type FeaturePriority = 'must-have' | 'nice-to-have';
export type FeatureComplexity = 'low' | 'medium' | 'high';

export interface CoreFeature {
  feature: string;
  priority: FeaturePriority;
  complexity: FeatureComplexity;
}

export interface StartupStep4Data {
  mvpDescription: string;
  coreFeatures: CoreFeature[];
  developmentTimeline: number;
  technologyStack: string[];
  technicalChallenges: string;
}

// ============================================
// PASO 5: GO-TO-MARKET
// ============================================
export type LaunchStrategy = 'stealth' | 'beta' | 'public' | 'gradual';
export type ChannelPriority = 'high' | 'medium' | 'low';

export interface AcquisitionChannel {
  channel: string;
  priority: ChannelPriority;
  estimatedCost: number;
}

export interface StartupStep5Data {
  launchStrategy: LaunchStrategy;
  first100CustomersStrategy: string;
  initialMarketingBudget: number;
  acquisitionChannels: AcquisitionChannel[];
  contentStrategy: string;
  partnershipsStrategy: string;
}

// ============================================
// PASO 6: RECURSOS Y EQUIPO
// ============================================
export type FounderCommitment = 'full-time' | 'part-time';
export type FundingStrategy = 
  | 'bootstrapped' 
  | 'friends-family' 
  | 'angel' 
  | 'vc' 
  | 'crowdfunding';

export interface Founder {
  name: string;
  role: string;
  expertise: string;
  commitment: FounderCommitment;
}

export interface StartupStep6Data {
  founders: Founder[];
  missingSkills: string[];
  currentCapital: number;
  capitalNeeded: number;
  fundingStrategy: FundingStrategy;
  runwayGoal: number;
}

// ============================================
// PASO 7: VALIDACIÓN
// ============================================
export interface CriticalHypothesis {
  hypothesis: string;
  validationMethod: string;
  successCriteria: string;
}

export interface StartupStep7Data {
  criticalHypotheses: CriticalHypothesis[];
  prelaunchMetrics: string[];
  postlaunchKPIs: string[];
  pivotCriteria: string;
  successDefinition: string;
}

// ============================================
// PASO 8: TIMELINE
// ============================================
export interface Milestone {
  milestone: string;
  deadline: string;
  successMetric: string;
}

export interface StartupStep8Data {
  milestones: Milestone[];
  threeMonthGoal: string;
  sixMonthGoal: string;
  twelveMonthGoal: string;
  exitStrategy: string;
}

// ============================================
// TIPO COMPLETO (TODOS LOS PASOS)
// ============================================
export interface StartupOnboardingData 
  extends StartupStep1Data,
          StartupStep2Data,
          StartupStep3Data,
          StartupStep4Data,
          StartupStep5Data,
          StartupStep6Data,
          StartupStep7Data,
          StartupStep8Data {
  id?: string;
  organizationId?: string;
  status?: 'draft' | 'completed' | 'archived';
  currentStep?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// PROPS PARA CADA PASO
// ============================================
export interface StepProps<T> {
  data: T;
  updateData: (partialData: Partial<T>) => void;
}

export type Step1Props = StepProps<StartupStep1Data>;
export type Step2Props = StepProps<StartupStep2Data>;
export type Step3Props = StepProps<StartupStep3Data>;
export type Step4Props = StepProps<StartupStep4Data>;
export type Step5Props = StepProps<StartupStep5Data>;
export type Step6Props = StepProps<StartupStep6Data>;
export type Step7Props = StepProps<StartupStep7Data>;
export type Step8Props = StepProps<StartupStep8Data>;

// ============================================
// VALORES INICIALES
// ============================================
export const INITIAL_STARTUP_DATA: StartupOnboardingData = {
  // Paso 1
  businessName: '',
  tagline: '',
  problemStatement: '',
  solutionDescription: '',
  uniqueValueProposition: '',
  whyNow: '',
  inspiration: '',
  
  // Paso 2
  idealCustomerProfile: '',
  customerPainPoints: [],
  marketSize: { TAM: '', SAM: '', SOM: '' },
  competitors: [],
  competitiveAdvantage: '',
  distributionChannels: [],
  
  // Paso 3
  monetizationStrategy: 'subscription',
  pricingHypothesis: {
    lowestTier: 0,
    middleTier: 0,
    highestTier: 0,
    currency: 'EUR'
  },
  revenueStreams: [],
  costStructure: [],
  unitEconomics: {
    estimatedCAC: 0,
    estimatedLTV: 0,
    targetLTVCACRatio: 3
  },
  
  // Paso 4
  mvpDescription: '',
  coreFeatures: [],
  developmentTimeline: 0,
  technologyStack: [],
  technicalChallenges: '',
  
  // Paso 5
  launchStrategy: 'beta',
  first100CustomersStrategy: '',
  initialMarketingBudget: 0,
  acquisitionChannels: [],
  contentStrategy: '',
  partnershipsStrategy: '',
  
  // Paso 6
  founders: [],
  missingSkills: [],
  currentCapital: 0,
  capitalNeeded: 0,
  fundingStrategy: 'bootstrapped',
  runwayGoal: 12,
  
  // Paso 7
  criticalHypotheses: [],
  prelaunchMetrics: [],
  postlaunchKPIs: [],
  pivotCriteria: '',
  successDefinition: '',
  
  // Paso 8
  milestones: [],
  threeMonthGoal: '',
  sixMonthGoal: '',
  twelveMonthGoal: '',
  exitStrategy: '',
  
  status: 'draft',
  currentStep: 1,
};
