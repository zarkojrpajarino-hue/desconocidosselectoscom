// src/pages/SelectPlan.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, AlertCircle, Sparkles, Zap, Rocket, Crown, LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { BackButton } from '@/components/BackButton';

interface Plan {
  id: 'trial' | 'starter' | 'professional' | 'enterprise';
  name: string;
  price: string;
  description: string;
  features: string[];
  icon: LucideIcon;
  priceId: string | null;
  popular?: boolean;
}

interface TrialCheckResult {
  can_use_trial: boolean;
  already_used: boolean;
  message: string;
  used_at?: string;
}

const SelectPlan = () => {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [canUseTrial, setCanUseTrial] = useState(true);
  const [trialInfo, setTrialInfo] = useState<TrialCheckResult | null>(null);
  const { user, currentOrganizationId, userOrganizations } = useAuth();
  const navigate = useNavigate();

  const currentOrganization = userOrganizations.find(
    org => org.organization_id === currentOrganizationId
  );

  const plans: Plan[] = [
    {
      id: 'trial',
      name: 'Free Trial',
      price: '€0',
      description: '14 días gratis para probar todas las funciones',
      features: [
        'Acceso completo por 14 días',
        'Todas las funciones Professional',
        'Sin tarjeta de crédito',
        'Soporte por email',
      ],
      icon: Sparkles,
      priceId: null,
    },
    {
      id: 'starter',
      name: 'Starter',
      price: '€129',
      description: 'Perfecto para equipos pequeños',
      features: [
        'Hasta 10 usuarios',
        'CRM básico',
        'Gestión de tareas',
        'OKRs y métricas',
        'Soporte estándar',
      ],
      icon: Zap,
      priceId: 'starter',
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '€249',
      description: 'Para empresas en crecimiento',
      features: [
        'Usuarios ilimitados',
        'CRM avanzado + Pipeline',
        'Automatizaciones',
        'Integraciones premium',
        'Soporte prioritario',
        'Analytics avanzados',
      ],
      icon: Rocket,
      priceId: 'professional',
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '€449',
      description: 'Solución completa para grandes organizaciones',
      features: [
        'Todo de Professional',
        'SLA garantizado',
        'Soporte dedicado 24/7',
        'Onboarding personalizado',
        'Integraciones custom',
        'Seguridad avanzada',
      ],
      icon: Crown,
      priceId: 'enterprise',
    },
  ];

  useEffect(() => {
    const checkTrialEligibility = async () => {
      if (!user?.email) {
        navigate('/');
        return;
      }

      try {
        const { data, error } = await supabase.rpc('can_use_trial', {
          user_email: user.email
        });

        if (error) {
          console.error('Error checking trial:', error);
          return;
        }

        const result = data as unknown as TrialCheckResult;
        setCanUseTrial(result.can_use_trial);
        setTrialInfo(result);
      } catch (error) {
        console.error('Error checking trial eligibility:', error);
      }
    };

    checkTrialEligibility();
  }, [user, navigate]);

  const handleSelectPlan = async (planId: string) => {
    if (!currentOrganizationId || !user) {
      toast.error('No se encontró la organización');
      return;
    }

    if (planId === 'trial' && !canUseTrial) {
      toast.error('Ya has usado tu periodo de prueba gratuito', {
        description: trialInfo?.used_at 
          ? `Lo usaste el ${new Date(trialInfo.used_at).toLocaleDateString()}` 
          : undefined
      });
      return;
    }

    setLoading(true);
    setSelectedPlan(planId);

    try {
      if (planId === 'trial') {
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14);

        const { error: updateError } = await supabase
          .from('organizations')
          .update({
            plan: 'trial',
            subscription_status: 'trialing',
            trial_ends_at: trialEndsAt.toISOString(),
            current_period_end: trialEndsAt.toISOString()
          })
          .eq('id', currentOrganizationId);

        if (updateError) throw updateError;

        await supabase.rpc('register_trial_email', {
          user_email: user.email,
          org_id: currentOrganizationId,
          user_id_param: user.id
        });

        toast.success('¡Trial activado!', {
          description: 'Tienes 14 días para probar todas las funciones'
        });

        navigate('/dashboard/home');
      } else {
        const plan = plans.find(p => p.id === planId);
        
        if (!plan?.priceId) {
          toast.error('Plan no disponible');
          return;
        }

        const { data, error } = await supabase.functions.invoke('create-checkout', {
          body: {
            planName: plan.priceId,
            organizationId: currentOrganizationId,
            successUrl: `${window.location.origin}/dashboard/home`,
            cancelUrl: `${window.location.origin}/select-plan`
          }
        });

        if (error) throw error;

        if (data?.url) {
          window.open(data.url, '_blank');
          toast.success('Redirigiendo a Stripe...', {
            description: 'Completa el pago en la nueva pestaña'
          });
        } else {
          throw new Error('No se recibió URL de checkout');
        }
      }
    } catch (error) {
      console.error('Error selecting plan:', error);
      toast.error('Error al seleccionar plan');
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const availablePlans = plans.filter(plan => 
    plan.id !== 'trial' || canUseTrial
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12 px-4">
      <div className="container max-w-6xl mx-auto">
        
        <div className="mb-8">
          <BackButton to="/" />
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Elige tu Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Selecciona el plan perfecto para <strong>{currentOrganization?.organization_name || 'tu organización'}</strong>
          </p>

          {!canUseTrial && (
            <div className="mt-6 max-w-md mx-auto">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-sm text-left">
                  <p className="font-medium text-destructive">Trial ya utilizado</p>
                  <p className="text-muted-foreground mt-1">
                    Ya has usado tu periodo de prueba gratuito. Por favor selecciona un plan de pago.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 max-w-md mx-auto">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
              <p className="text-sm font-medium">
                ⚠️ Debes seleccionar un plan para continuar
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {availablePlans.map((plan) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === plan.id;
            const isLoading = loading && isSelected;

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all hover:shadow-xl ${
                  plan.popular ? 'border-primary shadow-lg' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0">
                    <Badge className="rounded-bl-lg rounded-tr-lg border-0">
                      Más Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-2 rounded-lg ${
                      plan.id === 'trial' ? 'bg-secondary/20' :
                      plan.id === 'starter' ? 'bg-blue-500/20' :
                      plan.id === 'professional' ? 'bg-primary/20' :
                      'bg-purple-500/20'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle>{plan.name}</CardTitle>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.id !== 'trial' && (
                      <span className="text-muted-foreground">/mes</span>
                    )}
                  </div>

                  <CardDescription className="mt-2">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={loading}
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      plan.id === 'trial' ? 'Comenzar Trial' : 'Seleccionar Plan'
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>Todos los planes incluyen actualizaciones gratuitas y soporte técnico.</p>
          <p className="mt-2">
            ¿Necesitas ayuda para elegir?{' '}
            <a href="mailto:info@optimus-k.com" className="text-primary hover:underline">
              Contáctanos
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SelectPlan;