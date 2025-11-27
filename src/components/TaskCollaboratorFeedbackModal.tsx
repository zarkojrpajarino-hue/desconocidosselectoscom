import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Star } from 'lucide-react';

interface TaskCollaboratorFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  onSubmit: (feedback: {
    q1: string;
    q2: string;
    q3: string;
    stars: number;
  }) => Promise<void>;
}

const TaskCollaboratorFeedbackModal = ({
  open,
  onOpenChange,
  taskTitle,
  onSubmit,
}: TaskCollaboratorFeedbackModalProps) => {
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');
  const [stars, setStars] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!q1.trim() || !q2.trim() || !q3.trim() || stars === 0) {
      toast.error('Por favor completa todas las preguntas y la valoración');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ q1, q2, q3, stars });
      setQ1('');
      setQ2('');
      setQ3('');
      setStars(0);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Feedback a Colaborador - {taskTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="q1">
              ¿Qué aspectos destacarías de la colaboración del equipo?
            </Label>
            <Textarea
              id="q1"
              value={q1}
              onChange={(e) => setQ1(e.target.value)}
              placeholder="Describe los puntos fuertes..."
              className="min-h-[100px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="q2">
              ¿En qué podría mejorar el colaborador para próximas tareas?
            </Label>
            <Textarea
              id="q2"
              value={q2}
              onChange={(e) => setQ2(e.target.value)}
              placeholder="Áreas de mejora..."
              className="min-h-[100px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="q3">
              ¿Qué sugerencias le darías para su desarrollo profesional?
            </Label>
            <Textarea
              id="q3"
              value={q3}
              onChange={(e) => setQ3(e.target.value)}
              placeholder="Sugerencias constructivas..."
              className="min-h-[100px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Valoración general (1-5 estrellas) *</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-8 h-8 cursor-pointer transition-colors ${
                    star <= (hoveredStar || stars)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setStars(star)}
                />
              ))}
            </div>
            {stars > 0 && (
              <p className="text-sm text-muted-foreground">
                Valoración: {stars} estrella{stars !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
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
                isSubmitting ||
                !q1.trim() ||
                !q2.trim() ||
                !q3.trim() ||
                stars === 0
              }
            >
              {isSubmitting ? 'Guardando...' : 'Completar Tarea'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskCollaboratorFeedbackModal;
