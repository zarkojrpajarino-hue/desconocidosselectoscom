import { PricingPlans } from "@/components/billing/PricingPlans";
import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Pricing = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Handle redirect from Stripe
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const expired = searchParams.get('expired');
    const sessionId = searchParams.get('session_id');

    if (success === 'true') {
      toast.success('¡Suscripción activada con éxito! 🎉', {
        description: 'Tu plan ha sido activado. Redirigiendo al dashboard...',
      });
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } else if (canceled === 'true') {
      toast.info('Pago cancelado', {
        description: 'Puedes intentarlo de nuevo cuando quieras.',
      });
    } else if (expired === 'true') {
      // No mostrar toast aquí, ya se mostró desde useTrialExpiration
      console.log('[Pricing] User redirected due to expired trial');
    }

    // Log session ID for debugging
    if (sessionId) {
      console.log('[Pricing] Stripe session ID:', sessionId);
    }
  }, [searchParams, navigate]);

  const expired = searchParams.get('expired');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Back Button */}
      <div className="container mx-auto pt-8 px-4">
        {!expired && (
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        )}
      </div>

      {/* Mensaje de Trial Expirado */}
      {expired === 'true' && (
        <div className="container mx-auto px-4 mb-6">
          <div className="bg-gradient-to-r from-orange-500/10 via-red-500/10 to-pink-500/10 border-2 border-orange-500/50 rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold mb-2">⏰ Tu periodo de prueba ha finalizado</h2>
            <p className="text-muted-foreground text-lg">
              Elige un plan para continuar disfrutando de todas las funcionalidades
            </p>
          </div>
        </div>
      )}

      <PricingPlans />
    </div>
  );
};

export default Pricing;
