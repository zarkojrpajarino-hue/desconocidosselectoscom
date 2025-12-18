import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';
import { DiscoveryFormData, INDUSTRY_OPTIONS } from '@/types/discovery-onboarding';
import { cn } from '@/lib/utils';

interface Props {
  data: DiscoveryFormData;
  updateData: (data: Partial<DiscoveryFormData>) => void;
}

export default function DiscoveryStep6Industries({ data, updateData }: Props) {
  const toggleIndustry = (value: string) => {
    const current = data.industries;
    if (current.includes(value)) {
      updateData({ industries: current.filter(i => i !== value) });
    } else {
      updateData({ industries: [...current, value] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center pb-4 border-b">
        <Building2 className="w-12 h-12 text-primary mx-auto mb-3" />
        <h2 className="text-xl font-bold">¿En qué industrias tienes experiencia?</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Selecciona todas las que apliquen - el conocimiento del sector es una ventaja
        </p>
      </div>

      <div className="flex justify-center gap-2 mb-4 flex-wrap">
        {data.industries.length > 0 ? (
          <>
            <Badge>{data.industries.length} seleccionada{data.industries.length !== 1 ? 's' : ''}</Badge>
          </>
        ) : (
          <Badge variant="outline">Ninguna seleccionada</Badge>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {INDUSTRY_OPTIONS.map((option) => {
          const isSelected = data.industries.includes(option.value);
          
          return (
            <Card
              key={option.value}
              className={cn(
                'p-3 cursor-pointer transition-all border-2',
                isSelected && 'border-primary bg-primary/5',
                !isSelected && 'border-transparent hover:border-muted hover:shadow-md'
              )}
              onClick={() => toggleIndustry(option.value)}
            >
              <div className="flex flex-col items-center text-center gap-2">
                <span className="text-2xl">{option.icon}</span>
                <span className="font-medium text-xs">{option.label}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
