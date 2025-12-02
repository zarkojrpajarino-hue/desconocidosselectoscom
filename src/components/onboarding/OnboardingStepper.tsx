import { cn } from "@/lib/utils";
import { 
  User, Building2, FileText, Package, TrendingUp, 
  Users, Target, Route, Flag, Check 
} from "lucide-react";

interface OnboardingStepperProps {
  currentStep: number;
  totalSteps: number;
  onStepClick: (step: number) => void;
  completedSteps: number[];
}

const STEPS = [
  { icon: User, label: "Cuenta" },
  { icon: Building2, label: "Empresa" },
  { icon: FileText, label: "Negocio" },
  { icon: Package, label: "Productos" },
  { icon: TrendingUp, label: "Comercial" },
  { icon: Users, label: "Equipo" },
  { icon: Target, label: "Competencia" },
  { icon: Route, label: "Journey" },
  { icon: Flag, label: "Objetivos" },
];

export const OnboardingStepper = ({ 
  currentStep, 
  totalSteps, 
  onStepClick,
  completedSteps 
}: OnboardingStepperProps) => {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between">
        {STEPS.slice(0, totalSteps).map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = completedSteps.includes(stepNumber);
          const isCurrent = currentStep === stepNumber;
          const isClickable = stepNumber <= Math.max(...completedSteps, currentStep);
          const Icon = step.icon;

          return (
            <div key={stepNumber} className="flex flex-col items-center flex-1">
              <div className="relative flex items-center w-full">
                {/* Línea conectora izquierda */}
                {index > 0 && (
                  <div 
                    className={cn(
                      "absolute left-0 right-1/2 h-0.5 top-5 -translate-y-1/2",
                      completedSteps.includes(stepNumber) || isCurrent
                        ? "bg-primary" 
                        : "bg-muted"
                    )}
                  />
                )}
                
                {/* Línea conectora derecha */}
                {index < totalSteps - 1 && (
                  <div 
                    className={cn(
                      "absolute left-1/2 right-0 h-0.5 top-5 -translate-y-1/2",
                      completedSteps.includes(stepNumber + 1)
                        ? "bg-primary" 
                        : "bg-muted"
                    )}
                  />
                )}

                {/* Círculo del paso */}
                <button
                  onClick={() => isClickable && onStepClick(stepNumber)}
                  disabled={!isClickable}
                  className={cn(
                    "relative z-10 mx-auto w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
                    isCurrent && "ring-4 ring-primary/20",
                    isCompleted 
                      ? "bg-primary text-primary-foreground" 
                      : isCurrent 
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    isClickable && !isCurrent && "hover:scale-110 cursor-pointer",
                    !isClickable && "cursor-not-allowed opacity-50"
                  )}
                >
                  {isCompleted && !isCurrent ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </button>
              </div>
              
              {/* Label */}
              <span 
                className={cn(
                  "text-xs mt-2 font-medium text-center",
                  isCurrent ? "text-primary" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
