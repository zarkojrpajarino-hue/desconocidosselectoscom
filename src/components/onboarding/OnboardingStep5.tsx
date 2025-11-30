import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { OnboardingFormData } from "@/pages/Onboarding";

interface OnboardingStep5Props {
  formData: OnboardingFormData;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
}

const LEAD_SOURCES = [
  "Web / Formulario Online",
  "Llamadas Entrantes",
  "Redes Sociales",
  "Referidos / Boca a boca",
  "Email Marketing",
  "Google Ads",
  "Facebook/Instagram Ads",
  "LinkedIn",
  "Eventos/Ferias",
  "Cold Calling",
  "WhatsApp Business",
  "Otro"
];

export const OnboardingStep5 = ({ formData, updateFormData }: OnboardingStep5Props) => {
  const toggleLeadSource = (source: string) => {
    const updated = formData.leadSources.includes(source)
      ? formData.leadSources.filter(s => s !== source)
      : [...formData.leadSources, source];
    updateFormData({ leadSources: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Paso 5: Proceso Comercial</h2>
        <p className="text-muted-foreground">
          Describe cómo capturas y cierras clientes
        </p>
      </div>

      <div>
        <Label htmlFor="salesProcess">Proceso de Venta Completo (Paso a Paso) *</Label>
        <Textarea
          id="salesProcess"
          placeholder="Ej:&#10;1. Lead entra por web/teléfono&#10;2. Llamada inicial (20min) para cualificar necesidad&#10;3. Visita técnica agendada (medir techo, tomar fotos)&#10;4. Propuesta económica enviada por email (48h)&#10;5. Seguimiento cada 3-4 días&#10;6. Negociación de precio/condiciones&#10;7. Firma de contrato y pago 30% adelanto&#10;8. Instalación programada (2-3 días)&#10;9. Post-venta: seguimiento a 15 días, 3 meses, anual"
          value={formData.salesProcess}
          onChange={(e) => updateFormData({ salesProcess: e.target.value })}
          className="min-h-[200px]"
          required
        />
        <p className="text-xs text-muted-foreground mt-2">
          Describe CADA PASO desde que entra el lead hasta que se cierra la venta
        </p>
      </div>

      <div>
        <Label htmlFor="salesCycleDays">Ciclo de Venta Promedio (días) *</Label>
        <Input
          id="salesCycleDays"
          type="number"
          placeholder="Ej: 21"
          value={formData.salesCycleDays}
          onChange={(e) => updateFormData({ salesCycleDays: e.target.value })}
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          ¿Cuántos días pasan desde primer contacto hasta cerrar venta?
        </p>
      </div>

      <div>
        <Label className="mb-3 block">¿De dónde vienen tus Leads? (Selecciona todos los que apliquen) *</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {LEAD_SOURCES.map((source) => (
            <div key={source} className="flex items-center space-x-2">
              <Checkbox
                id={`source-${source}`}
                checked={formData.leadSources.includes(source)}
                onCheckedChange={() => toggleLeadSource(source)}
              />
              <label
                htmlFor={`source-${source}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {source}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};