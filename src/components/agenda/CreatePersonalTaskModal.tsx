import React from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCreatePersonalTask } from '@/hooks/useGlobalAgenda';

interface CreatePersonalTaskModalProps {
  open: boolean;
  onClose: () => void;
  weekStart?: string;
}

interface PersonalTaskFormData {
  title: string;
  description: string;
  estimated_duration: number;
  scheduled_date: string;
  scheduled_time: string;
}

export function CreatePersonalTaskModal({ open, onClose, weekStart }: CreatePersonalTaskModalProps) {
  const createTask = useCreatePersonalTask();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PersonalTaskFormData>({
    defaultValues: {
      title: '',
      description: '',
      estimated_duration: 60,
      scheduled_date: '',
      scheduled_time: '',
    },
  });

  const onSubmit = (data: PersonalTaskFormData) => {
    createTask.mutate(
      {
        title: data.title,
        description: data.description || undefined,
        estimated_duration: data.estimated_duration,
        scheduled_date: data.scheduled_date || undefined,
        scheduled_time: data.scheduled_time || undefined,
        weekStart,
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      }
    );
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nueva Tarea Personal</DialogTitle>
          <DialogDescription>
            Crea una tarea personal que aparecerá en tu agenda global
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Ej: Ir al gimnasio"
              {...register('title', { required: 'El título es obligatorio' })}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Detalles adicionales..."
              rows={2}
              {...register('description')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimated_duration">Duración (minutos)</Label>
            <Input
              id="estimated_duration"
              type="number"
              min={15}
              max={480}
              {...register('estimated_duration', { valueAsNumber: true })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled_date">Fecha (opcional)</Label>
              <Input
                id="scheduled_date"
                type="date"
                {...register('scheduled_date')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_time">Hora (opcional)</Label>
              <Input
                id="scheduled_time"
                type="time"
                {...register('scheduled_time')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createTask.isPending}>
              {createTask.isPending ? 'Creando...' : 'Crear Tarea'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
