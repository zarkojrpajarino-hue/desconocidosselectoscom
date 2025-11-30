import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const GENERATION_TIPS = [
  "💡 Tip: Cada usuario recibirá 12 tareas personalizadas al unirse según su rol",
  "🎯 Consejo: Genera tu OKR semanal con IA basado en tus tareas (máx 2 en plan gratuito)",
  "📊 Recuerda: Actualiza tus KPIs semanalmente para insights precisos",
  "🤝 Pro-tip: Las tareas colaborativas aumentan la productividad del equipo",
  "🔥 Dato: Las herramientas de marketing se personalizan con IA para tu empresa",
  "⚡ Tip: El pipeline se adapta automáticamente a tu proceso de ventas",
];

interface GenerationStep {
  label: string;
  completed: boolean;
}

const GeneratingWorkspace = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const organizationId = searchParams.get("org");

  const [progress, setProgress] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);
  const [steps, setSteps] = useState<GenerationStep[]>([
    { label: "Creando estructura de base de datos", completed: false },
    { label: "Configurando OKRs estratégicos", completed: false },
    { label: "Adaptando pipeline de CRM a tu proceso", completed: false },
    { label: "Generando herramientas de marketing con IA", completed: false },
    { label: "Preparando métricas y KPIs", completed: false },
    { label: "Finalizando configuración", completed: false },
  ]);

  useEffect(() => {
    if (!organizationId) {
      toast.error("ID de organización no válido");
      navigate("/login");
      return;
    }

    // Rotar tips cada 4 segundos
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % GENERATION_TIPS.length);
    }, 4000);

    // Simular progreso de pasos
    const stepInterval = setInterval(() => {
      setSteps((prevSteps) => {
        const nextIncomplete = prevSteps.findIndex((s) => !s.completed);
        if (nextIncomplete !== -1) {
          const updated = [...prevSteps];
          updated[nextIncomplete] = { ...updated[nextIncomplete], completed: true };
          return updated;
        }
        return prevSteps;
      });
    }, 3000);

    // Actualizar progreso suavemente
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 95) return prev + 1;
        return prev;
      });
    }, 200);

    // Polling para verificar estado de generación
    const checkGeneration = setInterval(async () => {
      try {
        const { data: org, error } = await supabase
          .from("organizations")
          .select("ai_generation_status, ai_generation_error")
          .eq("id", organizationId)
          .single();

        if (error) throw error;

        if (org.ai_generation_status === "completed") {
          clearInterval(checkGeneration);
          clearInterval(stepInterval);
          clearInterval(progressInterval);
          clearInterval(tipInterval);
          
          // Completar todos los pasos
          setSteps((prev) => prev.map((s) => ({ ...s, completed: true })));
          setProgress(100);
          
          setTimeout(() => {
            toast.success("¡Tu workspace está listo!");
            navigate("/dashboard");
          }, 1000);
        } else if (org.ai_generation_status === "failed") {
          clearInterval(checkGeneration);
          toast.error("Error en la generación. Redirigiendo...");
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Error checking generation:", error);
      }
    }, 3000);

    return () => {
      clearInterval(tipInterval);
      clearInterval(stepInterval);
      clearInterval(progressInterval);
      clearInterval(checkGeneration);
    };
  }, [organizationId, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 space-y-8 shadow-2xl">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <Sparkles className="h-16 w-16 text-primary animate-pulse" />
              <Loader2 className="h-16 w-16 text-primary/40 animate-spin absolute top-0 left-0" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Generando tu Workspace Personalizado
            </h1>
            <p className="text-muted-foreground">
              Nuestro AI está adaptando OPTIMUS-K específicamente para tu negocio...
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Progreso General</span>
            <span className="text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                step.completed
                  ? "bg-primary/10 border border-primary/20"
                  : "bg-muted/50"
              }`}
            >
              {step.completed ? (
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
              ) : (
                <Loader2 className="h-5 w-5 text-muted-foreground animate-spin flex-shrink-0" />
              )}
              <span
                className={`text-sm ${
                  step.completed ? "text-foreground font-medium" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Rotating Tips */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-lg border border-primary/20">
          <p className="text-sm text-center font-medium animate-pulse">
            {GENERATION_TIPS[currentTip]}
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>⏱️ Tiempo estimado: 10-20 segundos</p>
          <p className="mt-1">No cierres esta ventana</p>
        </div>
      </Card>
    </div>
  );
};

export default GeneratingWorkspace;
