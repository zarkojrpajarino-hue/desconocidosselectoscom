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
    }

    // Log session ID for debugging
    if (sessionId) {
      console.log('[Pricing] Stripe session ID:', sessionId);
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Back Button */}
      <div className="container mx-auto pt-8 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>

      <PricingPlans />
    </div>
  );
};

export default Pricing;
