import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { toast } from 'sonner';

interface TaskFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  feedbackType: 'to_leader' | 'to_collaborator';
  leaderName?: string;
  collaboratorName?: string;
  onSubmit: (feedback: FeedbackData) => Promise<void>;
}

interface FeedbackData {
  whatWentWell: string;
  metDeadlines: 'always' | 'almost_always' | 'sometimes' | 'rarely' | 'never';
  whatToImprove: string;
  wouldRecommend: 'definitely_yes' | 'probably_yes' | 'not_sure' | 'probably_no' | 'definitely_no';
  rating: number;
}

const TaskFeedbackModal = ({
  open,
  onOpenChange,
  taskTitle,
  feedbackType,
  leaderName,
  collaboratorName,
  onSubmit,
}: TaskFeedbackModalProps) => {
  const [whatWentWell, setWhatWentWell] = useState('');
  const [metDeadlines, setMetDeadlines] = useState<FeedbackData['metDeadlines'] | ''>('');
  const [whatToImprove, setWhatToImprove] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState<FeedbackData['wouldRecommend'] | ''>('');
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const personName = feedbackType === 'to_leader' ? leaderName : collaboratorName;
  const roleText = feedbackType === 'to_leader' ? 'líder' : 'colaborador';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!whatWentWell.trim() || !metDeadlines || !whatToImprove.trim() || !wouldRecommend || rating === 0) {
      toast.error('Por favor completa todas las preguntas', {
        description: 'Todos los campos son obligatorios para continuar'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        whatWentWell,
        metDeadlines,
        whatToImprove,
        wouldRecommend,
        rating,
      });
      
      // Reset form
      setWhatWentWell('');
      setMetDeadlines('');
      setWhatToImprove('');
      setWouldRecommend('');
      setRating(0);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Error al enviar feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deadlineOptions = [
    { value: 'always', label: 'Sí, siempre', emoji: '✅' },
    { value: 'almost_always', label: 'Casi siempre', emoji: '👍' },
    { value: 'sometimes', label: 'A veces', emoji: '⚠️' },
    { value: 'rarely', label: 'Raramente', emoji: '⏰' },
    { value: 'never', label: 'No', emoji: '❌' },
  ];

  const recommendOptions = [
    { value: 'definitely_yes', label: 'Definitivamente sí', emoji: '🌟' },
    { value: 'probably_yes', label: 'Probablemente sí', emoji: '👍' },
    { value: 'not_sure', label: 'No estoy seguro', emoji: '🤔' },
    { value: 'probably_no', label: 'Probablemente no', emoji: '👎' },
    { value: 'definitely_no', label: 'Definitivamente no', emoji: '❌' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Feedback sobre {personName} ({roleText})
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Tarea: <strong>{taskTitle}</strong>
          </p>
          <p className="text-sm text-amber-600 dark:text-amber-500 mt-2 font-medium">
            ⚠️ Todos los campos son obligatorios
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Pregunta 1: ¿Qué hizo bien? */}
          <div className="space-y-2">
            <Label htmlFor="whatWentWell" className="text-base font-semibold">
              1. ¿Qué hizo bien {personName}? *
            </Label>
            <Textarea
              id="whatWentWell"
              value={whatWentWell}
              onChange={(e) => setWhatWentWell(e.target.value)}
              placeholder={`Destaca los aspectos positivos del trabajo de ${personName}...`}
              rows={4}
              required
              className="resize-none"
            />
          </div>

          {/* Pregunta 2: ¿Cumplió tiempos? - BOTONES */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              2. ¿Cumplió los tiempos acordados? *
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {deadlineOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={metDeadlines === option.value ? 'default' : 'outline'}
                  onClick={() => setMetDeadlines(option.value as any)}
                  className={`h-auto py-3 flex flex-col gap-1 ${
                    metDeadlines === option.value ? 'bg-gradient-primary' : ''
                  }`}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="text-xs text-center">{option.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Pregunta 3: ¿Qué puede mejorar? */}
          <div className="space-y-2">
            <Label htmlFor="whatToImprove" className="text-base font-semibold">
              3. ¿Qué puede mejorar {personName}? *
            </Label>
            <Textarea
              id="whatToImprove"
              value={whatToImprove}
              onChange={(e) => setWhatToImprove(e.target.value)}
              placeholder="Sugiere áreas de mejora de forma constructiva..."
              rows={4}
              required
              className="resize-none"
            />
          </div>

          {/* Pregunta 4: ¿Recomendarías? - BOTONES */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              4. ¿Recomendarías trabajar con {personName} de nuevo? *
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              {recommendOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={wouldRecommend === option.value ? 'default' : 'outline'}
                  onClick={() => setWouldRecommend(option.value as any)}
                  className={`h-auto py-3 flex flex-col gap-1 ${
                    wouldRecommend === option.value ? 'bg-gradient-primary' : ''
                  }`}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="text-xs text-center">{option.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Pregunta 5: Valoración - ESTRELLAS */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              5. Valoración general *
            </Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`w-12 h-12 transition-colors ${
                      (hoveredStar >= star || rating >= star)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-4 text-lg font-semibold">
                {rating > 0 ? `${rating}/5` : 'Selecciona valoración'}
              </span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                !whatWentWell.trim() || 
                !metDeadlines || 
                !whatToImprove.trim() || 
                !wouldRecommend || 
                rating === 0 || 
                isSubmitting
              }
              className="flex-1 bg-gradient-primary"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskFeedbackModal;
