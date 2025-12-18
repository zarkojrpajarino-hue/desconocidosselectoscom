import { Card } from '@/components/ui/card';
import { Timer } from 'lucide-react';
import { DiscoveryFormData, REVENUE_URGENCY_OPTIONS } from '@/types/discovery-onboarding';
import { cn } from '@/lib/utils';

interface Props {
  data: DiscoveryFormData;
  updateData: (data: Partial<DiscoveryFormData>) => void;
}

export default function DiscoveryStep11Urgency({ data, updateData }: Props) {
  return (
    <div className="space-y-6">
      <div className="text-center pb-4 border-b">
        <Timer className="w-12 h-12 text-primary mx-auto mb-3" />
        <h2 className="text-xl font-bold">¿Qué tan rápido necesitas generar ingresos?</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Esto afecta el tipo de ideas que te recomendaremos
        </p>
      </div>

      <div className="space-y-4">
        {REVENUE_URGENCY_OPTIONS.map((option) => (
          <Card
            key={option.value}
            className={cn(
              'p-5 cursor-pointer transition-all hover:shadow-md border-2',
              data.revenueUrgency === option.value
                ? 'border-primary bg-primary/5'
                : 'border-transparent hover:border-muted'
            )}
            onClick={() => updateData({ revenueUrgency: option.value as DiscoveryFormData['revenueUrgency'] })}
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{option.icon}</span>
              <div>
                <p className="font-semibold">{option.label}</p>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg text-center">
        <p className="text-sm font-medium">
          🎯 ¡Última pregunta! Al continuar, generaremos 3 ideas personalizadas para ti.
        </p>
      </div>
    </div>
  );
}
