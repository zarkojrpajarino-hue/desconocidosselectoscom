import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TrendingUp } from 'lucide-react';

interface PhaseSelectorProps {
  currentPhase: number;
  onPhaseChange: () => void;
}

const PHASES = [
  { id: 1, label: 'Fase 1', desc: 'Validación (0-25 cestas/mes)' },
  { id: 2, label: 'Fase 2', desc: 'Optimización (25-50 cestas/mes)' },
  { id: 3, label: 'Fase 3', desc: 'Crecimiento (50-100 cestas/mes)' },
  { id: 4, label: 'Fase 4', desc: 'Escalado (100-200 cestas/mes)' },
];

const PhaseSelector = ({ currentPhase, onPhaseChange }: PhaseSelectorProps) => {
  const [loading, setLoading] = useState(false);

  const handlePhaseChange = async (phaseId: number) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('system_config')
        .update({ current_phase: phaseId })
        .eq('id', (await supabase.from('system_config').select('id').single()).data?.id);

      if (error) throw error;

      toast.success('Fase actualizada', {
        description: `Ahora estamos en ${PHASES[phaseId - 1].label}`
      });
      onPhaseChange();
    } catch (error) {
      toast.error('Error al actualizar fase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Fase del Negocio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PHASES.map((phase) => (
            <Button
              key={phase.id}
              onClick={() => handlePhaseChange(phase.id)}
              variant={currentPhase === phase.id ? 'default' : 'outline'}
              disabled={loading}
              className={`h-auto py-4 flex flex-col gap-2 ${
                currentPhase === phase.id
                  ? 'bg-gradient-primary hover:opacity-90'
                  : ''
              }`}
            >
              <span className="font-bold text-lg">{phase.label}</span>
              <span className="text-xs opacity-80">{phase.desc}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PhaseSelector;