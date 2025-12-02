import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

const plans = [
  {
    name: "Starter",
    price: "€129",
    priceId: "STRIPE_PRICE_STARTER", // Se reemplazará con env var
    description: "Para equipos pequeños empezando",
    features: [
      "Hasta 10 usuarios",
      "2,000 leads/mes",
      "20 generaciones IA/mes",
      "CRM completo",
      "50 tareas personalizadas",
      "10 OKRs trimestrales",
      "Reportes básicos",
      "Soporte email (48h)",
    ],
    ideal: "Startups 3-10 personas",
  },
  {
    name: "Professional",
    price: "€249",
    priceId: "STRIPE_PRICE_PROFESIONAL", // Se reemplazará con env var
    description: "Para empresas en crecimiento",
    popular: true,
    features: [
      "Hasta 25 usuarios",
      "Leads ilimitados",
      "100 generaciones IA/mes",
      "CRM avanzado",
      "Automatizaciones",
      "Integraciones (Zapier, Email)",
      "Reportes avanzados",
      "Soporte prioritario (24h)",
      "API acceso",
    ],
    ideal: "PYMES 10-25 personas",
  },
  {
    name: "Enterprise",
    price: "€499",
    priceId: "STRIPE_PRICE_ENTERPRISE", // Se reemplazará con env var
    description: "Para organizaciones grandes",
    features: [
      "Usuarios ilimitados",
      "Todo ilimitado",
      "Generaciones IA ilimitadas",
      "White-label (tu marca)",
      "Account manager dedicado",
      "Onboarding personalizado (2h)",
      "Soporte 24/7",
      "SLA 99.9%",
      "API completa",
      "Custom features bajo demanda",
    ],
    ideal: "Empresas 25+ personas",
  },
];

// Helper para obtener el price_id real desde secrets
async function getRealPriceId(planPriceKey: string): Promise<string | null> {
  try {
    // Los price IDs están en los secrets del backend
    // El edge function los usará directamente
    // Aquí solo necesitamos el KEY para pasarlo
    return planPriceKey;
  } catch (error) {
    console.error('Error getting price ID:', error);
    return null;
  }
}

export function PricingPlans() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceKey: string, planName: string) => {
    setLoading(priceKey);

    try {
      // Get current user & organization
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast.error('Debes estar autenticado para suscribirte');
        return;
      }

      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (rolesError || !userRoles?.organization_id) {
        toast.error('No se encontró tu organización');
        return;
      }

      console.log(`[PricingPlans] Creating checkout for plan: ${planName}`);

      // Create Stripe checkout session - send plan name instead of priceId
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          planName: planName.toLowerCase(),
          organizationId: userRoles.organization_id,
        },
      });

      if (error) {
        console.error('Checkout error:', error);
        throw new Error(error.message);
      }

      if (!data?.url) {
        throw new Error('No se recibió URL de checkout');
      }

      // Redirect to Stripe Checkout
      console.log('[PricingPlans] Redirecting to Stripe...');
      window.location.href = data.url;

    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error(error.message || 'Error al procesar el pago. Intenta de nuevo.');
    } finally {
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
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
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
