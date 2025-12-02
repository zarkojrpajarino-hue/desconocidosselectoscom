import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Check } from 'lucide-react';
import { PLAN_NAMES, PLAN_PRICES, getRecommendedUpgrade, PLAN_LIMITS, PlanType } from '@/constants/subscriptionLimits';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: PlanType;
  limitType: 'users' | 'leads' | 'okrs' | 'ai_analysis' | 'ai_tools' | 'phase' | 'feature';
  currentValue?: number;
  limitValue?: number;
  featureName?: string;
}

export function UpgradeModal({
  open,
  onOpenChange,
  currentPlan,
  limitType,
  currentValue,
  limitValue,
  featureName,
}: UpgradeModalProps) {
  const navigate = useNavigate();
  const recommendedPlan = getRecommendedUpgrade(currentPlan);

  if (!recommendedPlan) return null;

  const recommendedLimits = PLAN_LIMITS[recommendedPlan];
  const currentPlanName = PLAN_NAMES[currentPlan];
  const recommendedPlanName = PLAN_NAMES[recommendedPlan];
  const recommendedPrice = PLAN_PRICES[recommendedPlan];

  // Mensajes personalizados según el tipo de límite
  const messages = {
    users: {
      title: '👥 Límite de usuarios alcanzado',
      description: `Tu plan ${currentPlanName} permite hasta ${limitValue} usuarios. Actualmente tienes ${currentValue} usuarios.`,
      benefit: `Con ${recommendedPlanName}, podrás añadir hasta ${recommendedLimits.max_users === -1 ? 'usuarios ilimitados' : `${recommendedLimits.max_users} usuarios`}.`,
    },
    leads: {
      title: '🎯 Límite de leads alcanzado',
      description: `Tu plan ${currentPlanName} permite hasta ${limitValue} leads por mes. Actualmente tienes ${currentValue} leads este mes.`,
      benefit: `Con ${recommendedPlanName}, podrás gestionar ${recommendedLimits.max_leads_per_month === -1 ? 'leads ilimitados' : `hasta ${recommendedLimits.max_leads_per_month} leads`} por mes.`,
    },
    okrs: {
      title: '🎯 Límite de OKRs alcanzado',
      description: `Tu plan ${currentPlanName} permite hasta ${limitValue} objetivos. Actualmente tienes ${currentValue} objetivos.`,
      benefit: `Con ${recommendedPlanName}, podrás crear ${recommendedLimits.max_objectives === -1 ? 'objetivos ilimitados' : `hasta ${recommendedLimits.max_objectives} objetivos`}.`,
    },
    ai_analysis: {
      title: '🤖 Límite de análisis IA alcanzado',
      description: `Tu plan ${currentPlanName} permite ${limitValue} análisis IA por mes. Ya has usado ${currentValue} este mes.`,
      benefit: `Con ${recommendedPlanName}, podrás hacer ${recommendedLimits.max_ai_analysis_per_month === -1 ? 'análisis ilimitados' : `hasta ${recommendedLimits.max_ai_analysis_per_month} análisis`} por mes.`,
    },
    ai_tools: {
      title: '🛠️ Herramienta no disponible',
      description: `La herramienta "${featureName}" no está disponible en tu plan ${currentPlanName}.`,
      benefit: `Con ${recommendedPlanName}, desbloquearás ${recommendedLimits.max_ai_tools === -1 ? 'todas las herramientas' : `${recommendedLimits.max_ai_tools} herramientas`} estratégicas.`,
    },
    phase: {
      title: '🚀 Fase no disponible',
      description: `Tu plan ${currentPlanName} solo incluye ${Array.isArray(recommendedLimits.available_phases) ? `las fases ${recommendedLimits.available_phases.join(', ')}` : 'fases limitadas'}.`,
      benefit: `Con ${recommendedPlanName}, tendrás acceso a todas las fases de crecimiento.`,
    },
    feature: {
      title: '✨ Funcionalidad premium',
      description: `La funcionalidad "${featureName}" no está disponible en tu plan ${currentPlanName}.`,
      benefit: `Mejora tu plan para desbloquear esta y muchas más funcionalidades.`,
    },
  };

  const message = messages[limitType];

  // Features destacadas del plan recomendado
  const highlightedFeatures = [];
  
  if (recommendedLimits.max_users > PLAN_LIMITS[currentPlan].max_users || recommendedLimits.max_users === -1) {
    highlightedFeatures.push(`Hasta ${recommendedLimits.max_users === -1 ? '∞' : recommendedLimits.max_users} usuarios`);
  }
  
  if (recommendedLimits.max_leads_per_month > PLAN_LIMITS[currentPlan].max_leads_per_month || recommendedLimits.max_leads_per_month === -1) {
    highlightedFeatures.push(`${recommendedLimits.max_leads_per_month === -1 ? '∞' : `${recommendedLimits.max_leads_per_month}`} leads/mes`);
  }
  
  if (recommendedLimits.google_calendar && !PLAN_LIMITS[currentPlan].google_calendar) {
    highlightedFeatures.push('Integración Google Calendar');
  }
  
  if (recommendedLimits.available_phases.length > PLAN_LIMITS[currentPlan].available_phases.length) {
    highlightedFeatures.push('Todas las fases disponibles');
  }
  
  if (recommendedLimits.max_ai_tools > PLAN_LIMITS[currentPlan].max_ai_tools) {
    highlightedFeatures.push('Todas las herramientas IA');
  }

  const handleUpgrade = () => {
    navigate('/pricing');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <Badge variant="secondary" className="text-xs">
              Mejora recomendada
            </Badge>
          </div>
          <DialogTitle className="text-xl">{message.title}</DialogTitle>
          <DialogDescription className="text-left pt-2">
            {message.description}
          </DialogDescription>
        </DialogHeader>

        {/* Benefit Section */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 my-4">
          <p className="text-sm font-medium text-foreground">
            {message.benefit}
          </p>
        </div>

        {/* Plan Highlight */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-semibold text-lg">{recommendedPlanName}</h4>
              <p className="text-2xl font-bold text-primary">
                €{recommendedPrice}
                <span className="text-sm font-normal text-muted-foreground">/mes</span>
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2">
            {highlightedFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={handleUpgrade} className="w-full gap-2">
            Ver Planes y Mejorar
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
            Ahora no
          </Button>
        </div>

        {/* Trust Signal */}
        <p className="text-xs text-center text-muted-foreground">
          🔒 Pago seguro con Stripe • Cancela cuando quieras
        </p>
      </DialogContent>
    </Dialog>
  );
}
