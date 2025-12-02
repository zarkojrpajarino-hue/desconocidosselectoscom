import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flag, TrendingUp, Target } from "lucide-react";
import { OnboardingFormData } from "@/pages/Onboarding";

interface OnboardingStep9Props {
  formData: OnboardingFormData;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
}

const KPI_OPTIONS = [
  "Ingresos / Facturación",
  "Margen de beneficio",
  "Leads generados",
  "Tasa de conversión",
  "CAC (Coste Adquisición Cliente)",
  "LTV (Valor Tiempo de Vida)",
  "Clientes nuevos",
  "Retención de clientes",
  "NPS / Satisfacción",
  "Ticket promedio",
  "Tiempo de ciclo de venta",
  "Pipeline value",
  "Productividad del equipo",
  "ROI Marketing",
  "Otro"
];

export const OnboardingStep9Objectives = ({ formData, updateFormData }: OnboardingStep9Props) => {
  const toggleKpi = (kpi: string) => {
    const current = formData.kpisToMeasure;
    if (current.includes(kpi)) {
      updateFormData({ kpisToMeasure: current.filter(k => k !== kpi) });
    } else {
      updateFormData({ kpisToMeasure: [...current, kpi] });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Flag className="h-6 w-6 text-primary" />
          Paso 9: Objetivos y Metas
        </h2>
        <p className="text-muted-foreground">
          Define tus objetivos para que la IA configure KPIs y metas personalizadas
        </p>
      </div>

      {/* Objetivos Cuantitativos - CRÍTICOS */}
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <span className="font-semibold">Objetivos Cuantitativos (⚠️ Críticos)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="revenueGoal12Months">Facturación objetivo en 12 meses (€) *</Label>
            <Input
              id="revenueGoal12Months"
              type="number"
              placeholder="Ej: 500000"
              value={formData.revenueGoal12Months || ""}
              onChange={(e) => updateFormData({ revenueGoal12Months: parseFloat(e.target.value) || null })}
            />
            <p className="text-xs text-muted-foreground mt-1">¿Cuánto quieres facturar en total?</p>
          </div>
          <div>
            <Label htmlFor="customersGoal12Months">Clientes objetivo en 12 meses *</Label>
            <Input
              id="customersGoal12Months"
              type="number"
              placeholder="Ej: 200"
              value={formData.customersGoal12Months || ""}
              onChange={(e) => updateFormData({ customersGoal12Months: parseInt(e.target.value) || null })}
            />
            <p className="text-xs text-muted-foreground mt-1">¿Cuántos clientes nuevos quieres?</p>
          </div>
        </div>

        <div>
          <Label htmlFor="growthPriority">¿Qué es más importante para ti?</Label>
          <Select 
            value={formData.growthPriority} 
            onValueChange={(value) => updateFormData({ growthPriority: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona tu prioridad de crecimiento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">Maximizar facturación</SelectItem>
              <SelectItem value="customers">Maximizar clientes</SelectItem>
              <SelectItem value="profitability">Maximizar rentabilidad</SelectItem>
              <SelectItem value="market_share">Ganar cuota de mercado</SelectItem>
              <SelectItem value="brand">Construir marca</SelectItem>
              <SelectItem value="balanced">Crecimiento equilibrado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Objetivos Cualitativos */}
      <div>
        <Label htmlFor="mainObjectives">Objetivos Principales *</Label>
        <Textarea
          id="mainObjectives"
          placeholder="Ej: Ser el líder en instalaciones solares residenciales en la Comunidad de Madrid, digitalizar todo el proceso comercial, reducir el tiempo de cierre de ventas a 15 días..."
          value={formData.mainObjectives}
          onChange={(e) => updateFormData({ mainObjectives: e.target.value })}
          className="min-h-[120px]"
        />
      </div>

      {/* KPIs a Medir */}
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          ¿Qué KPIs quieres medir? *
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {KPI_OPTIONS.map((kpi) => (
            <div key={kpi} className="flex items-center space-x-2">
              <Checkbox
                id={`kpi-${kpi}`}
                checked={formData.kpisToMeasure.includes(kpi)}
                onCheckedChange={() => toggleKpi(kpi)}
              />
              <label htmlFor={`kpi-${kpi}`} className="text-sm cursor-pointer">
                {kpi}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Problemas Actuales */}
      <div>
        <Label htmlFor="currentProblems">Problemas Actuales a Resolver *</Label>
        <Textarea
          id="currentProblems"
          placeholder="Ej: Perdemos leads por falta de seguimiento, no sabemos qué comercial rinde más, tardamos mucho en generar propuestas, no medimos el ROI de marketing..."
          value={formData.currentProblems}
          onChange={(e) => updateFormData({ currentProblems: e.target.value })}
          className="min-h-[120px]"
        />
      </div>

      {/* Timeline y Restricciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
        <div>
          <Label htmlFor="urgency">¿Cuándo necesitas ver resultados?</Label>
          <Select 
            value={formData.urgency} 
            onValueChange={(value) => updateFormData({ urgency: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona urgencia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">En 1 mes</SelectItem>
              <SelectItem value="3months">En 3 meses</SelectItem>
              <SelectItem value="6months">En 6 meses</SelectItem>
              <SelectItem value="12months">En 12 meses</SelectItem>
              <SelectItem value="noRush">Sin prisa específica</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="budgetConstraints">Restricciones de presupuesto</Label>
          <Textarea
            id="budgetConstraints"
            placeholder="Ej: Presupuesto limitado para marketing, no podemos contratar más personal a corto plazo..."
            value={formData.budgetConstraints}
            onChange={(e) => updateFormData({ budgetConstraints: e.target.value })}
            rows={2}
          />
        </div>
      </div>
    </div>
  );
};
