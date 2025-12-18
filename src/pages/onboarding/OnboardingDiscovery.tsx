import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft, ChevronRight, Sparkles, Lightbulb } from 'lucide-react';
import { DiscoveryFormData } from '@/types/discovery-onboarding';

// Discovery Steps
import DiscoveryStep0Account from './discovery/DiscoveryStep0Account';
import DiscoveryStep1Situation from './discovery/DiscoveryStep1Situation';
import DiscoveryStep2Time from './discovery/DiscoveryStep2Time';
import DiscoveryStep3Risk from './discovery/DiscoveryStep3Risk';
import DiscoveryStep4Motivations from './discovery/DiscoveryStep4Motivations';
import DiscoveryStep5Skills from './discovery/DiscoveryStep5Skills';
import DiscoveryStep6Industries from './discovery/DiscoveryStep6Industries';
import DiscoveryStep7Target from './discovery/DiscoveryStep7Target';
import DiscoveryStep8Capital from './discovery/DiscoveryStep8Capital';
import DiscoveryStep9Idea from './discovery/DiscoveryStep9Idea';
import DiscoveryStep10BusinessType from './discovery/DiscoveryStep10BusinessType';
import DiscoveryStep11Urgency from './discovery/DiscoveryStep11Urgency';

const TOTAL_STEPS = 12; // 0-11

const OnboardingDiscovery = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

  const [formData, setFormData] = useState<DiscoveryFormData>({
    contactName: '',
    accountEmail: '',
    accountPassword: '',
    currentSituation: '',
    hoursWeekly: 15,
    riskTolerance: 3,
    motivations: [],
    skills: [],
    industries: [],
    targetAudiencePreference: '',
    initialCapital: '',
    existingIdea: '',
    businessTypePreference: '',
    revenueUrgency: ''
  });

  // If user is already logged in, skip account step
  useEffect(() => {
    if (user) {
      setAccountCreated(true);
      setFormData(prev => ({
        ...prev,
        accountEmail: user.email || '',
        contactName: user.user_metadata?.full_name || ''
      }));
      if (currentStep === 0) {
        setCurrentStep(1);
      }
    }
  }, [user, currentStep]);

  const updateFormData = (data: Partial<DiscoveryFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        if (!accountCreated && !user) {
          toast.error('Por favor crea tu cuenta antes de continuar');
          return false;
        }
        return true;
      case 1:
        if (!formData.currentSituation) {
          toast.error('Selecciona tu situación actual');
          return false;
        }
        return true;
      case 2:
        if (formData.hoursWeekly < 5) {
          toast.error('Necesitas al menos 5 horas semanales');
          return false;
        }
        return true;
      case 3:
        return true; // Risk tolerance always has a default
      case 4:
        if (formData.motivations.length === 0) {
          toast.error('Selecciona al menos 1 motivación');
          return false;
        }
        if (formData.motivations.length > 3) {
          toast.error('Selecciona máximo 3 motivaciones');
          return false;
        }
        return true;
      case 5:
        if (formData.skills.length === 0) {
          toast.error('Selecciona al menos 1 habilidad');
          return false;
        }
        if (formData.skills.length > 3) {
          toast.error('Selecciona máximo 3 habilidades');
          return false;
        }
        return true;
      case 6:
        if (formData.industries.length === 0) {
          toast.error('Selecciona al menos 1 industria');
          return false;
        }
        return true;
      case 7:
        if (!formData.targetAudiencePreference) {
          toast.error('Selecciona tu audiencia objetivo');
          return false;
        }
        return true;
      case 8:
        if (!formData.initialCapital) {
          toast.error('Selecciona tu capital inicial disponible');
          return false;
        }
        return true;
      case 9:
        return true; // Existing idea is optional
      case 10:
        if (!formData.businessTypePreference) {
          toast.error('Selecciona tu tipo de negocio preferido');
          return false;
        }
        return true;
      case 11:
        if (!formData.revenueUrgency) {
          toast.error('Selecciona tu urgencia de ingresos');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < TOTAL_STEPS - 1) {
        setCurrentStep(prev => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > (user ? 1 : 0)) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const currentUser = user || (await supabase.auth.getUser()).data.user;
      if (!currentUser) {
        throw new Error('No user found');
      }

      // Save discovery profile
      const { data: profile, error: profileError } = await supabase
        .from('discovery_profiles')
        .insert({
          user_id: currentUser.id,
          contact_name: formData.contactName,
          contact_email: formData.accountEmail,
          current_situation: formData.currentSituation,
          hours_weekly: formData.hoursWeekly,
          risk_tolerance: formData.riskTolerance,
          motivations: formData.motivations,
          skills: formData.skills,
          industries: formData.industries,
          target_audience_preference: formData.targetAudiencePreference,
          initial_capital: formData.initialCapital,
          existing_idea: formData.existingIdea,
          business_type_preference: formData.businessTypePreference,
          revenue_urgency: formData.revenueUrgency,
          status: 'in_progress',
          current_step: TOTAL_STEPS
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Navigate to results page to generate ideas
      navigate(`/onboarding/discovery/results?profile=${profile.id}`);

    } catch (error) {
      console.error('Error saving discovery profile:', error);
      toast.error('Error al guardar tu perfil. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountCreated = () => {
    setAccountCreated(true);
    setCurrentStep(1);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <DiscoveryStep0Account
            data={formData}
            updateData={updateFormData}
            onAccountCreated={handleAccountCreated}
          />
        );
      case 1:
        return <DiscoveryStep1Situation data={formData} updateData={updateFormData} />;
      case 2:
        return <DiscoveryStep2Time data={formData} updateData={updateFormData} />;
      case 3:
        return <DiscoveryStep3Risk data={formData} updateData={updateFormData} />;
      case 4:
        return <DiscoveryStep4Motivations data={formData} updateData={updateFormData} />;
      case 5:
        return <DiscoveryStep5Skills data={formData} updateData={updateFormData} />;
      case 6:
        return <DiscoveryStep6Industries data={formData} updateData={updateFormData} />;
      case 7:
        return <DiscoveryStep7Target data={formData} updateData={updateFormData} />;
      case 8:
        return <DiscoveryStep8Capital data={formData} updateData={updateFormData} />;
      case 9:
        return <DiscoveryStep9Idea data={formData} updateData={updateFormData} />;
      case 10:
        return <DiscoveryStep10BusinessType data={formData} updateData={updateFormData} />;
      case 11:
        return <DiscoveryStep11Urgency data={formData} updateData={updateFormData} />;
      default:
        return null;
    }
  };

  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Lightbulb className="h-8 w-8 text-yellow-500" />
            <h1 className="text-2xl md:text-3xl font-bold">Descubre tu Idea de Negocio</h1>
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <p className="text-muted-foreground">
            12 preguntas rápidas para encontrar tu idea perfecta
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Pregunta {currentStep + 1} de {TOTAL_STEPS}</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="p-6 md:p-8 mb-6">
          {renderStep()}
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || (user && currentStep === 1)}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>

          {currentStep < TOTAL_STEPS - 1 ? (
            <Button onClick={handleNext} className="gap-2">
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleNext} 
              disabled={loading}
              className="gap-2 bg-gradient-to-r from-primary to-accent"
            >
              {loading ? (
                <>Generando ideas...</>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Ver mis 3 Ideas
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingDiscovery;
