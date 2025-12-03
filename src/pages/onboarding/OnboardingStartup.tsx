import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Loader2, Save, Rocket } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { StartupOnboardingData, INITIAL_STARTUP_DATA } from '@/types/startup-onboarding';

// Lazy load steps for better performance
import StartupStep1Vision from './startup/StartupStep1Vision';
import StartupStep2Market from './startup/StartupStep2Market';
import StartupStep3BusinessModel from './startup/StartupStep3BusinessModel';
import StartupStep4Product from './startup/StartupStep4Product';
import StartupStep5GoToMarket from './startup/StartupStep5GoToMarket';
import StartupStep6Resources from './startup/StartupStep6Resources';
import StartupStep7Validation from './startup/StartupStep7Validation';
import StartupStep8Timeline from './startup/StartupStep8Timeline';

const TOTAL_STEPS = 8;

const STEP_TITLES = [
  'Visión', 'Mercado', 'Modelo de Negocio', 'Producto',
  'Go-to-Market', 'Recursos', 'Validación', 'Timeline'
];

export default function OnboardingStartup() {
  const navigate = useNavigate();
  const { user, currentOrganizationId } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<StartupOnboardingData>(INITIAL_STARTUP_DATA);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadDraft();
  }, [currentOrganizationId]);

  const loadDraft = async () => {
    if (!currentOrganizationId) return;
    
    const { data: draft } = await supabase
      .from('startup_onboardings')
      .select('*')
      .eq('organization_id', currentOrganizationId)
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
        competitors: (draft.competitors as StartupOnboardingData['competitors']) || [],
        competitiveAdvantage: draft.competitive_advantage || '',
        distributionChannels: draft.distribution_channels || [],
        monetizationStrategy: draft.monetization_strategy || 'subscription',
        pricingHypothesis: {
          lowestTier: draft.pricing_lowest_tier || 0,
          middleTier: draft.pricing_middle_tier || 0,
          highestTier: draft.pricing_highest_tier || 0,
          currency: draft.pricing_currency || 'EUR',
        },
        revenueStreams: draft.revenue_streams || [],
        costStructure: (draft.cost_structure as StartupOnboardingData['costStructure']) || [],
        unitEconomics: {
          estimatedCAC: draft.estimated_cac || 0,
          estimatedLTV: draft.estimated_ltv || 0,
          targetLTVCACRatio: draft.target_ltv_cac_ratio || 3,
        },
        mvpDescription: draft.mvp_description || '',
        coreFeatures: (draft.core_features as StartupOnboardingData['coreFeatures']) || [],
        developmentTimeline: draft.development_timeline_weeks || 0,
        technologyStack: draft.technology_stack || [],
        technicalChallenges: draft.technical_challenges || '',
        launchStrategy: draft.launch_strategy || 'beta',
        first100CustomersStrategy: draft.first_100_customers_strategy || '',
        initialMarketingBudget: draft.initial_marketing_budget || 0,
        acquisitionChannels: (draft.acquisition_channels as StartupOnboardingData['acquisitionChannels']) || [],
        contentStrategy: draft.content_strategy || '',
        partnershipsStrategy: draft.partnerships_strategy || '',
        founders: (draft.founders as StartupOnboardingData['founders']) || [],
        missingSkills: draft.missing_skills || [],
        currentCapital: draft.current_capital || 0,
        capitalNeeded: draft.capital_needed || 0,
        fundingStrategy: draft.funding_strategy || 'bootstrapped',
        runwayGoal: draft.runway_goal_months || 12,
        criticalHypotheses: (draft.critical_hypotheses as StartupOnboardingData['criticalHypotheses']) || [],
        prelaunchMetrics: draft.prelaunch_metrics || [],
        postlaunchKPIs: draft.postlaunch_kpis || [],
        pivotCriteria: draft.pivot_criteria || '',
        successDefinition: draft.success_definition || '',
        milestones: (draft.milestones as StartupOnboardingData['milestones']) || [],
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

  const validateStep = (step: number): boolean => {
    switch (step) {
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
      toast.error('Por favor completa los campos requeridos');
      return;
    }
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSaveDraft = async () => {
    if (!user || !currentOrganizationId) return;
    setIsSaving(true);

    try {
      const dataToSave = {
        organization_id: currentOrganizationId,
        created_by: user.id,
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
        competitors: formData.competitors,
        competitive_advantage: formData.competitiveAdvantage,
        distribution_channels: formData.distributionChannels,
        monetization_strategy: formData.monetizationStrategy,
        pricing_lowest_tier: formData.pricingHypothesis.lowestTier,
        pricing_middle_tier: formData.pricingHypothesis.middleTier,
        pricing_highest_tier: formData.pricingHypothesis.highestTier,
        pricing_currency: formData.pricingHypothesis.currency,
        revenue_streams: formData.revenueStreams,
        cost_structure: formData.costStructure,
        estimated_cac: formData.unitEconomics.estimatedCAC,
        estimated_ltv: formData.unitEconomics.estimatedLTV,
        target_ltv_cac_ratio: formData.unitEconomics.targetLTVCACRatio,
        mvp_description: formData.mvpDescription,
        core_features: formData.coreFeatures,
        development_timeline_weeks: formData.developmentTimeline,
        technology_stack: formData.technologyStack,
        technical_challenges: formData.technicalChallenges,
        launch_strategy: formData.launchStrategy,
        first_100_customers_strategy: formData.first100CustomersStrategy,
        initial_marketing_budget: formData.initialMarketingBudget,
        acquisition_channels: formData.acquisitionChannels,
        content_strategy: formData.contentStrategy,
        partnerships_strategy: formData.partnershipsStrategy,
        founders: formData.founders,
        missing_skills: formData.missingSkills,
        current_capital: formData.currentCapital,
        capital_needed: formData.capitalNeeded,
        funding_strategy: formData.fundingStrategy,
        runway_goal_months: formData.runwayGoal,
        critical_hypotheses: formData.criticalHypotheses,
        prelaunch_metrics: formData.prelaunchMetrics,
        postlaunch_kpis: formData.postlaunchKPIs,
        pivot_criteria: formData.pivotCriteria,
        success_definition: formData.successDefinition,
        milestones: formData.milestones,
        three_month_goal: formData.threeMonthGoal,
        six_month_goal: formData.sixMonthGoal,
        twelve_month_goal: formData.twelveMonthGoal,
        exit_strategy: formData.exitStrategy,
        status: 'draft' as const,
        current_step: currentStep,
      };

      if (formData.id) {
        await supabase.from('startup_onboardings').update(dataToSave).eq('id', formData.id);
      } else {
        const { data } = await supabase.from('startup_onboardings').insert(dataToSave).select().single();
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
    if (!user || !currentOrganizationId) return;

    setIsSubmitting(true);

    try {
      // Save completed onboarding
      const dataToSave = {
        organization_id: currentOrganizationId,
        created_by: user.id,
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
        competitors: formData.competitors,
        competitive_advantage: formData.competitiveAdvantage,
        distribution_channels: formData.distributionChannels,
        monetization_strategy: formData.monetizationStrategy,
        pricing_lowest_tier: formData.pricingHypothesis.lowestTier,
        pricing_middle_tier: formData.pricingHypothesis.middleTier,
        pricing_highest_tier: formData.pricingHypothesis.highestTier,
        pricing_currency: formData.pricingHypothesis.currency,
        revenue_streams: formData.revenueStreams,
        cost_structure: formData.costStructure,
        estimated_cac: formData.unitEconomics.estimatedCAC,
        estimated_ltv: formData.unitEconomics.estimatedLTV,
        target_ltv_cac_ratio: formData.unitEconomics.targetLTVCACRatio,
        mvp_description: formData.mvpDescription,
        core_features: formData.coreFeatures,
        development_timeline_weeks: formData.developmentTimeline,
        technology_stack: formData.technologyStack,
        technical_challenges: formData.technicalChallenges,
        launch_strategy: formData.launchStrategy,
        first_100_customers_strategy: formData.first100CustomersStrategy,
        initial_marketing_budget: formData.initialMarketingBudget,
        acquisition_channels: formData.acquisitionChannels,
        content_strategy: formData.contentStrategy,
        partnerships_strategy: formData.partnershipsStrategy,
        founders: formData.founders,
        missing_skills: formData.missingSkills,
        current_capital: formData.currentCapital,
        capital_needed: formData.capitalNeeded,
        funding_strategy: formData.fundingStrategy,
        runway_goal_months: formData.runwayGoal,
        critical_hypotheses: formData.criticalHypotheses,
        prelaunch_metrics: formData.prelaunchMetrics,
        postlaunch_kpis: formData.postlaunchKPIs,
        pivot_criteria: formData.pivotCriteria,
        success_definition: formData.successDefinition,
        milestones: formData.milestones,
        three_month_goal: formData.threeMonthGoal,
        six_month_goal: formData.sixMonthGoal,
        twelve_month_goal: formData.twelveMonthGoal,
        exit_strategy: formData.exitStrategy,
        status: 'completed' as const,
        current_step: TOTAL_STEPS,
        completed_at: new Date().toISOString(),
      };

      let onboardingId = formData.id;

      if (formData.id) {
        await supabase.from('startup_onboardings').update(dataToSave).eq('id', formData.id);
      } else {
        const { data } = await supabase.from('startup_onboardings').insert(dataToSave).select().single();
        if (data) onboardingId = data.id;
      }

      // Generate workspace
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

      navigate('/home');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al generar workspace');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Rocket className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Onboarding Startup</h1>
                <p className="text-sm text-muted-foreground">
                  Paso {currentStep} de {TOTAL_STEPS}: {STEP_TITLES[currentStep - 1]}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar borrador
            </Button>
          </div>
          
          <Progress value={(currentStep / TOTAL_STEPS) * 100} className="h-2" />
          
          <div className="flex justify-between mt-2">
            {STEP_TITLES.map((title, index) => (
              <button
                key={index}
                onClick={() => index + 1 <= currentStep && setCurrentStep(index + 1)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  index + 1 === currentStep
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : index + 1 < currentStep
                    ? 'text-primary hover:bg-primary/10 cursor-pointer'
                    : 'text-muted-foreground'
                }`}
              >
                {title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="p-6 md:p-8">
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          {currentStep < TOTAL_STEPS ? (
            <Button onClick={handleNext}>
              Siguiente
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generando workspace...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Finalizar y Generar Workspace
                </>
              )}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
