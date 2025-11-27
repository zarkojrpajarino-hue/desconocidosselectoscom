import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Lightbulb, TrendingUp, BookOpen, Target } from 'lucide-react';
import { toast } from 'sonner';

interface TaskInsightsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  isLeader: boolean;
  onSubmit: (insights: {
    learnings: string;
    contribution: string;
    futureDecisions: string;
    suggestions: string;
  }) => Promise<void>;
}

const TaskInsightsModal = ({
  open,
  onOpenChange,
  taskTitle,
  isLeader,
  onSubmit,
}: TaskInsightsModalProps) => {
  const [learnings, setLearnings] = useState('');
  const [contribution, setContribution] = useState('');
  const [futureDecisions, setFutureDecisions] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields have at least 15 words
    const learningsWords = countWords(learnings);
    const contributionWords = countWords(contribution);
    const futureDecisionsWords = countWords(futureDecisions);
    const suggestionsWords = countWords(suggestions);

    if (learningsWords < 15 || contributionWords < 15 || futureDecisionsWords < 15 || suggestionsWords < 15) {
      toast.error('Cada campo debe tener al menos 15 palabras para completar la tarea', {
        description: 'Esto es necesario para que la tarea cuente en tu porcentaje total de la semana'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        learnings,
        contribution,
        futureDecisions,
        suggestions,
      });
      
      // Reset form
      setLearnings('');
      setContribution('');
      setFutureDecisions('');
      setSuggestions('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting insights:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = learnings && contribution && futureDecisions && suggestions;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isLeader ? 'Insights de la Tarea Completada' : 'Tarea Completada - Comparte tus Insights'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            <strong>{taskTitle}</strong>
          </p>
          <p className="text-sm text-amber-600 dark:text-amber-500 mt-2 font-medium">
            ⚠️ Rellena todos los campos (mínimo 15 palabras cada uno) para que la tarea cuente en tu porcentaje total de la semana
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="learnings" className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4 text-primary" />
              ¿Qué has aprendido con esta tarea? * (mínimo 15 palabras)
            </Label>
            <Textarea
              id="learnings"
              value={learnings}
              onChange={(e) => setLearnings(e.target.value)}
              placeholder="Describe los aprendizajes clave, habilidades desarrolladas, o conocimientos adquiridos..."
              rows={4}
              required
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {countWords(learnings)} palabras {countWords(learnings) < 15 && '(faltan ' + (15 - countWords(learnings)) + ')'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contribution" className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              ¿Qué has aportado al proyecto con esta tarea? * (mínimo 15 palabras)
            </Label>
            <Textarea
              id="contribution"
              value={contribution}
              onChange={(e) => setContribution(e.target.value)}
              placeholder="Explica el impacto de tu trabajo, valor añadido, o beneficios para el equipo/proyecto..."
              rows={4}
              required
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {countWords(contribution)} palabras {countWords(contribution) < 15 && '(faltan ' + (15 - countWords(contribution)) + ')'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="futureDecisions" className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" />
              Decisiones a futuro a raíz de esta tarea * (mínimo 15 palabras)
            </Label>
            <Textarea
              id="futureDecisions"
              value={futureDecisions}
              onChange={(e) => setFutureDecisions(e.target.value)}
              placeholder="¿Qué acciones o cambios sugieres para el futuro? ¿Qué ajustes o mejoras propones?..."
              rows={4}
              required
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {countWords(futureDecisions)} palabras {countWords(futureDecisions) < 15 && '(faltan ' + (15 - countWords(futureDecisions)) + ')'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="suggestions" className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-primary" />
              Sugerencias, inversiones o ideas * (mínimo 15 palabras)
            </Label>
            <Textarea
              id="suggestions"
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
              placeholder="Comparte ideas para optimizar, recursos que necesitarías, o inversiones que consideras útiles..."
              rows={4}
              required
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {countWords(suggestions)} palabras {countWords(suggestions) < 15 && '(faltan ' + (15 - countWords(suggestions)) + ')'}
            </p>
          </div>

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
              disabled={!canSubmit || isSubmitting}
              className="flex-1 bg-gradient-primary"
            >
              {isSubmitting ? 'Enviando...' : 'Completar Tarea'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskInsightsModal;
