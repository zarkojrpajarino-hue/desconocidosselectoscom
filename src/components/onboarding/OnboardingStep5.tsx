import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { OnboardingFormData } from "@/pages/Onboarding";
import { TrendingUp, DollarSign, Users } from "lucide-react";

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

  const updatePainPoint = (index: number, value: string) => {
    const updated = [...formData.customerPainPoints];
    updated[index] = value;
    updateFormData({ customerPainPoints: updated });
  };

  const updateMotivation = (index: number, value: string) => {
    const updated = [...formData.buyingMotivations];
    updated[index] = value;
    updateFormData({ buyingMotivations: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Paso 5: Proceso Comercial
        </h2>
        <p className="text-muted-foreground">
          Describe cómo capturas y cierras clientes
        </p>
      </div>

      {/* Proceso de venta */}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

      {/* Fuentes de leads */}
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

      {/* Métricas Actuales - CRÍTICAS */}
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          <span className="font-semibold">Métricas Actuales (⚠️ Críticas para proyecciones)</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="monthlyLeads">Leads/mes actuales *</Label>
            <Input
              id="monthlyLeads"
              type="number"
              placeholder="Ej: 50"
              value={formData.monthlyLeads || ""}
              onChange={(e) => updateFormData({ monthlyLeads: parseInt(e.target.value) || null })}
            />
          </div>
          <div>
            <Label htmlFor="conversionRate">Tasa conversión (%) *</Label>
            <Input
              id="conversionRate"
              type="number"
              min={0}
              max={100}
              placeholder="Ej: 25"
              value={formData.conversionRate || ""}
              onChange={(e) => updateFormData({ conversionRate: parseFloat(e.target.value) || null })}
            />
          </div>
          <div>
            <Label htmlFor="averageTicket">Ticket promedio (€)</Label>
            <Input
              id="averageTicket"
              type="number"
              placeholder="Ej: 5000"
              value={formData.averageTicket || ""}
              onChange={(e) => updateFormData({ averageTicket: parseFloat(e.target.value) || null })}
            />
          </div>
          <div>
            <Label htmlFor="monthlyMarketingBudget">Inversión mkt/mes (€) *</Label>
            <Input
              id="monthlyMarketingBudget"
              type="number"
              placeholder="Ej: 2000"
              value={formData.monthlyMarketingBudget || ""}
              onChange={(e) => updateFormData({ monthlyMarketingBudget: parseFloat(e.target.value) || null })}
            />
          </div>
        </div>
      </div>

      {/* ICP - Cliente Ideal */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <span className="font-semibold">Cliente Ideal (ICP)</span>
        </div>

        <div>
          <Label htmlFor="icpCriteria">Describe tu cliente ideal (mín. 200 palabras)</Label>
          <Textarea
            id="icpCriteria"
            placeholder="Describe tu cliente ideal: industria, tamaño de empresa, presupuesto disponible, rol del decisor, características que indican buen fit, señales de compra..."
            value={formData.icpCriteria}
            onChange={(e) => updateFormData({ icpCriteria: e.target.value })}
            rows={4}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {formData.icpCriteria.split(/\s+/).filter(Boolean).length}/200 palabras
          </p>
        </div>

        {/* Pain Points */}
        <div className="space-y-2">
          <Label>¿Cuáles son los 3-5 principales problemas que resuelves?</Label>
          {[0, 1, 2, 3, 4].map((index) => (
            <Textarea
              key={index}
              placeholder={`Pain point ${index + 1}: Ej. "Altas facturas de electricidad", "Dependencia de combustibles fósiles"...`}
              value={formData.customerPainPoints[index] || ""}
              onChange={(e) => updatePainPoint(index, e.target.value)}
              rows={2}
            />
          ))}
        </div>

        {/* Motivaciones de compra */}
        <div className="space-y-2">
          <Label>¿Qué motiva a tus clientes a comprar?</Label>
          {[0, 1, 2, 3, 4].map((index) => (
            <Input
              key={index}
              placeholder={`Motivación ${index + 1}: Ej. "Ahorro a largo plazo", "Sostenibilidad"...`}
              value={formData.buyingMotivations[index] || ""}
              onChange={(e) => updateMotivation(index, e.target.value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
