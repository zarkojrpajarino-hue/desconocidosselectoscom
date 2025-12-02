import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Route, Users, ShoppingCart, RefreshCw } from "lucide-react";
import { OnboardingFormData } from "@/pages/Onboarding";

interface OnboardingStep8Props {
  formData: OnboardingFormData;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
}

const ACQUISITION_CHANNELS = [
  "Google/SEO",
  "Google Ads",
  "Facebook/Instagram Ads",
  "LinkedIn",
  "TikTok",
  "Referidos/Boca a boca",
  "Email Marketing",
  "Eventos/Ferias",
  "Partnerships",
  "Llamadas en frío",
  "Contenido/Blog",
  "YouTube",
  "Marketplaces",
  "Otro"
];

export const OnboardingStep8Journey = ({ formData, updateFormData }: OnboardingStep8Props) => {
  const toggleChannel = (channel: string) => {
    const current = formData.customerAcquisitionChannels;
    if (current.includes(channel)) {
      updateFormData({ customerAcquisitionChannels: current.filter(c => c !== channel) });
    } else {
      updateFormData({ customerAcquisitionChannels: [...current, channel] });
    }
  };

  const updateObjection = (index: number, value: string) => {
    const updated = [...formData.mainObjections];
    updated[index] = value;
    updateFormData({ mainObjections: updated });
  };

  const updateChurnReason = (index: number, value: string) => {
    const updated = [...formData.churnReasons];
    updated[index] = value;
    updateFormData({ churnReasons: updated });
  };

  const updatePurchaseTrigger = (index: number, value: string) => {
    const updated = [...formData.purchaseTriggers];
    updated[index] = value;
    updateFormData({ purchaseTriggers: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Route className="h-6 w-6 text-primary" />
          Paso 8: Customer Journey
        </h2>
        <p className="text-muted-foreground">
          Entender el recorrido de tu cliente nos ayuda a optimizar cada etapa
        </p>
      </div>

      {/* Canales de Adquisición */}
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Users className="h-4 w-4" />
          ¿Dónde descubren tus clientes tu producto? *
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {ACQUISITION_CHANNELS.map((channel) => (
            <div key={channel} className="flex items-center space-x-2">
              <Checkbox
                id={`channel-${channel}`}
                checked={formData.customerAcquisitionChannels.includes(channel)}
                onCheckedChange={() => toggleChannel(channel)}
              />
              <label htmlFor={`channel-${channel}`} className="text-sm cursor-pointer">
                {channel}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Proceso de Investigación */}
      <div>
        <Label htmlFor="researchProcess">¿Cómo investigan antes de comprar? * (mín. 150 palabras)</Label>
        <Textarea
          id="researchProcess"
          placeholder="Describe el proceso de investigación de tu cliente: qué buscan, dónde comparan, cuánto tiempo tardan en decidir, qué información necesitan, con quién consultan..."
          value={formData.researchProcess}
          onChange={(e) => updateFormData({ researchProcess: e.target.value })}
          rows={4}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {formData.researchProcess.split(/\s+/).filter(Boolean).length}/150 palabras
        </p>
      </div>

      {/* Objeciones de Compra */}
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          Principales objeciones de compra * (3-5)
        </Label>
        {[0, 1, 2, 3, 4].map((index) => (
          <Textarea
            key={index}
            placeholder={`Objeción ${index + 1}: Ej. "Es muy caro", "No tengo tiempo", "Ya uso otra solución"...`}
            value={formData.mainObjections[index] || ""}
            onChange={(e) => updateObjection(index, e.target.value)}
            rows={2}
          />
        ))}
      </div>

      {/* Decisor y Triggers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="decisionMakers">¿Quién toma la decisión de compra?</Label>
          <Textarea
            id="decisionMakers"
            placeholder="Ej: CEO en empresas pequeñas, Director de Marketing en medianas, comité de compras en grandes..."
            value={formData.decisionMakers}
            onChange={(e) => updateFormData({ decisionMakers: e.target.value })}
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>¿Qué eventos disparan la compra? (3-5)</Label>
          {[0, 1, 2, 3, 4].map((index) => (
            <Input
              key={index}
              placeholder={`Trigger ${index + 1}: Ej. "Nuevo proyecto", "Cambio de proveedor"...`}
              value={formData.purchaseTriggers[index] || ""}
              onChange={(e) => updatePurchaseTrigger(index, e.target.value)}
            />
          ))}
        </div>
      </div>

      {/* Post-Venta */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-semibold flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Post-Venta y Retención
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="customerRetentionRate">% Clientes que recompran</Label>
            <Input
              id="customerRetentionRate"
              type="number"
              min={0}
              max={100}
              placeholder="Ej: 40"
              value={formData.customerRetentionRate || ""}
              onChange={(e) => updateFormData({ customerRetentionRate: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label htmlFor="repurchaseFrequency">Frecuencia recompra (meses)</Label>
            <Input
              id="repurchaseFrequency"
              type="number"
              min={0}
              placeholder="Ej: 6"
              value={formData.repurchaseFrequency || ""}
              onChange={(e) => updateFormData({ repurchaseFrequency: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label htmlFor="npsScore">NPS Score (0-10)</Label>
            <Input
              id="npsScore"
              type="number"
              min={0}
              max={10}
              placeholder="Si lo conoces"
              value={formData.npsScore || ""}
              onChange={(e) => updateFormData({ npsScore: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        {/* Razones de Churn */}
        <div className="space-y-2">
          <Label>¿Por qué pierdes clientes? (3-5 razones)</Label>
          {[0, 1, 2, 3, 4].map((index) => (
            <Input
              key={index}
              placeholder={`Razón ${index + 1}: Ej. "Precio", "Competencia", "Ya no lo necesitan"...`}
              value={formData.churnReasons[index] || ""}
              onChange={(e) => updateChurnReason(index, e.target.value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
