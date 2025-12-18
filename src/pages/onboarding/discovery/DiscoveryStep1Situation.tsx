import { Card } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';
import { DiscoveryFormData, SITUATION_OPTIONS } from '@/types/discovery-onboarding';
import { cn } from '@/lib/utils';

interface Props {
  data: DiscoveryFormData;
  updateData: (data: Partial<DiscoveryFormData>) => void;
}

export default function DiscoveryStep1Situation({ data, updateData }: Props) {
  return (
    <div className="space-y-6">
      <div className="text-center pb-4 border-b">
        <Briefcase className="w-12 h-12 text-primary mx-auto mb-3" />
        <h2 className="text-xl font-bold">¿Cuál es tu situación actual?</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Esto nos ayuda a entender tu contexto
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SITUATION_OPTIONS.map((option) => (
          <Card
            key={option.value}
            className={cn(
              'p-4 cursor-pointer transition-all hover:shadow-md border-2',
              data.currentSituation === option.value
                ? 'border-primary bg-primary/5'
                : 'border-transparent hover:border-muted'
            )}
            onClick={() => updateData({ currentSituation: option.value as DiscoveryFormData['currentSituation'] })}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{option.icon}</span>
              <span className="font-medium">{option.label}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
