import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useNPS } from '@/hooks/useNPS';
import { Heart } from 'lucide-react';

interface NPSSurveyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerType?: 'scheduled' | 'manual' | 'milestone';
}

/**
 * NPS Survey Modal - Net Promoter Score
 * Score 0-10 with feedback
 */
export function NPSSurveyModal({ open, onOpenChange, triggerType = 'manual' }: NPSSurveyModalProps) {
  const { submitNPS, isSubmitting } = useNPS();
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [step, setStep] = useState<'score' | 'feedback' | 'thanks'>('score');

  const handleScoreSelect = (selectedScore: number) => {
    setScore(selectedScore);
    setStep('feedback');
  };

  const handleSubmit = () => {
    if (score === null) return;
    
    submitNPS({
      score,
      feedback: feedback.trim() || undefined,
      surveyContext: triggerType,
    });
    
    setStep('thanks');
    setTimeout(() => {
      onOpenChange(false);
      // Reset for next time
      setTimeout(() => {
        setScore(null);
        setFeedback('');
        setStep('score');
      }, 500);
    }, 2000);
  };

  const getScoreLabel = (s: number) => {
    if (s >= 9) return '¡Nos encanta! 😍';
    if (s >= 7) return 'Bien 👍';
    return 'Podemos mejorar 🤔';
  };

  const getFollowUpQuestion = () => {
    if (score === null) return '';
    if (score >= 9) return '¿Qué es lo que más te gusta?';
    if (score >= 7) return '¿Cómo podemos mejorar?';
    return '¿Qué te haría darnos un 10?';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {step === 'score' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                ¿Qué tan probable es que recomiendes OPTIMUS-K?
              </DialogTitle>
              <DialogDescription>
                En una escala de 0 a 10, donde 0 es "nada probable" y 10 es "muy probable"
              </DialogDescription>
            </DialogHeader>

            <div className="py-6">
              <div className="grid grid-cols-11 gap-2">
                {Array.from({ length: 11 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => handleScoreSelect(i)}
                    className="aspect-square rounded-lg border-2 border-muted hover:border-primary hover:bg-primary/10 transition-all font-medium text-lg flex items-center justify-center"
                  >
                    {i}
                  </button>
                ))}
              </div>

              <div className="flex justify-between text-xs text-muted-foreground mt-3">
                <span>Nada probable</span>
                <span>Muy probable</span>
              </div>
            </div>
          </>
        )}

        {step === 'feedback' && score !== null && (
          <>
            <DialogHeader>
              <DialogTitle>{getScoreLabel(score)}</DialogTitle>
              <DialogDescription>
                {getFollowUpQuestion()}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <Textarea
                placeholder="Tu feedback nos ayuda a mejorar... (opcional)"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('score')}
              >
                Atrás
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
          </>
        )}

        {step === 'thanks' && (
          <div className="py-12 text-center">
            <Heart className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-medium mb-2">¡Gracias por tu feedback!</h3>
            <p className="text-muted-foreground">
              Tu opinión nos ayuda a seguir mejorando
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
