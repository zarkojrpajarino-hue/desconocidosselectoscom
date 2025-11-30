import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { OnboardingFormData } from "@/pages/Onboarding";

interface OnboardingStep7Props {
  formData: OnboardingFormData;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
}

const COMMON_KPIS = [
  "Leads generados/mes",
  "Tasa de conversión lead→cliente",
  "Ticket promedio por venta",
  "Revenue mensual/trimestral",
  "Tiempo promedio de cierre",
  "Número de ventas cerradas/mes",
  "Valor del pipeline",
  "CAC (Coste de Adquisición Cliente)",
  "LTV (Valor del Cliente en su Vida)",
  "Churn rate (tasa de cancelación)",
  "NPS (satisfacción cliente)",
  "Productividad por comercial",
  "ROI de marketing",
  "Margen de beneficio",
  "Otro"
];

export const OnboardingStep7 = ({ formData, updateFormData }: OnboardingStep7Props) => {
  const toggleKPI = (kpi: string) => {
    const updated = formData.kpisToMeasure.includes(kpi)
      ? formData.kpisToMeasure.filter(k => k !== kpi)
      : [...formData.kpisToMeasure, kpi];
    updateFormData({ kpisToMeasure: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Paso 7: Objetivos y Métricas</h2>
        <p className="text-muted-foreground">
          Define qué quieres lograr y cómo lo medirás
        </p>
      </div>

      <div>
        <Label htmlFor="mainObjectives">Objetivos Principales (Próximos 3-6 meses) *</Label>
        <Textarea
          id="mainObjectives"
          placeholder="Ej:&#10;1. Aumentar de 15 a 50 instalaciones/mes en 6 meses&#10;2. Reducir tiempo de respuesta a leads de 4h a <1h&#10;3. Mejorar tasa de conversión propuesta→venta de 25% a 40%&#10;4. Automatizar seguimiento de leads para no perder ninguno&#10;5. Tener visibilidad en tiempo real de métricas del equipo"
          value={formData.mainObjectives}
          onChange={(e) => updateFormData({ mainObjectives: e.target.value })}
          className="min-h-[150px]"
          required
        />
        <p className="text-xs text-muted-foreground mt-2">
          Sé específico con números: "De X a Y en Z tiempo"
        </p>
      </div>

      <div>
        <Label className="mb-3 block">¿Qué KPIs quieres medir? (Selecciona todos los que apliquen) *</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {COMMON_KPIS.map((kpi) => (
            <div key={kpi} className="flex items-center space-x-2">
              <Checkbox
                id={`kpi-${kpi}`}
                checked={formData.kpisToMeasure.includes(kpi)}
                onCheckedChange={() => toggleKPI(kpi)}
              />
              <label
                htmlFor={`kpi-${kpi}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {kpi}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="currentProblems">Problemas Actuales que Quieres Resolver *</Label>
        <Textarea
          id="currentProblems"
          placeholder="Ej:&#10;- Se nos pierden leads porque seguimos todo en Excel&#10;- No sabemos qué comercial vende más ni por qué&#10;- Tardamos 3 días en hacer una propuesta técnica&#10;- No hay visibilidad del pipeline en tiempo real&#10;- El CEO no tiene métricas actualizadas, solo las ve a fin de mes&#10;- Cada comercial hace seguimiento a su manera (no hay proceso)&#10;- Perdemos clientes porque se nos olvida hacer follow-up"
          value={formData.currentProblems}
          onChange={(e) => updateFormData({ currentProblems: e.target.value })}
          className="min-h-[150px]"
          required
        />
        <p className="text-xs text-muted-foreground mt-2">
          Sé honesto. Estos problemas guiarán las funcionalidades de tu app.
        </p>
      </div>
    </div>
  );
};