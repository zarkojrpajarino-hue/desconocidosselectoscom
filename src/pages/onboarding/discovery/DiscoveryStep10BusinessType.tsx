import { Card } from '@/components/ui/card';
import { Store } from 'lucide-react';
import { DiscoveryFormData, BUSINESS_TYPE_OPTIONS } from '@/types/discovery-onboarding';
import { cn } from '@/lib/utils';

interface Props {
  data: DiscoveryFormData;
  updateData: (data: Partial<DiscoveryFormData>) => void;
}

export default function DiscoveryStep10BusinessType({ data, updateData }: Props) {
  return (
    <div className="space-y-6">
      <div className="text-center pb-4 border-b">
        <Store className="w-12 h-12 text-primary mx-auto mb-3" />
        <h2 className="text-xl font-bold">¿Qué tipo de negocio prefieres?</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Cada modelo tiene sus pros y contras
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {BUSINESS_TYPE_OPTIONS.map((option) => (
          <Card
            key={option.value}
            className={cn(
              'p-5 cursor-pointer transition-all hover:shadow-md border-2',
              data.businessTypePreference === option.value
                ? 'border-primary bg-primary/5'
                : 'border-transparent hover:border-muted'
            )}
            onClick={() => updateData({ businessTypePreference: option.value as DiscoveryFormData['businessTypePreference'] })}
          >
            <div className="flex flex-col items-center text-center gap-2">
              <span className="text-3xl">{option.icon}</span>
              <p className="font-semibold">{option.label}</p>
              <p className="text-xs text-muted-foreground">{option.description}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
