import { useState } from 'react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';

interface LeaderValidationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (feedback: LeaderFeedback) => Promise<void>;
  taskTitle: string;
  executorName: string;
}

export interface LeaderFeedback {
  whatWentWell: string;
  whatToImprove: string;
  additionalComments: string;
  rating: number;
}

const LeaderValidationModal = ({ 
  open, 
  onOpenChange, 
  onSubmit, 
  taskTitle,
  executorName 
}: LeaderValidationModalProps) => {
  const [whatWentWell, setWhatWentWell] = useState('');
  const [whatToImprove, setWhatToImprove] = useState('');
  const [additionalComments, setAdditionalComments] = useState('');
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!whatWentWell.trim() || !whatToImprove.trim() || rating === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        whatWentWell,
        whatToImprove,
        additionalComments,
        rating
      });
      
      // Reset form
      setWhatWentWell('');
      setWhatToImprove('');
      setAdditionalComments('');
      setRating(0);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Validar Tarea"
      description={`Proporciona feedback para ${executorName} sobre la tarea: "${taskTitle}"`}
      className="max-w-2xl"
    >

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ¿Qué hizo bien? */}
          <div className="space-y-2">
            <Label htmlFor="whatWentWell">
              ¿Qué hizo bien? <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="whatWentWell"
              value={whatWentWell}
              onChange={(e) => setWhatWentWell(e.target.value)}
              placeholder="Destaca los aspectos positivos del trabajo realizado..."
              className="min-h-[100px]"
              required
            />
          </div>

          {/* ¿Qué puede mejorar? */}
          <div className="space-y-2">
            <Label htmlFor="whatToImprove">
              ¿Qué puede mejorar? <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="whatToImprove"
              value={whatToImprove}
              onChange={(e) => setWhatToImprove(e.target.value)}
              placeholder="Sugiere áreas de mejora de forma constructiva..."
              className="min-h-[100px]"
              required
            />
          </div>

          {/* Comentarios adicionales */}
          <div className="space-y-2">
            <Label htmlFor="additionalComments">
              Comentarios adicionales
            </Label>
            <Textarea
              id="additionalComments"
              value={additionalComments}
              onChange={(e) => setAdditionalComments(e.target.value)}
              placeholder="Cualquier otro comentario o sugerencia..."
              className="min-h-[80px]"
            />
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label>
              Valoración general <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition-all hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {rating === 0 ? 'Selecciona una valoración' : `${rating}/5`}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                !whatWentWell.trim() || 
                !whatToImprove.trim() || 
                rating === 0 || 
                isSubmitting
              }
            >
              {isSubmitting ? 'Validando...' : 'Validar Tarea'}
            </Button>
          </div>
        </form>
    </ResponsiveModal>
  );
};

export default LeaderValidationModal;
