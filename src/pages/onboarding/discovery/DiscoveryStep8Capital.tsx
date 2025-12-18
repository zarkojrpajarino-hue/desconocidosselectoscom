import { Card } from '@/components/ui/card';
import { Wallet } from 'lucide-react';
import { DiscoveryFormData, CAPITAL_OPTIONS } from '@/types/discovery-onboarding';
import { cn } from '@/lib/utils';

interface Props {
  data: DiscoveryFormData;
  updateData: (data: Partial<DiscoveryFormData>) => void;
}

export default function DiscoveryStep8Capital({ data, updateData }: Props) {
  return (
    <div className="space-y-6">
      <div className="text-center pb-4 border-b">
        <Wallet className="w-12 h-12 text-primary mx-auto mb-3" />
        <h2 className="text-xl font-bold">¿Cuánto capital inicial tienes disponible?</h2>
        <p className="text-muted-foreground text-sm mt-1">
          No te preocupes - hay ideas para todos los presupuestos
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CAPITAL_OPTIONS.map((option) => (
          <Card
            key={option.value}
            className={cn(
              'p-5 cursor-pointer transition-all hover:shadow-md border-2',
              data.initialCapital === option.value
                ? 'border-primary bg-primary/5'
                : 'border-transparent hover:border-muted'
            )}
            onClick={() => updateData({ initialCapital: option.value as DiscoveryFormData['initialCapital'] })}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">{option.icon}</span>
              <span className="font-medium">{option.label}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground text-center">
          💡 El 60% de los negocios exitosos empezaron con menos de €5,000
        </p>
      </div>
    </div>
  );
}
