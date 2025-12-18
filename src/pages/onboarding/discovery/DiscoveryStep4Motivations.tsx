import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart } from 'lucide-react';
import { DiscoveryFormData, MOTIVATION_OPTIONS } from '@/types/discovery-onboarding';
import { cn } from '@/lib/utils';

interface Props {
  data: DiscoveryFormData;
  updateData: (data: Partial<DiscoveryFormData>) => void;
}

export default function DiscoveryStep4Motivations({ data, updateData }: Props) {
  const toggleMotivation = (value: string) => {
    const current = data.motivations;
    if (current.includes(value)) {
      updateData({ motivations: current.filter(m => m !== value) });
    } else if (current.length < 3) {
      updateData({ motivations: [...current, value] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center pb-4 border-b">
        <Heart className="w-12 h-12 text-primary mx-auto mb-3" />
        <h2 className="text-xl font-bold">¿Qué te motiva a emprender?</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Selecciona hasta 3 motivaciones principales
        </p>
      </div>

      <div className="flex justify-center gap-2 mb-4">
        <Badge variant={data.motivations.length >= 1 ? 'default' : 'outline'}>1</Badge>
        <Badge variant={data.motivations.length >= 2 ? 'default' : 'outline'}>2</Badge>
        <Badge variant={data.motivations.length >= 3 ? 'default' : 'outline'}>3</Badge>
        <span className="text-sm text-muted-foreground ml-2">seleccionadas</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MOTIVATION_OPTIONS.map((option) => {
          const isSelected = data.motivations.includes(option.value);
          const isDisabled = !isSelected && data.motivations.length >= 3;
          
          return (
            <Card
              key={option.value}
              className={cn(
                'p-4 cursor-pointer transition-all border-2',
                isSelected && 'border-primary bg-primary/5',
                !isSelected && !isDisabled && 'border-transparent hover:border-muted hover:shadow-md',
                isDisabled && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => !isDisabled && toggleMotivation(option.value)}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{option.icon}</span>
                <span className="font-medium text-sm">{option.label}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
