import { Slider } from '@/components/ui/slider';
import { Clock } from 'lucide-react';
import { DiscoveryFormData } from '@/types/discovery-onboarding';

interface Props {
  data: DiscoveryFormData;
  updateData: (data: Partial<DiscoveryFormData>) => void;
}

export default function DiscoveryStep2Time({ data, updateData }: Props) {
  const getTimeDescription = (hours: number) => {
    if (hours <= 10) return '🌙 Proyecto nocturno - Perfecto para empezar mientras trabajas';
    if (hours <= 20) return '⚡ Media jornada - Buen equilibrio entre trabajo y proyecto';
    if (hours <= 30) return '🚀 Dedicación seria - Puedes avanzar rápido';
    return '💪 Full-time - Máxima velocidad de ejecución';
  };

  return (
    <div className="space-y-8">
      <div className="text-center pb-4 border-b">
        <Clock className="w-12 h-12 text-primary mx-auto mb-3" />
        <h2 className="text-xl font-bold">¿Cuántas horas semanales puedes dedicar?</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Sé realista - mejor poco consistente que mucho inconsistente
        </p>
      </div>

      <div className="space-y-6">
        <div className="text-center">
          <span className="text-5xl font-bold text-primary">{data.hoursWeekly}</span>
          <span className="text-2xl text-muted-foreground ml-2">horas/semana</span>
        </div>

        <Slider
          value={[data.hoursWeekly]}
          onValueChange={(value) => updateData({ hoursWeekly: value[0] })}
          min={5}
          max={40}
          step={5}
          className="w-full"
        />

        <div className="flex justify-between text-sm text-muted-foreground">
          <span>5h</span>
          <span>20h</span>
          <span>40h</span>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg text-center">
          <p className="text-sm">{getTimeDescription(data.hoursWeekly)}</p>
        </div>
      </div>
    </div>
  );
}
