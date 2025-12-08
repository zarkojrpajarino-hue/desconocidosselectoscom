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
  const [generatingPhase, setGeneratingPhase] = useState<number | null>(null);

  const handlePhaseChange = async (newPhase: number) => {
    if (newPhase === currentPhase || loading) return;

    try {
      setLoading(true);
      setGeneratingPhase(newPhase);

      // Verificar si la semana está bloqueada
      const { data: configCheck } = await supabase
        .from('system_config')
        .select('is_week_locked')
        .single();

      if (configCheck?.is_week_locked) {
        toast.error('⏸️ Semana cerrada', {
          description: 'No puedes cambiar de fase hasta el inicio de la próxima semana (miércoles 13:00)'
        });
        setLoading(false);
        setGeneratingPhase(null);
        return;
      }

      // Actualizar fase en system_config
      const { data: configData } = await supabase
        .from('system_config')
        .select('id')
        .single();

      if (!configData) throw new Error('System config not found');

      const { error: configError } = await supabase
        .from('system_config')
        .update({ current_phase: newPhase })
        .eq('id', configData.id);

      if (configError) throw configError;

      toast.success(`✅ Fase ${newPhase} activada`, {
        description: 'Las tareas de esta fase ya están disponibles'
      });

      onPhaseChange();

      // Reload para actualizar vista
      setTimeout(() => window.location.reload(), 500);

    } catch (error: unknown) {
      console.error('Error changing phase:', error);
      const message = error instanceof Error ? error.message : 'Intenta de nuevo';
      toast.error('Error al cambiar fase', {
        description: message
      });
    } finally {
      setLoading(false);
      setGeneratingPhase(null);
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
          {PHASES.map((phase) => {
            const isGenerating = generatingPhase === phase.id;
            const isDisabled = loading;
            
            return (
              <Button
                key={phase.id}
                onClick={() => handlePhaseChange(phase.id)}
                variant={currentPhase === phase.id ? 'default' : 'outline'}
                disabled={isDisabled}
                className={`h-auto py-4 flex flex-col gap-2 ${
                  currentPhase === phase.id
                    ? 'bg-gradient-primary hover:opacity-90'
                    : ''
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                    <span className="font-bold text-sm">Generando...</span>
                    <span className="text-xs opacity-80">Fase {phase.id}</span>
                  </>
                ) : (
                  <>
                    <span className="font-bold text-lg">{phase.label}</span>
                    <span className="text-xs opacity-80">{phase.desc}</span>
                  </>
                )}
              </Button>
            );
          })}
        </div>
        {loading && (
          <p className="text-sm text-muted-foreground text-center mt-4">
            ⏳ Cambiando a Fase {generatingPhase}...
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PhaseSelector;