import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useChurnTracking } from '@/hooks/useChurnTracking';
import { Gift, Sparkles, TrendingDown, AlertTriangle } from 'lucide-react';

interface ChurnSurveyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: string;
  currentMRR: number;
  onConfirmCancel: () => void;
}

export function ChurnSurveyModal({
  open,
  onOpenChange,
  currentPlan,
  currentMRR,
  onConfirmCancel,
}: ChurnSurveyModalProps) {
  const { submitChurnSurvey } = useChurnTracking();
  
  const [step, setStep] = useState<'reason' | 'retention' | 'confirmed'>('reason');
  const [reason, setReason] = useState<string>('');
  const [reasonDetail, setReasonDetail] = useState('');
  const [missingFeatures, setMissingFeatures] = useState<string[]>([]);
  const [competitorName, setCompetitorName] = useState('');
  const [npsScore, setNpsScore] = useState<number | null>(null);

  const reasons = [
    { value: 'too_expensive', label: 'Muy caro / No cabe en presupuesto', icon: '💰' },
    { value: 'missing_feature', label: 'Falta funcionalidad que necesito', icon: '🔧' },
    { value: 'too_complex', label: 'Demasiado complejo de usar', icon: '🤯' },
    { value: 'found_alternative', label: 'Encontré una alternativa mejor', icon: '🔄' },
    { value: 'no_longer_needed', label: 'Ya no necesito el servicio', icon: '✋' },
    { value: 'other', label: 'Otro motivo', icon: '💭' },
  ];

  const commonFeatures = [
    'Integraciones con más herramientas',
    'App móvil nativa',
    'Reportes personalizados',
    'API más robusta',
    'Soporte prioritario',
    'Onboarding personalizado',
  ];

  const getRetentionOffer = () => {
    switch (reason) {
      case 'too_expensive':
        return {
          type: 'discount_50',
          title: '¡Espera! Te ofrecemos 50% de descuento',
          description: `Mantén tu plan ${currentPlan} por solo €${(currentMRR / 2).toFixed(2)}/mes durante 6 meses.`,
          discount: 50,
        };
      case 'missing_feature':
        return {
          type: 'free_month',
          title: 'Queremos ayudarte',
          description: 'Te damos 1 mes gratis mientras trabajamos en las funcionalidades que necesitas.',
          discount: 100,
        };
      case 'too_complex':
        return {
          type: 'onboarding',
          title: 'Te ayudamos a empezar',
          description: 'Te asignamos un especialista para onboarding personalizado + 30% de descuento por 3 meses.',
          discount: 30,
        };
      default:
        return null;
    }
  };

  const handleSubmitReason = () => {
    const offer = getRetentionOffer();
    if (offer) {
      setStep('retention');
    } else {
      handleFinalSubmit(false);
    }
  };

  const handleAcceptOffer = () => {
    const offer = getRetentionOffer();
    submitChurnSurvey({
      plan_before_cancel: currentPlan,
      mrr_lost: currentMRR,
      reason,
      reason_detail: reasonDetail,
      missing_features: missingFeatures.length > 0 ? missingFeatures : undefined,
      retention_offer_shown: true,
      retention_offer_type: offer?.type,
      retention_offer_accepted: true,
      discount_percentage: offer?.discount,
      nps_score: npsScore ?? undefined,
      competitor_name: competitorName || undefined,
    });
    onOpenChange(false);
  };

  const handleFinalSubmit = (offerShown: boolean) => {
    const offer = getRetentionOffer();
    submitChurnSurvey({
      plan_before_cancel: currentPlan,
      mrr_lost: currentMRR,
      reason,
      reason_detail: reasonDetail,
      missing_features: missingFeatures.length > 0 ? missingFeatures : undefined,
      retention_offer_shown: offerShown,
      retention_offer_type: offer?.type,
      retention_offer_accepted: false,
      nps_score: npsScore ?? undefined,
      competitor_name: competitorName || undefined,
    });
    setStep('confirmed');
    onConfirmCancel();
  };

  const toggleFeature = (feature: string) => {
    setMissingFeatures(prev =>
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const renderReasonStep = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-destructive" />
          ¿Por qué quieres cancelar?
        </DialogTitle>
        <DialogDescription>
          Tu feedback nos ayuda a mejorar. Selecciona el motivo principal.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <RadioGroup value={reason} onValueChange={setReason}>
          {reasons.map((r) => (
            <div key={r.value} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value={r.value} id={r.value} />
              <Label htmlFor={r.value} className="flex-1 cursor-pointer">
                <span className="mr-2">{r.icon}</span>
                {r.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        {reason === 'missing_feature' && (
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
            <Label className="text-sm font-medium">¿Qué funcionalidades te faltan?</Label>
            <div className="grid grid-cols-2 gap-2">
              {commonFeatures.map((feature) => (
                <div key={feature} className="flex items-center space-x-2">
                  <Checkbox
                    id={feature}
                    checked={missingFeatures.includes(feature)}
                    onCheckedChange={() => toggleFeature(feature)}
                  />
                  <Label htmlFor={feature} className="text-sm cursor-pointer">
                    {feature}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {reason === 'found_alternative' && (
          <div className="space-y-2">
            <Label>¿Cuál alternativa elegiste?</Label>
            <Textarea
              placeholder="Nombre de la herramienta..."
              value={competitorName}
              onChange={(e) => setCompetitorName(e.target.value)}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>Cuéntanos más (opcional)</Label>
          <Textarea
            placeholder="¿Hay algo más que quieras compartir?"
            value={reasonDetail}
            onChange={(e) => setReasonDetail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>¿Qué probabilidad hay de que nos recomiendes? (0-10)</Label>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
              <Button
                key={score}
                variant={npsScore === score ? 'default' : 'outline'}
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => setNpsScore(score)}
              >
                {score}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          Volver
        </Button>
        <Button 
          variant="destructive" 
          onClick={handleSubmitReason}
          disabled={!reason}
        >
          Continuar
        </Button>
      </div>
    </>
  );

  const renderRetentionStep = () => {
    const offer = getRetentionOffer();
    if (!offer) return null;

    return (
      <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            {offer.title}
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          <Alert className="border-primary/50 bg-primary/5">
            <Sparkles className="h-4 w-4 text-primary" />
            <AlertTitle>Oferta especial para ti</AlertTitle>
            <AlertDescription className="mt-2">
              {offer.description}
            </AlertDescription>
          </Alert>

          <div className="mt-6 p-4 bg-muted/30 rounded-lg text-center">
            <Badge className="text-lg px-4 py-1" variant="default">
              {offer.discount}% descuento
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              Válido solo ahora
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={handleAcceptOffer} className="w-full">
            <Gift className="h-4 w-4 mr-2" />
            Aceptar oferta y quedarse
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => handleFinalSubmit(true)}
            className="w-full text-muted-foreground"
          >
            No gracias, quiero cancelar
          </Button>
        </div>
      </>
    );
  };

  const renderConfirmedStep = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Suscripción cancelada
        </DialogTitle>
      </DialogHeader>

      <div className="py-6 text-center">
        <p className="text-muted-foreground">
          Lamentamos verte ir. Tu suscripción estará activa hasta el final del período de facturación actual.
        </p>
        <p className="mt-4 text-sm">
          ¿Cambiaste de opinión? Siempre puedes volver a suscribirte.
        </p>
      </div>

      <Button onClick={() => onOpenChange(false)} className="w-full">
        Cerrar
      </Button>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === 'reason' && renderReasonStep()}
        {step === 'retention' && renderRetentionStep()}
        {step === 'confirmed' && renderConfirmedStep()}
      </DialogContent>
    </Dialog>
  );
}
