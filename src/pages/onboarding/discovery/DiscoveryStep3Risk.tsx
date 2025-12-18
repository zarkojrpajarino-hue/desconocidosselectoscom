import { Card } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { DiscoveryFormData } from '@/types/discovery-onboarding';
import { cn } from '@/lib/utils';

interface Props {
  data: DiscoveryFormData;
  updateData: (data: Partial<DiscoveryFormData>) => void;
}

const RISK_LEVELS = [
  { value: 1, label: 'Muy conservador', emoji: '🐢', description: 'Prefiero seguridad sobre velocidad' },
  { value: 2, label: 'Conservador', emoji: '🦊', description: 'Riesgos pequeños y calculados' },
  { value: 3, label: 'Moderado', emoji: '🦁', description: 'Balance entre riesgo y seguridad' },
  { value: 4, label: 'Arriesgado', emoji: '🦅', description: 'Dispuesto a apostar fuerte' },
  { value: 5, label: 'Muy arriesgado', emoji: '🚀', description: 'Todo o nada, máxima ambición' }
];

export default function DiscoveryStep3Risk({ data, updateData }: Props) {
  return (
    <div className="space-y-6">
      <div className="text-center pb-4 border-b">
        <Shield className="w-12 h-12 text-primary mx-auto mb-3" />
        <h2 className="text-xl font-bold">¿Cuál es tu tolerancia al riesgo?</h2>
        <p className="text-muted-foreground text-sm mt-1">
          No hay respuesta correcta - depende de tu situación
        </p>
      </div>

      <div className="space-y-3">
        {RISK_LEVELS.map((level) => (
          <Card
            key={level.value}
            className={cn(
              'p-4 cursor-pointer transition-all hover:shadow-md border-2',
              data.riskTolerance === level.value
                ? 'border-primary bg-primary/5'
                : 'border-transparent hover:border-muted'
            )}
            onClick={() => updateData({ riskTolerance: level.value })}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">{level.emoji}</span>
              <div>
                <p className="font-medium">{level.label}</p>
                <p className="text-sm text-muted-foreground">{level.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
