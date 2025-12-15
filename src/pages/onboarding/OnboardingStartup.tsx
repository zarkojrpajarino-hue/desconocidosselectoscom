import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Loader2, Save, Rocket } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { 
  StartupOnboardingData, 
  INITIAL_STARTUP_DATA,
  Competitor,
  CostStructureItem,
  CoreFeature,
  AcquisitionChannel,
  Founder,
  CriticalHypothesis,
  Milestone,
  MonetizationStrategy,
  LaunchStrategy,
  FundingStrategy
} from '@/types/startup-onboarding';
import { Json } from '@/integrations/supabase/types';

import StartupStep1Vision from './startup/StartupStep1Vision';
import StartupStep2Market from './startup/StartupStep2Market';
import StartupStep3BusinessModel from './startup/StartupStep3BusinessModel';
import StartupStep4Product from './startup/StartupStep4Product';
import StartupStep5GoToMarket from './startup/StartupStep5GoToMarket';
import StartupStep6Resources from './startup/StartupStep6Resources';
import StartupStep7Validation from './startup/StartupStep7Validation';
import StartupStep8Timeline from './startup/StartupStep8Timeline';
import StartupStep0Account from '@/components/onboarding/StartupStep0Account';

const TOTAL_STEPS = 9; // Now includes step 0 (account)

const STEP_TITLES = [
  '👤 Cuenta', '🚀 Visión', '🎯 Mercado', '💼 Modelo', '📦 Producto',
  '📈 Go-to-Market', '💰 Recursos', '✅ Validación', '📅 Timeline'
];

// Helper function to safely parse JSON arrays from database
function parseJsonArray<T>(value: Json | null | undefined, defaultValue: T[]): T[] {
  if (!value) return defaultValue;
  if (Array.isArray(value)) return value as unknown as T[];
  return defaultValue;
}

const MONETIZATION_STRATEGIES: MonetizationStrategy[] = ['subscription', 'one-time', 'freemium', 'marketplace', 'advertising', 'other'];
const LAUNCH_STRATEGIES: LaunchStrategy[] = ['stealth', 'beta', 'public', 'gradual'];
const FUNDING_STRATEGIES: FundingStrategy[] = ['bootstrapped', 'friends-family', 'angel', 'vc', 'crowdfunding'];

function parseMonetizationStrategy(value: string | null | undefined): MonetizationStrategy {
  if (value && MONETIZATION_STRATEGIES.includes(value as MonetizationStrategy)) {
    return value as MonetizationStrategy;
  }
  return 'subscription';
}

function parseLaunchStrategy(value: string | null | undefined): LaunchStrategy {
  if (value && LAUNCH_STRATEGIES.includes(value as LaunchStrategy)) {
    return value as LaunchStrategy;
  }
  return 'beta';
}

function parseFundingStrategy(value: string | null | undefined): FundingStrategy {
  if (value && FUNDING_STRATEGIES.includes(value as FundingStrategy)) {
    return value as FundingStrategy;
  }
  return 'bootstrapped';
}

export default function OnboardingStartup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Start at step 0 if not logged in, otherwise step 1
  const [currentStep, setCurrentStep] = useState(user ? 1 : 0);
  const [formData, setFormData] = useState<StartupOnboardingData>(INITIAL_STARTUP_DATA);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // States for account/org created in step 0
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [createdOrganizationId, setCreatedOrganizationId] = useState<string | null>(null);
  const [accountCreated, setAccountCreated] = useState(!!user);
  const [isLoadingOrg, setIsLoadingOrg] = useState(false);

  // For existing users, find or create their organization
  useEffect(() => {
    const initializeExistingUser = async () => {
      if (!user || createdOrganizationId) return;
      
      setIsLoadingOrg(true);
      try {
        // First check if user has an existing organization
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('organization_id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (existingRole?.organization_id) {
          setCreatedOrganizationId(existingRole.organization_id);
          setCreatedUserId(user.id);
          return;
        }
        
        // If no org exists, create one for the startup
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: `Startup de ${user.email?.split('@')[0] || 'Usuario'}`,
            created_by: user.id,
            plan: 'trial',
            subscription_status: 'trial',
            industry: 'technology',
            company_size: '1-10',
            contact_name: user.email?.split('@')[0] || 'Usuario',
            contact_email: user.email || '',
            business_description: 'Por definir durante onboarding',
            target_customers: 'Por definir durante onboarding',
            sales_process: 'Por definir',
            current_problems: 'Por definir',
            main_objectives: 'Por definir',
            value_proposition: 'Por definir',
            lead_sources: [],
            kpis_to_measure: [],
            products_services: [],
            team_structure: [],
            business_type: 'startup'
          })
          .select()
          .single();
        
        if (orgError) throw orgError;
        
        // Create user_role
        await supabase.from('user_roles').insert({
          user_id: user.id,
          organization_id: orgData.id,
          role: 'admin'
        });
        
        // Register trial
        await supabase.rpc('register_trial_email', { user_email: user.email });
        
        setCreatedOrganizationId(orgData.id);
        setCreatedUserId(user.id);
      } catch (error) {
        logger.error('Error initializing existing user org:', error);
        toast.error('Error inicializando organización');
      } finally {
        setIsLoadingOrg(false);
      }
    };
    
    initializeExistingUser();
  }, [user, createdOrganizationId]);

  // Load draft only after org is set
  useEffect(() => {
    const orgId = createdOrganizationId;
    if (orgId) {
      loadDraft(orgId);
    }
  }, [createdOrganizationId]);

  const loadDraft = async (orgId: string) => {
    if (!orgId) return;
    
    const { data: draft } = await supabase
      .from('startup_onboardings')
      .select('*')
      .eq('organization_id', orgId)
      .eq('status', 'draft')
      .maybeSingle();

    if (draft) {
      setFormData({
        ...INITIAL_STARTUP_DATA,
        businessName: draft.business_name || '',
        tagline: draft.tagline || '',
        problemStatement: draft.problem_statement || '',
        solutionDescription: draft.solution_description || '',
        uniqueValueProposition: draft.unique_value_proposition || '',
        whyNow: draft.why_now || '',
        inspiration: draft.inspiration || '',
        idealCustomerProfile: draft.ideal_customer_profile || '',
        customerPainPoints: draft.customer_pain_points || [],
        marketSize: {
          TAM: draft.market_tam || '',
          SAM: draft.market_sam || '',
          SOM: draft.market_som || '',
        },
        competitors: parseJsonArray<Competitor>(draft.competitors, []),
        competitiveAdvantage: draft.competitive_advantage || '',
        distributionChannels: draft.distribution_channels || [],
        monetizationStrategy: parseMonetizationStrategy(draft.monetization_strategy),
        pricingHypothesis: {
          lowestTier: draft.pricing_lowest_tier || 0,
          middleTier: draft.pricing_middle_tier || 0,
          highestTier: draft.pricing_highest_tier || 0,
          currency: draft.pricing_currency || 'EUR',
        },
        revenueStreams: draft.revenue_streams || [],
        costStructure: parseJsonArray<CostStructureItem>(draft.cost_structure, []),
        unitEconomics: {
          estimatedCAC: draft.estimated_cac || 0,
          estimatedLTV: draft.estimated_ltv || 0,
          targetLTVCACRatio: draft.target_ltv_cac_ratio || 3,
        },
        mvpDescription: draft.mvp_description || '',
        coreFeatures: parseJsonArray<CoreFeature>(draft.core_features, []),
        developmentTimeline: draft.development_timeline_weeks || 0,
        technologyStack: draft.technology_stack || [],
        technicalChallenges: draft.technical_challenges || '',
        launchStrategy: parseLaunchStrategy(draft.launch_strategy),
        first100CustomersStrategy: draft.first_100_customers_strategy || '',
        initialMarketingBudget: draft.initial_marketing_budget || 0,
        acquisitionChannels: parseJsonArray<AcquisitionChannel>(draft.acquisition_channels, []),
        contentStrategy: draft.content_strategy || '',
        partnershipsStrategy: draft.partnerships_strategy || '',
        founders: parseJsonArray<Founder>(draft.founders, []),
        missingSkills: draft.missing_skills || [],
        currentCapital: draft.current_capital || 0,
        capitalNeeded: draft.capital_needed || 0,
        fundingStrategy: parseFundingStrategy(draft.funding_strategy),
        runwayGoal: draft.runway_goal_months || 12,
        criticalHypotheses: parseJsonArray<CriticalHypothesis>(draft.critical_hypotheses, []),
        prelaunchMetrics: draft.prelaunch_metrics || [],
        postlaunchKPIs: draft.postlaunch_kpis || [],
        pivotCriteria: draft.pivot_criteria || '',
        successDefinition: draft.success_definition || '',
        milestones: parseJsonArray<Milestone>(draft.milestones, []),
        threeMonthGoal: draft.three_month_goal || '',
        sixMonthGoal: draft.six_month_goal || '',
        twelveMonthGoal: draft.twelve_month_goal || '',
        exitStrategy: draft.exit_strategy || '',
        id: draft.id,
        status: 'draft',
        currentStep: draft.current_step || 1,
      });
      setCurrentStep(draft.current_step || 1);
      toast.info('Borrador cargado');
    }
  };

  const updateFormData = (partialData: Partial<StartupOnboardingData>) => {
    setFormData(prev => ({ ...prev, ...partialData }));
  };

  // Callback when account is created in step 0
  const handleAccountCreated = (userId: string, organizationId: string) => {
    setCreatedUserId(userId);
    setCreatedOrganizationId(organizationId);
    setAccountCreated(true);
    toast.success('¡Cuenta creada! Ahora completaremos los datos de tu startup 🚀');
    setCurrentStep(1); // Advance to step 1 (Vision)
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return accountCreated; // Must have created account
      case 1:
        return !!formData.businessName && !!formData.problemStatement && !!formData.solutionDescription;
      case 2:
        return !!formData.idealCustomerProfile;
      case 3:
        return !!formData.monetizationStrategy;
      case 4:
        return !!formData.mvpDescription;
      case 5:
        return !!formData.launchStrategy;
      case 6:
        return formData.founders.length > 0;
      case 7:
        return formData.criticalHypotheses.length > 0;
      case 8:
        return formData.milestones.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      if (currentStep === 0 && !accountCreated) {
        toast.error('Por favor crea tu cuenta primero');
      } else {
        toast.error('Por favor completa los campos requeridos');
      }
      return;
    }
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const getOrganizationId = () => createdOrganizationId;
  const getUserId = () => createdUserId || user?.id;

  const buildDataToSave = () => {
    const orgId = getOrganizationId();
    const userId = getUserId();
    
    if (!orgId || !userId) return null;
    
    return {
      organization_id: orgId,
      created_by: userId,
      business_name: formData.businessName,
      tagline: formData.tagline,
      problem_statement: formData.problemStatement,
      solution_description: formData.solutionDescription,
      unique_value_proposition: formData.uniqueValueProposition,
      why_now: formData.whyNow,
      inspiration: formData.inspiration,
      ideal_customer_profile: formData.idealCustomerProfile,
      customer_pain_points: formData.customerPainPoints,
      market_tam: formData.marketSize.TAM,
      market_sam: formData.marketSize.SAM,
      market_som: formData.marketSize.SOM,
      competitors: formData.competitors as unknown as Json,
      competitive_advantage: formData.competitiveAdvantage,
      distribution_channels: formData.distributionChannels,
      monetization_strategy: formData.monetizationStrategy,
      pricing_lowest_tier: formData.pricingHypothesis.lowestTier,
      pricing_middle_tier: formData.pricingHypothesis.middleTier,
      pricing_highest_tier: formData.pricingHypothesis.highestTier,
      pricing_currency: formData.pricingHypothesis.currency,
      revenue_streams: formData.revenueStreams,
      cost_structure: formData.costStructure as unknown as Json,
      estimated_cac: formData.unitEconomics.estimatedCAC,
      estimated_ltv: formData.unitEconomics.estimatedLTV,
      target_ltv_cac_ratio: formData.unitEconomics.targetLTVCACRatio,
      mvp_description: formData.mvpDescription,
      core_features: formData.coreFeatures as unknown as Json,
      development_timeline_weeks: formData.developmentTimeline,
      technology_stack: formData.technologyStack,
      technical_challenges: formData.technicalChallenges,
      launch_strategy: formData.launchStrategy,
      first_100_customers_strategy: formData.first100CustomersStrategy,
      initial_marketing_budget: formData.initialMarketingBudget,
      acquisition_channels: formData.acquisitionChannels as unknown as Json,
      content_strategy: formData.contentStrategy,
      partnerships_strategy: formData.partnershipsStrategy,
      founders: formData.founders as unknown as Json,
      missing_skills: formData.missingSkills,
      current_capital: formData.currentCapital,
      capital_needed: formData.capitalNeeded,
      funding_strategy: formData.fundingStrategy,
      runway_goal_months: formData.runwayGoal,
      critical_hypotheses: formData.criticalHypotheses as unknown as Json,
      prelaunch_metrics: formData.prelaunchMetrics,
      postlaunch_kpis: formData.postlaunchKPIs,
      pivot_criteria: formData.pivotCriteria,
      success_definition: formData.successDefinition,
      milestones: formData.milestones as unknown as Json,
      three_month_goal: formData.threeMonthGoal,
      six_month_goal: formData.sixMonthGoal,
      twelve_month_goal: formData.twelveMonthGoal,
      exit_strategy: formData.exitStrategy,
      current_step: currentStep,
    };
  };

  const handleSaveDraft = async () => {
    const dataToSave = buildDataToSave();
    if (!dataToSave) {
      toast.error('No se encontró organización o usuario');
      return;
    }
    
    setIsSaving(true);

    try {
      const draftData = { ...dataToSave, status: 'draft' as const };

      if (formData.id) {
        await supabase.from('startup_onboardings').update(draftData).eq('id', formData.id);
      } else {
        const { data } = await supabase.from('startup_onboardings').insert(draftData).select().single();
        if (data) setFormData(prev => ({ ...prev, id: data.id }));
      }

      toast.success('Borrador guardado');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Error al guardar borrador');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }
    
    const dataToSave = buildDataToSave();
    if (!dataToSave) {
      toast.error('No se encontró organización o usuario');
      return;
    }

    setIsSubmitting(true);

    try {
      const completedData = {
        ...dataToSave,
        status: 'completed' as const,
        current_step: TOTAL_STEPS,
        completed_at: new Date().toISOString(),
      };

      let onboardingId = formData.id;

      if (formData.id) {
        await supabase.from('startup_onboardings').update(completedData).eq('id', formData.id);
      } else {
        const { data } = await supabase.from('startup_onboardings').insert(completedData).select().single();
        if (data) onboardingId = data.id;
      }

      toast.info('Generando tu workspace personalizado...');
      
      const { error: workspaceError } = await supabase.functions.invoke('generate-startup-workspace', {
        body: { onboardingId }
      });

      if (workspaceError) {
        console.error('Workspace generation error:', workspaceError);
        toast.warning('Workspace creado parcialmente. Algunas funciones se generarán después.');
      } else {
        toast.success('¡Workspace generado! Tus tareas y herramientas están listas.');
      }

      toast.success('¡Organización creada exitosamente!', {
        description: 'Ahora selecciona tu plan...'
      });
      navigate('/select-plan');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al generar workspace');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    // Step 0: Account creation
    if (currentStep === 0) {
      return <StartupStep0Account onAccountCreated={handleAccountCreated} />;
    }
    
    const props = { data: formData, updateData: updateFormData };
    
    switch (currentStep) {
      case 1: return <StartupStep1Vision {...props} />;
      case 2: return <StartupStep2Market {...props} />;
      case 3: return <StartupStep3BusinessModel {...props} />;
      case 4: return <StartupStep4Product {...props} />;
      case 5: return <StartupStep5GoToMarket {...props} />;
      case 6: return <StartupStep6Resources {...props} />;
      case 7: return <StartupStep7Validation {...props} />;
      case 8: return <StartupStep8Timeline {...props} />;
      default: return null;
    }
  };

  // Calculate progress (step 0 = 0%, step 8 = 100%)
  const progress = currentStep === 0 ? 0 : ((currentStep / (TOTAL_STEPS - 1)) * 100);

  // Loading state while initializing organization
  if (isLoadingOrg) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <div>
            <h2 className="text-xl font-semibold mb-2">Preparando tu workspace...</h2>
            <p className="text-muted-foreground">Esto solo tomará un momento</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4">
          {/* Welcome header */}
          <div className="text-center mb-4 md:mb-6">
            <h1 className="text-2xl md:text-4xl font-bold text-foreground">
              Bienvenido a <span className="text-primary">OPTIMUS-K</span>
            </h1>
            <p className="text-base md:text-lg text-primary/80 mt-1">
              Generador de Apps para Startups
            </p>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Completa este formulario y en 2-3 horas tendrás tu workspace personalizado listo 🚀
            </p>
          </div>

          <div className="flex items-center justify-between mb-3 md:mb-4 gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')} 
                className="flex-shrink-0 h-8 px-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Volver</span>
              </Button>
              <Rocket className="w-6 h-6 md:w-8 md:h-8 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] md:text-sm text-muted-foreground">
                  Paso {currentStep}/{TOTAL_STEPS - 1}: {STEP_TITLES[currentStep]}
                </p>
              </div>
            </div>
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={isSaving} className="flex-shrink-0 h-8 text-xs md:text-sm">
                {isSaving ? <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin mr-1 md:mr-2" /> : <Save className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />}
                <span className="hidden sm:inline">Guardar</span>
              </Button>
            )}
          </div>
          
          <Progress value={progress} className="h-1.5 md:h-2" />
          
          {/* Step titles - horizontal scroll on mobile */}
          <div className="flex justify-between mt-2 overflow-x-auto scrollbar-hide -mx-3 px-3 md:mx-0 md:px-0 gap-1">
            {STEP_TITLES.map((title, index) => (
              <button
                key={index}
                onClick={() => index <= currentStep && setCurrentStep(index)}
                disabled={index > currentStep}
                className={`text-[9px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded transition-colors whitespace-nowrap flex-shrink-0 ${
                  index === currentStep
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : index < currentStep
                    ? 'text-primary hover:bg-primary/10 cursor-pointer'
                    : 'text-muted-foreground cursor-not-allowed'
                }`}
              >
                {title}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-4xl">
        <Card>
          <CardContent className="p-3 md:p-8">
            {renderStep()}
          </CardContent>
        </Card>

        <div className="flex justify-between mt-4 md:mt-6 gap-2">
          <Button 
            variant="outline" 
            onClick={handleBack} 
            disabled={currentStep === 0} 
            size="sm" 
            className="h-9 md:h-10 text-xs md:text-sm"
          >
            <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            Anterior
          </Button>

          {currentStep < TOTAL_STEPS - 1 ? (
            <Button onClick={handleNext} size="sm" className="h-9 md:h-10 text-xs md:text-sm">
              Siguiente
              <ArrowRight className="w-3 h-3 md:w-4 md:h-4 ml-1 md:ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 h-9 md:h-10 text-xs md:text-sm">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin mr-1 md:mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Rocket className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  Finalizar y Guardar
                </>
              )}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
