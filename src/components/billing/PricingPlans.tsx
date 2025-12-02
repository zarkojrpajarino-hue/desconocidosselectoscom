import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { PLAN_LIMITS, PLAN_PRICES } from "@/constants/subscriptionLimits";

const plans = [
  {
    name: "Starter",
    price: `€${PLAN_PRICES.starter}`,
    priceId: "STRIPE_PRICE_STARTER",
    description: "Para equipos pequeños empezando",
    features: [
      { text: `Hasta ${PLAN_LIMITS.starter.max_users} usuarios`, included: true },
      { text: `${PLAN_LIMITS.starter.max_leads_per_month.toLocaleString()} leads/mes`, included: true },
      { text: `${PLAN_LIMITS.starter.max_ai_analysis_per_month} análisis IA/mes`, included: true },
      { text: "CRM completo", included: true },
      { text: `${PLAN_LIMITS.starter.tasks_per_phase_per_user} tareas/fase/usuario`, included: true },
      { text: `${PLAN_LIMITS.starter.max_objectives} OKRs trimestrales`, included: true },
      { text: "Exportar CSV", included: true },
      { text: "Exportar Excel/PDF", included: false },
      { text: "Herramientas estratégicas IA", included: false },
      { text: "Inteligencia competitiva", included: false },
      { text: "Integraciones", included: false },
      { text: "Soporte email (48h)", included: true },
    ],
    ideal: "Startups 3-10 personas",
  },
  {
    name: "Professional",
    price: `€${PLAN_PRICES.professional}`,
    priceId: "STRIPE_PRICE_PROFESIONAL",
    description: "Para empresas en crecimiento",
    popular: true,
    features: [
      { text: `Hasta ${PLAN_LIMITS.professional.max_users} usuarios`, included: true },
      { text: "Leads ilimitados", included: true },
      { text: `${PLAN_LIMITS.professional.max_ai_analysis_per_month} análisis IA/mes`, included: true },
      { text: "CRM avanzado con scoring", included: true },
      { text: "Tareas ilimitadas", included: true },
      { text: "OKRs ilimitados", included: true },
      { text: "Exportar CSV, Excel y PDF", included: true },
      { text: "Herramientas estratégicas IA", included: true },
      { text: "Inteligencia competitiva", included: true },
      { text: "Integraciones (Zapier, Calendar)", included: true },
      { text: "API acceso", included: true },
      { text: "Soporte prioritario (24h)", included: true },
    ],
    ideal: "PYMES 10-25 personas",
  },
  {
    name: "Enterprise",
    price: `€${PLAN_PRICES.enterprise}`,
    priceId: "STRIPE_PRICE_ENTERPRISE",
    description: "Para organizaciones grandes",
    features: [
      { text: "Usuarios ilimitados", included: true },
      { text: "Todo ilimitado", included: true },
      { text: "Generaciones IA ilimitadas", included: true },
      { text: "White-label (tu marca)", included: true },
      { text: "Account manager dedicado", included: true },
      { text: "Onboarding personalizado (2h)", included: true },
      { text: "Soporte 24/7 telefónico", included: true },
      { text: "SLA 99.9%", included: true },
      { text: "API completa", included: true },
      { text: "Custom features bajo demanda", included: true },
      { text: "Multi-organización", included: true },
      { text: "Auditoría y compliance", included: true },
    ],
    ideal: "Empresas 25+ personas",
  },
];

export function PricingPlans() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceKey: string, planName: string) => {
    setLoading(priceKey);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast.error('Debes estar autenticado para suscribirte');
        setLoading(null);
        return;
      }

      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (rolesError || !userRoles?.organization_id) {
        toast.error('No se encontró tu organización');
        setLoading(null);
        return;
      }

      console.log(`[PricingPlans] Creating checkout for plan: ${planName}`);

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          planName: planName.toLowerCase(),
          organizationId: userRoles.organization_id,
        },
      });

      if (error) {
        console.error('Checkout error:', error);
        setLoading(null);
        throw new Error(error.message);
      }

      if (!data?.url) {
        setLoading(null);
        throw new Error('No se recibió URL de checkout');
      }

      console.log('[PricingPlans] Redirecting to Stripe...');
      window.open(data.url, '_blank');
      
      setLoading(null);
      toast.success('Redirigiendo a Stripe. Si no se abre, verifica que los pop-ups estén permitidos.');

    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error(error.message || 'Error al procesar el pago. Intenta de nuevo.');
      setLoading(null);
    }
  };

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">
            Elige tu Plan
          </h2>
          <p className="text-xl text-muted-foreground">
            Comienza gratis por 14 días. Sin tarjeta requerida.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`p-8 relative flex flex-col transition-all duration-300 hover:scale-105 ${
                plan.popular 
                  ? 'border-primary border-2 shadow-2xl scale-105' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 shadow-lg">
                  <Sparkles className="w-4 h-4" />
                  Más Popular
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {plan.description}
                </p>
                <div className="mb-2">
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-lg">/mes</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  💡 {plan.ideal}
                </p>
              </div>

              {/* Features List */}
              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={`text-sm ${!feature.included ? 'text-muted-foreground/50' : ''}`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                className={`w-full h-12 text-base ${
                  plan.popular 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                    : ''
                }`}
                variant={plan.popular ? 'default' : 'outline'}
                onClick={() => handleSubscribe(plan.priceId, plan.name)}
                disabled={loading !== null}
              >
                {loading === plan.priceId ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando...
                  </span>
                ) : (
                  <>Elegir {plan.name}</>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-4">
                Sin permanencia · Cancela cuando quieras
              </p>
            </Card>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            💳 Aceptamos todas las tarjetas · 🔒 Pago seguro con Stripe
          </p>
          <p className="text-xs text-muted-foreground">
            ¿Necesitas un plan personalizado? <a href="mailto:support@optimus-k.com" className="text-primary underline hover:text-primary/80">Contáctanos</a>
          </p>
        </div>
      </div>
    </div>
  );
}
