import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Sparkles, AlertCircle, FileCheck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface TaskCompletionRequirement {
  id: string;
  question: string;
  type: 'checkbox' | 'text' | 'evidence';
}

interface TaskCompletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  taskTitle: string;
  taskDescription: string;
  onComplete: () => void;
}

// Generate AI requirements based on task
async function generateRequirements(taskTitle: string, taskDescription: string): Promise<TaskCompletionRequirement[]> {
  // Call edge function to generate requirements
  const { data, error } = await supabase.functions.invoke('generate-task-requirements', {
    body: { taskTitle, taskDescription }
  });
  
  if (error || !data?.requirements) {
    // Fallback to default requirements
    return [
      { id: '1', question: `¿Has completado "${taskTitle}" correctamente?`, type: 'checkbox' },
      { id: '2', question: '¿Qué resultado o entregable has conseguido?', type: 'text' },
      { id: '3', question: '¿Has documentado los pasos realizados?', type: 'checkbox' },
    ];
  }
  
  return data.requirements;
}

export function TaskCompletionModal({
  open,
  onOpenChange,
  taskId,
  taskTitle,
  taskDescription,
  onComplete
}: TaskCompletionModalProps) {
  const { user, currentOrganizationId } = useAuth();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch or generate requirements
  const { data: requirements, isLoading } = useQuery({
    queryKey: ['task-requirements', taskId, taskTitle],
    queryFn: () => generateRequirements(taskTitle, taskDescription),
    enabled: open,
    staleTime: Infinity, // Don't refetch once we have requirements
  });
  
  // Check if all required questions are answered
  const allAnswered = requirements?.every(req => {
    const answer = answers[req.id];
    if (req.type === 'checkbox') return answer === true;
    if (req.type === 'text' || req.type === 'evidence') return typeof answer === 'string' && answer.trim().length > 0;
    return true;
  }) ?? false;
  
  const handleSubmit = async () => {
    if (!user?.id || !currentOrganizationId || !allAnswered) return;
    
    setIsSubmitting(true);
    try {
      // First check if a completion exists
      const { data: existing } = await supabase
        .from('task_completions')
        .select('id')
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('task_completions')
          .update({
            completed_by_user: true,
            validated_by_leader: true,
            completed_at: new Date().toISOString(),
            completion_evidence: answers,
          })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('task_completions')
          .insert({
            task_id: taskId,
            user_id: user.id,
            organization_id: currentOrganizationId,
            completed_by_user: true,
            validated_by_leader: true,
            completed_at: new Date().toISOString(),
            completion_evidence: answers,
          });
        
        if (error) throw error;
      }
      
      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ['phase-weekly-tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['individual-agenda-tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['team-agenda-tasks'] });
      
      toast.success('¡Tarea completada con éxito!');
      onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Error al completar la tarea');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAnswerChange = (id: string, value: string | boolean) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-primary" />
            Verificar Completado
          </DialogTitle>
          <DialogDescription>
            Responde estas preguntas para verificar que has completado la tarea correctamente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Task info */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="font-medium text-sm text-foreground">{taskTitle}</p>
            {taskDescription && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{taskDescription}</p>
            )}
          </div>
          
          {/* Requirements */}
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="w-3 h-3" />
                <span>Requisitos generados por IA</span>
              </div>
              
              {requirements?.map((req, index) => (
                <div key={req.id} className="space-y-2">
                  <Label className="text-sm font-medium flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5 text-xs shrink-0">
                      {index + 1}
                    </Badge>
                    {req.question}
                  </Label>
                  
                  {req.type === 'checkbox' && (
                    <div className="flex items-center gap-2 ml-6">
                      <Checkbox
                        id={req.id}
                        checked={answers[req.id] === true}
                        onCheckedChange={(checked) => handleAnswerChange(req.id, checked === true)}
                      />
                      <label htmlFor={req.id} className="text-sm text-muted-foreground cursor-pointer">
                        Sí, lo he hecho
                      </label>
                    </div>
                  )}
                  
                  {(req.type === 'text' || req.type === 'evidence') && (
                    <Textarea
                      placeholder={req.type === 'evidence' ? 'Describe la evidencia o resultado...' : 'Tu respuesta...'}
                      value={(answers[req.id] as string) || ''}
                      onChange={(e) => handleAnswerChange(req.id, e.target.value)}
                      className="ml-6 text-sm"
                      rows={2}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Validation message */}
          {!allAnswered && requirements && requirements.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-warning">
              <AlertCircle className="w-3 h-3" />
              <span>Completa todas las preguntas para continuar</span>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!allAnswered || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>Guardando...</>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Completar Tarea
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
