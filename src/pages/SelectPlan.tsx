/**
 * PÁGINA DE SELECCIÓN DE PLAN - Versión Mejorada
 * ✅ CORREGIDO: error: unknown en vez de error: any
 * ✅ CORREGIDO: Tokens semánticos para dark mode
 * ✅ CORREGIDO: Type safety mejorado
 * ✅ CORREGIDO: Sin colores hardcodeados
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  Loader2, 
  Sparkles, 
  Zap, 
  Rocket, 
  Crown, 
  Mail,
  ArrowRight,
  Star,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { BackButton } from '@/components/BackButton';
import { cn } from '@/lib/utils';

interface Plan {
  id: 'trial' | 'starter' | 'professional' | 'enterprise' | 'contact';
  name: string;
  price: string;
  priceDetail: string;
  description: string;
  tagline?: string;
  features: {
    category: string;
    items: string[];
  }[];
  icon: typeof Sparkles;
  priceId: string | null;
  popular?: boolean;
  highlighted?: boolean;
  buttonText?: string;
  buttonVariant?: 'default' | 'outline';
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
      priceDetail: '14 días gratis',
      description: 'Prueba completa sin compromiso',
      tagline: 'Perfecto para evaluar',
      features: [
        {
          category: 'Acceso',
          items: [
            '14 días de acceso completo',
            'Todas las funciones Professional',
            'Sin tarjeta de crédito requerida',
            'Soporte por email',
          ],
        },
        {
          category: 'Límites del Trial',
          items: [
            'Hasta 3 usuarios',
            'Hasta 50 leads',
            '2 análisis IA',
            'Fases 1 y 2 disponibles',
          ],
        },
      ],
      icon: Sparkles,
      priceId: null,
      buttonText: 'Iniciar Trial Gratuito',
    },
    {
      id: 'starter',
      name: 'Starter',
      price: '€129',
      priceDetail: 'por mes',
      description: 'Ideal para equipos pequeños que empiezan',
      tagline: 'Empieza tu viaje',
      features: [
        {
          category: 'Equipo',
          items: [
            'Hasta 10 usuarios',
            '1 organización propia',
            'Soporte 48h',
          ],
        },
        {
          category: 'Funcionalidades',
          items: [
            'CRM básico (1000 leads/mes)',
            'Gestión de tareas (Fases 1-2)',
            'OKRs (hasta 10 objectives)',
            'Métricas básicas (15 KPIs)',
            '4 herramientas IA/mes',
          ],
        },
        {
          category: 'Integraciones',
          items: [
            'Exportar a CSV',
            'Sin integraciones premium',
          ],
        },
      ],
      icon: Zap,
      priceId: 'starter',
      buttonText: 'Seleccionar Starter',
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '€249',
      priceDetail: 'por mes',
      description: 'Para empresas en crecimiento que necesitan más',
      tagline: 'El más elegido',
      features: [
        {
          category: 'Equipo',
          items: [
            'Hasta 25 usuarios',
            'Hasta 3 organizaciones',
            'Soporte prioritario 24h',
            'Onboarding guiado 30min',
          ],
        },
        {
          category: 'Funcionalidades',
          items: [
            'CRM avanzado (5000 leads/mes)',
            'Pipeline drag & drop',
            'Todas las fases (1-4)',
            'OKRs ilimitados',
            'KPIs ilimitados',
            '8 análisis IA/mes',
            'Todas las herramientas IA',
          ],
        },
        {
          category: 'Premium',
          items: [
            'Análisis competitivo IA',
            'Brand Kit',
            'Web Generator',
            'Agenda Global multi-org',
          ],
        },
        {
          category: 'Integraciones',
          items: [
            'Exportar Excel/PDF',
            'Google Calendar',
            'Outlook',
            'Slack',
            'HubSpot',
            'Zapier',
          ],
        },
      ],
      icon: Rocket,
      priceId: 'professional',
      popular: true,
      highlighted: true,
      buttonText: 'Seleccionar Professional',
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '€499',
      priceDetail: 'por mes',
      description: 'Solución completa para grandes organizaciones',
      tagline: 'Máxima potencia',
      features: [
        {
          category: 'Equipo',
          items: [
            'Usuarios ilimitados',
            'Organizaciones ilimitadas',
            'Soporte dedicado 24/7',
            'Account Manager',
            'Onboarding premium 2h',
            'SLA 99.9%',
          ],
        },
        {
          category: 'Todo de Professional +',
          items: [
            'Leads ilimitados',
            'Análisis IA ilimitados',
            '5 herramientas enterprise extra',
            'IA predictiva avanzada',
            'Pipelines personalizados',
            'Custom KPIs',
          ],
        },
        {
          category: 'Enterprise Features',
          items: [
            'White label',
            'API Rest completa',
            'Webhooks personalizados',
            'Integraciones custom',
            'Multi-currency',
            'Reportes personalizados',
          ],
        },
      ],
      icon: Crown,
      priceId: 'enterprise',
      buttonText: 'Seleccionar Enterprise',
    },
    {
      id: 'contact',
      name: 'Plan Personalizado',
      price: 'A medida',
      priceDetail: 'Contacta con ventas',
      description: 'Solución diseñada específicamente para tus necesidades',
      tagline: 'Tu plan único',
      features: [
        {
          category: '¿Necesitas algo especial?',
          items: [
            'Configuración personalizada',
            'Integraciones custom',
            'Features exclusivos',
            'Soporte premium dedicado',
            'SLA personalizado',
            'Formación avanzada',
          ],
        },
        {
          category: 'Ideal para',
          items: [
            'Empresas con >100 usuarios',
            'Necesidades muy específicas',
            'Integraciones con sistemas propietarios',
            'Requerimientos de compliance',
            'Despliegue on-premise',
          ],
        },
      ],
      icon: Mail,
      priceId: null,
      buttonText: 'Contactar Ventas',
      buttonVariant: 'outline',
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
    // Contact plan - open email
    if (planId === 'contact') {
      window.location.href = 'mailto:info@optimus-k.com?subject=Consulta Plan Personalizado OPTIMUS-K&body=Hola, me gustaría información sobre un plan personalizado para mi empresa.';
      return;
    }

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

    setSelectedPlan(planId);
    setLoading(true);

    try {
      if (planId === 'trial') {
        // Activar trial
        const { error } = await supabase
          .from('organizations')
          .update({
            plan: 'trial',
            trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentOrganizationId);

        if (error) throw error;

        // Registrar uso del trial
        await supabase
          .from('trial_email_registry')
          .insert({
            email: user.email,
            used_at: new Date().toISOString(),
          });

        toast.success('¡Trial activado!', {
          description: 'Tienes 14 días para probar todas las funciones',
        });

        navigate('/home');
      } else {
        // Planes de pago - redirigir a checkout
        const { data, error } = await supabase.functions.invoke('create-checkout', {
          body: {
            priceId: planId,
            organizationId: currentOrganizationId,
            successUrl: `${window.location.origin}/onboarding/success`,
            cancelUrl: `${window.location.origin}/select-plan`,
          },
        });

        if (error) throw error;

        if (data.url) {
          window.location.href = data.url;
        }
      }
    } catch (error: unknown) {
      // ✅ CORREGIDO: error: unknown en vez de error: any
      console.error('Error selecting plan:', error);
      const errorMessage = error instanceof Error ? error.message : 'Por favor intenta de nuevo';
      toast.error('Error al procesar el pago', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <BackButton className="mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Elige el plan perfecto para tu equipo
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Todos los planes incluyen actualizaciones gratuitas y soporte especializado
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onSelect={handleSelectPlan}
              isLoading={loading && selectedPlan === plan.id}
              isDisabled={plan.id === 'trial' && !canUseTrial}
            />
          ))}
        </div>

        {/* FAQ or additional info */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              ¿Necesitas ayuda para elegir?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Nuestro equipo está disponible para ayudarte a encontrar el plan ideal para tu empresa.
            </p>
            <Button variant="outline" asChild>
              <a href="mailto:info@optimus-k.com">
                Contactar con el equipo
                <Mail className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function PlanCard({
  plan,
  onSelect,
  isLoading,
  isDisabled,
}: {
  plan: Plan;
  onSelect: (planId: string) => void;
  isLoading: boolean;
  isDisabled: boolean;
}) {
  const Icon = plan.icon;
  const isContact = plan.id === 'contact';

  return (
    <Card className={cn(
      'relative overflow-hidden transition-all hover:shadow-xl',
      plan.highlighted && 'border-2 border-primary shadow-lg scale-105 lg:scale-110',
      isContact && 'bg-gradient-to-br from-primary/5 to-primary/10'
    )}>
      {/* Popular badge */}
      {plan.popular && (
        <div className="absolute top-0 right-0">
          <Badge className="rounded-bl-lg rounded-tr-none py-1 px-3 bg-primary">
            <Star className="h-3 w-3 mr-1 fill-current" />
            Más popular
          </Badge>
        </div>
      )}

      {/* Tagline */}
      {plan.tagline && (
        <div className="absolute top-0 left-0">
          <Badge variant="secondary" className="rounded-br-lg rounded-tl-none text-xs">
            {plan.tagline}
          </Badge>
        </div>
      )}

      <CardHeader className="pt-8">
        <div className="flex items-center justify-center mb-4">
          <div className={cn(
            'p-4 rounded-full',
            plan.highlighted ? 'bg-primary/10' : 'bg-secondary'
          )}>
            <Icon className={cn(
              'h-8 w-8',
              plan.highlighted && 'text-primary'
            )} />
          </div>
        </div>

        <CardTitle className="text-center text-2xl">{plan.name}</CardTitle>
        
        <div className="text-center my-4">
          <div className="text-4xl font-bold">{plan.price}</div>
          <div className="text-sm text-muted-foreground">{plan.priceDetail}</div>
        </div>

        <CardDescription className="text-center">
          {plan.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {plan.features.map((featureGroup, index) => (
          <div key={index}>
            <h4 className="font-semibold text-sm mb-3 text-primary">
              {featureGroup.category}
            </h4>
            <ul className="space-y-2">
              {featureGroup.items.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className={cn(
                    'h-4 w-4 mt-0.5 flex-shrink-0',
                    plan.highlighted ? 'text-primary' : 'text-success'
                  )} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>

      <CardFooter>
        <Button
          onClick={() => onSelect(plan.id)}
          disabled={isDisabled || isLoading}
          variant={plan.buttonVariant || 'default'}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              {plan.buttonText}
              {!isContact && <ArrowRight className="ml-2 h-4 w-4" />}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default SelectPlan;
