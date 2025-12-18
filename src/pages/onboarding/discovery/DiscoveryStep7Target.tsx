import { Card } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { DiscoveryFormData, TARGET_AUDIENCE_OPTIONS } from '@/types/discovery-onboarding';
import { cn } from '@/lib/utils';

interface Props {
  data: DiscoveryFormData;
  updateData: (data: Partial<DiscoveryFormData>) => void;
}

export default function DiscoveryStep7Target({ data, updateData }: Props) {
  return (
    <div className="space-y-6">
      <div className="text-center pb-4 border-b">
        <Users className="w-12 h-12 text-primary mx-auto mb-3" />
        <h2 className="text-xl font-bold">¿A quién te gustaría vender?</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Cada tipo de cliente tiene sus ventajas
        </p>
      </div>

      <div className="space-y-4">
        {TARGET_AUDIENCE_OPTIONS.map((option) => (
          <Card
            key={option.value}
            className={cn(
              'p-5 cursor-pointer transition-all hover:shadow-md border-2',
              data.targetAudiencePreference === option.value
                ? 'border-primary bg-primary/5'
                : 'border-transparent hover:border-muted'
            )}
            onClick={() => updateData({ targetAudiencePreference: option.value as DiscoveryFormData['targetAudiencePreference'] })}
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
    </div>
  );
}
