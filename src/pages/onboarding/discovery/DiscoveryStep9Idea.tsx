import { Textarea } from '@/components/ui/textarea';
import { Lightbulb } from 'lucide-react';
import { DiscoveryFormData } from '@/types/discovery-onboarding';

interface Props {
  data: DiscoveryFormData;
  updateData: (data: Partial<DiscoveryFormData>) => void;
}

export default function DiscoveryStep9Idea({ data, updateData }: Props) {
  return (
    <div className="space-y-6">
      <div className="text-center pb-4 border-b">
        <Lightbulb className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold">¿Tienes alguna idea en mente?</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Opcional - si ya tienes algo, cuéntanos
        </p>
      </div>

      <Textarea
        placeholder="Ej: He pensado en crear una app para gestionar citas de peluquerías, o una tienda online de productos sostenibles para mascotas..."
        value={data.existingIdea}
        onChange={(e) => updateData({ existingIdea: e.target.value })}
        rows={5}
        className="resize-none"
      />

      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground text-center">
          💡 Si no tienes ninguna idea, ¡no pasa nada! Te daremos 3 ideas personalizadas basadas en tus respuestas.
        </p>
      </div>
    </div>
  );
}
