import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Clock, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PLAN_PRICES } from "@/constants/subscriptionLimits";

const OnboardingSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full mx-auto flex items-center justify-center mb-4">
            <Check className="h-10 w-10 text-green-600 dark:text-green-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2">¡Onboarding Completado!</h1>
          <p className="text-muted-foreground text-lg">
            Hemos recibido toda tu información
          </p>
        </div>

        <div className="space-y-6 text-left">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  ¿Qué sigue ahora?
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                  <li>✅ Hemos generado tu mega-prompt personalizado</li>
                  <li>📧 Te enviaremos un email de confirmación en 5 minutos</li>
                  <li>⏱️ En las próximas 2-3 horas, generaremos tu app con Lovable AI</li>
                  <li>🚀 Una vez lista, recibirás las credenciales de acceso</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                  Periodo de Prueba
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>14 días GRATIS.</strong> Luego podrás elegir tu plan:
                </p>
                <ul className="text-sm text-yellow-800 dark:text-yellow-200 mt-2 space-y-1">
                  <li>• <strong>Starter:</strong> €{PLAN_PRICES.starter}/mes - 10 usuarios</li>
                  <li>• <strong>Professional:</strong> €{PLAN_PRICES.professional}/mes - 25 usuarios + automatizaciones</li>
                  <li>• <strong>Enterprise:</strong> €{PLAN_PRICES.enterprise}/mes - Ilimitado + soporte dedicado</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Si tienes alguna pregunta, escríbenos a <strong>soporte@optimus-k.com</strong>
            </p>
            
            <Button
              onClick={() => navigate('/')}
              className="w-full"
            >
              Volver a Inicio
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OnboardingSuccess;