import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Trash2, Target } from 'lucide-react';
import { toast } from 'sonner';

interface KeyResultInput {
  title: string;
  description: string;
  metric_type: 'number' | 'percentage' | 'currency' | 'boolean';
  start_value: number;
  target_value: number;
  unit: string;
  weight: number;
}

interface CreateOKRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedQuarter: string;
}

const CreateOKRModal = ({ isOpen, onClose, onSuccess, selectedQuarter }: CreateOKRModalProps) => {
  const { user } = useAuth();
  const [quarter, year] = selectedQuarter.split(' ');
  
  const [objective, setObjective] = useState({
    title: '',
    description: '',
    target_date: ''
  });

  const [keyResults, setKeyResults] = useState<KeyResultInput[]>([
    {
      title: '',
      description: '',
      metric_type: 'number',
      start_value: 0,
      target_value: 100,
      unit: '',
      weight: 1.0
    }
  ]);

  const [creating, setCreating] = useState(false);

  const addKeyResult = () => {
    setKeyResults([
      ...keyResults,
      {
        title: '',
        description: '',
        metric_type: 'number',
        start_value: 0,
        target_value: 100,
        unit: '',
        weight: 1.0
      }
    ]);
  };

  const removeKeyResult = (index: number) => {
    if (keyResults.length > 1) {
      setKeyResults(keyResults.filter((_, i) => i !== index));
    }
  };

  const updateKeyResult = (index: number, field: keyof KeyResultInput, value: any) => {
    const updated = [...keyResults];
    updated[index] = { ...updated[index], [field]: value };
    setKeyResults(updated);
  };

  const handleCreate = async () => {
    if (!objective.title.trim()) {
      toast.error('El título del objetivo es obligatorio');
      return;
    }

    if (!objective.target_date) {
      toast.error('La fecha objetivo es obligatoria');
      return;
    }

    if (keyResults.some(kr => !kr.title.trim())) {
      toast.error('Todos los Key Results deben tener título');
      return;
    }

    setCreating(true);

    try {
      const { data: newObjective, error: objError } = await supabase
        .from('objectives')
        .insert({
          title: objective.title,
          description: objective.description,
          quarter,
          year: parseInt(year),
          target_date: objective.target_date,
          owner_user_id: user?.id,
          created_by: user?.id,
          status: 'active'
        })
        .select()
        .single();

      if (objError) throw objError;

      const krsToInsert = keyResults.map(kr => ({
        objective_id: newObjective.id,
        title: kr.title,
        description: kr.description || null,
        metric_type: kr.metric_type,
        start_value: kr.start_value,
        target_value: kr.target_value,
        current_value: kr.start_value,
        unit: kr.unit || null,
        weight: kr.weight,
        status: 'on_track'
      }));

      const { error: krsError } = await supabase
        .from('key_results')
        .insert(krsToInsert);

      if (krsError) throw krsError;

      toast.success('Objetivo creado exitosamente');
      onSuccess();
    } catch (error) {
      console.error('Error creating OKR:', error);
      toast.error('Error al crear objetivo');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Crear Nuevo Objetivo - {selectedQuarter}
          </DialogTitle>
          <DialogDescription>
            Define un objetivo trimestral con sus resultados clave medibles
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">📊 Objetivo</h3>
            
            <div className="space-y-2">
              <Label htmlFor="obj-title">Título del Objetivo *</Label>
              <Input
                id="obj-title"
                placeholder="Ej: Alcanzar 100 cestas/mes"
                value={objective.title}
                onChange={(e) => setObjective({ ...objective, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="obj-description">Descripción</Label>
              <Textarea
                id="obj-description"
                placeholder="Descripción detallada del objetivo..."
                value={objective.description}
                onChange={(e) => setObjective({ ...objective, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="obj-target-date">Fecha Objetivo *</Label>
              <Input
                id="obj-target-date"
                type="date"
                value={objective.target_date}
                onChange={(e) => setObjective({ ...objective, target_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">🎯 Key Results</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addKeyResult}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar KR
              </Button>
            </div>

            {keyResults.map((kr, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3 bg-muted/50">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Key Result {index + 1}</h4>
                  {keyResults.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeKeyResult(index)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2 space-y-2">
                    <Label>Título del Key Result *</Label>
                    <Input
                      placeholder="Ej: Vender 50 cestas premium"
                      value={kr.title}
                      onChange={(e) => updateKeyResult(index, 'title', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de Métrica</Label>
                    <select
                      className="w-full px-3 py-2 border rounded-md bg-background"
                      value={kr.metric_type}
                      onChange={(e) => updateKeyResult(index, 'metric_type', e.target.value)}
                    >
                      <option value="number">Número</option>
                      <option value="percentage">Porcentaje</option>
                      <option value="currency">Moneda</option>
                      <option value="boolean">Sí/No</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Unidad</Label>
                    <Input
                      placeholder="Ej: cestas, €, clientes"
                      value={kr.unit}
                      onChange={(e) => updateKeyResult(index, 'unit', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Valor Inicial</Label>
                    <Input
                      type="number"
                      value={kr.start_value}
                      onChange={(e) => updateKeyResult(index, 'start_value', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Valor Objetivo *</Label>
                    <Input
                      type="number"
                      value={kr.target_value}
                      onChange={(e) => updateKeyResult(index, 'target_value', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Peso (0-1)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={kr.weight}
                      onChange={(e) => updateKeyResult(index, 'weight', parseFloat(e.target.value) || 1)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Importancia relativa (1 = 100%)
                    </p>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label>Descripción (opcional)</Label>
                    <Textarea
                      placeholder="Detalles sobre este resultado clave..."
                      value={kr.description}
                      onChange={(e) => updateKeyResult(index, 'description', e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={creating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? 'Creando...' : 'Crear Objetivo'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOKRModal;
