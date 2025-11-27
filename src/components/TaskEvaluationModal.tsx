import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskEvaluationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  onSubmit: (evaluation: {
    q1: string;
    q2: string;
    q3: string;
    stars: number;
  }) => Promise<void>;
}

const TaskEvaluationModal = ({ open, onOpenChange, taskTitle, onSubmit }: TaskEvaluationModalProps) => {
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');
  const [stars, setStars] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!q1.trim() || !q2.trim() || !q3.trim() || stars === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ q1, q2, q3, stars });
      // Reset form
      setQ1('');
      setQ2('');
      setQ3('');
      setStars(0);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Evaluación de Tarea</DialogTitle>
          <DialogDescription className="text-sm">
            {taskTitle}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="q1" className="text-base font-medium">
              ¿Qué aprendiste? <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="q1"
              value={q1}
              onChange={(e) => setQ1(e.target.value)}
              placeholder="Describe los aprendizajes más importantes..."
              className="min-h-[100px] resize-none"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="q2" className="text-base font-medium">
              ¿Qué desafíos encontraste? <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="q2"
              value={q2}
              onChange={(e) => setQ2(e.target.value)}
              placeholder="Describe los principales desafíos o dificultades..."
              className="min-h-[100px] resize-none"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="q3" className="text-base font-medium">
              ¿Qué mejorarías? <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="q3"
              value={q3}
              onChange={(e) => setQ3(e.target.value)}
              placeholder="Sugiere mejoras o cambios para la próxima vez..."
              className="min-h-[100px] resize-none"
              required
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">
              Calificación <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setStars(rating)}
                  onMouseEnter={() => setHoveredStar(rating)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={cn(
                      "w-10 h-10 transition-colors",
                      (hoveredStar >= rating || stars >= rating)
                        ? "fill-primary text-primary"
                        : "text-muted-foreground"
                    )}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {stars > 0 ? `${stars} de 5` : 'Selecciona una calificación'}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
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
              className="bg-gradient-primary hover:opacity-90"
              disabled={isSubmitting || !q1.trim() || !q2.trim() || !q3.trim() || stars === 0}
            >
              {isSubmitting ? 'Enviando...' : 'Completar Tarea'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskEvaluationModal;
