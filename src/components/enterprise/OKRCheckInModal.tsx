import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useOKRCheckIns } from '@/hooks/useOKRCheckIns';

interface KeyResultData {
  id: string;
  title: string;
  current_value: number;
  target_value: number;
  start_value: number;
  unit: string | null;
}

interface OKRCheckInModalProps {
  keyResult: KeyResultData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type CheckInStatus = 'on_track' | 'at_risk' | 'blocked' | 'achieved';

export function OKRCheckInModal({ 
  keyResult, 
  open, 
  onOpenChange,
  onSuccess 
}: OKRCheckInModalProps) {
  const { createCheckIn, isCreating } = useOKRCheckIns(keyResult.id);
  
  const [formData, setFormData] = useState({
    new_value: keyResult.current_value,
    confidence_level: 3,
    status: 'on_track' as CheckInStatus,
    progress_update: '',
    blockers: '',
    next_steps: '',
    learnings: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createCheckIn({
      key_result_id: keyResult.id,
      previous_value: keyResult.current_value,
      new_value: formData.new_value,
      confidence_level: formData.confidence_level,
      status: formData.status,
      progress_update: formData.progress_update,
      blockers: formData.blockers || undefined,
      next_steps: formData.next_steps || undefined,
      learnings: formData.learnings || undefined,
    }, {
      onSuccess: () => {
        onSuccess?.();
        onOpenChange(false);
        // Reset form
        setFormData({
          new_value: keyResult.current_value,
          confidence_level: 3,
          status: 'on_track',
          progress_update: '',
          blockers: '',
          next_steps: '',
          learnings: '',
        });
      },
    });
  };

  const progress = keyResult.target_value !== keyResult.start_value
    ? ((formData.new_value - keyResult.start_value) / (keyResult.target_value - keyResult.start_value)) * 100
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Check-in: {keyResult.title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nuevo Valor */}
          <div className="space-y-2">
            <Label htmlFor="new_value">Nuevo Valor *</Label>
            <div className="flex items-center gap-3">
              <Input
                id="new_value"
                type="number"
                step="0.01"
                value={formData.new_value}
                onChange={(e) => setFormData({ ...formData, new_value: Number(e.target.value) })}
                className="flex-1"
                required
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {keyResult.unit || 'unidades'} / {keyResult.target_value}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Anterior: {keyResult.current_value}</span>
              <span>•</span>
              <span className={progress >= 70 ? 'text-green-600' : progress >= 40 ? 'text-yellow-600' : 'text-red-600'}>
                Progreso: {Math.round(progress)}%
              </span>
            </div>
          </div>

          {/* Estado */}
          <div className="space-y-3">
            <Label>Estado *</Label>
            <RadioGroup
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as CheckInStatus })}
              className="space-y-2"
            >
              <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="on_track" id="on_track" />
                <Label htmlFor="on_track" className="flex items-center gap-2 font-normal cursor-pointer flex-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <div>On Track</div>
                    <div className="text-xs text-muted-foreground">Todo va según lo planeado</div>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="at_risk" id="at_risk" />
                <Label htmlFor="at_risk" className="flex items-center gap-2 font-normal cursor-pointer flex-1">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <div>
                    <div>At Risk</div>
                    <div className="text-xs text-muted-foreground">Hay algunos obstáculos a superar</div>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="blocked" id="blocked" />
                <Label htmlFor="blocked" className="flex items-center gap-2 font-normal cursor-pointer flex-1">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <div>
                    <div>Blocked</div>
                    <div className="text-xs text-muted-foreground">Necesitamos ayuda urgente</div>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="achieved" id="achieved" />
                <Label htmlFor="achieved" className="flex items-center gap-2 font-normal cursor-pointer flex-1">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <div>
                    <div>Achieved</div>
                    <div className="text-xs text-muted-foreground">¡Meta alcanzada!</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Nivel de Confianza */}
          <div className="space-y-2">
            <Label>
              Nivel de Confianza: {formData.confidence_level}/5
            </Label>
            <input
              type="range"
              min="1"
              max="5"
              value={formData.confidence_level}
              onChange={(e) => setFormData({ ...formData, confidence_level: Number(e.target.value) })}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Muy bajo</span>
              <span>Alto</span>
            </div>
          </div>

          {/* Progreso (OBLIGATORIO) */}
          <div className="space-y-2">
            <Label htmlFor="progress_update">¿Qué progreso hicimos? *</Label>
            <Textarea
              id="progress_update"
              value={formData.progress_update}
              onChange={(e) => setFormData({ ...formData, progress_update: e.target.value })}
              placeholder="Ej: Cerramos 3 deals grandes este mes, aumentando el ARR en $50k. El canal de LinkedIn está funcionando muy bien."
              rows={3}
              required
            />
          </div>

          {/* Bloqueadores (Opcional) */}
          <div className="space-y-2">
            <Label htmlFor="blockers">¿Qué nos está frenando?</Label>
            <Textarea
              id="blockers"
              value={formData.blockers}
              onChange={(e) => setFormData({ ...formData, blockers: e.target.value })}
              placeholder="Ej: El equipo de producto está retrasado 2 semanas. Necesitamos más recursos de marketing."
              rows={2}
            />
          </div>

          {/* Próximos Pasos (Opcional) */}
          <div className="space-y-2">
            <Label htmlFor="next_steps">¿Qué haremos la próxima semana?</Label>
            <Textarea
              id="next_steps"
              value={formData.next_steps}
              onChange={(e) => setFormData({ ...formData, next_steps: e.target.value })}
              placeholder="Ej: Contratar 2 SDRs, lanzar campaña en Google Ads, reunión con cliente X."
              rows={2}
            />
          </div>

          {/* Aprendizajes (Opcional) */}
          <div className="space-y-2">
            <Label htmlFor="learnings">¿Qué aprendimos?</Label>
            <Textarea
              id="learnings"
              value={formData.learnings}
              onChange={(e) => setFormData({ ...formData, learnings: e.target.value })}
              placeholder="Ej: Descubrimos que nuestro ICP real son empresas de 50-200 empleados."
              rows={2}
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating || !formData.progress_update.trim()}>
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar Check-in
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
