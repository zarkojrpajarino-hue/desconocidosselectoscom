import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flag, TrendingUp, Target, AlertTriangle, Wrench } from "lucide-react";
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

const CHALLENGE_OPTIONS = [
  { value: "sales", label: "Ventas / Conversión de leads" },
  { value: "operations", label: "Operaciones / Procesos internos" },
  { value: "team", label: "Equipo / Talento / Cultura" },
  { value: "marketing", label: "Marketing / Generación de demanda" },
  { value: "finance", label: "Finanzas / Flujo de caja" },
  { value: "product", label: "Producto / Servicio" },
  { value: "technology", label: "Tecnología / Sistemas" },
  { value: "scaling", label: "Escalabilidad / Crecimiento" },
];

const AREAS_TO_OPTIMIZE = [
  "Gestión de leads y CRM",
  "Automatización de procesos",
  "Seguimiento de métricas",
  "Comunicación interna",
  "Gestión de tareas del equipo",
  "Planificación estratégica",
  "Control financiero",
  "Marketing y captación",
  "Atención al cliente",
  "Producción / Operaciones",
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

  const toggleAreaToOptimize = (area: string) => {
    const current = formData.areasToOptimize || [];
    if (current.includes(area)) {
      updateFormData({ areasToOptimize: current.filter(a => a !== area) });
    } else {
      updateFormData({ areasToOptimize: [...current, area] });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold mb-2 flex items-center gap-2">
          <Flag className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          Paso 9: Objetivos y Metas
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Define tus objetivos para que la IA configure KPIs, metas y fases personalizadas
        </p>
      </div>

      {/* Objetivos Cuantitativos - CRÍTICOS */}
      <div className="p-3 md:p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-4">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          <span className="font-semibold text-sm md:text-base">Objetivos Cuantitativos (⚠️ Críticos)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div>
            <Label htmlFor="revenueGoal12Months" className="text-sm">Facturación objetivo en 12 meses (€) *</Label>
            <Input
              id="revenueGoal12Months"
              type="number"
              placeholder="Ej: 500000"
              value={formData.revenueGoal12Months || ""}
              onChange={(e) => updateFormData({ revenueGoal12Months: parseFloat(e.target.value) || null })}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">¿Cuánto quieres facturar en total?</p>
          </div>
          <div>
            <Label htmlFor="customersGoal12Months" className="text-sm">Clientes objetivo en 12 meses *</Label>
            <Input
              id="customersGoal12Months"
              type="number"
              placeholder="Ej: 200"
              value={formData.customersGoal12Months || ""}
              onChange={(e) => updateFormData({ customersGoal12Months: parseInt(e.target.value) || null })}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">¿Cuántos clientes nuevos quieres?</p>
          </div>
        </div>

        <div>
          <Label htmlFor="growthPriority" className="text-sm">¿Qué es más importante para ti?</Label>
          <Select 
            value={formData.growthPriority} 
            onValueChange={(value) => updateFormData({ growthPriority: value })}
          >
            <SelectTrigger className="text-sm">
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

      {/* Mayor Desafío - NUEVO para AI Phases */}
      <div className="p-3 md:p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />
          <span className="font-semibold text-sm md:text-base">Mayor Desafío Actual</span>
        </div>
        <div>
          <Label htmlFor="biggestChallenge" className="text-sm">¿Cuál es tu mayor desafío ahora mismo? *</Label>
          <Select 
            value={formData.biggestChallenge || ""} 
            onValueChange={(value) => updateFormData({ biggestChallenge: value })}
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Selecciona tu mayor desafío" />
            </SelectTrigger>
            <SelectContent>
              {CHALLENGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Esto determina las tareas prioritarias en tu roadmap
          </p>
        </div>
      </div>

      {/* Áreas a Optimizar - NUEVO para AI Phases */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-primary" />
          <Label className="text-sm md:text-base font-semibold">¿Qué áreas quieres optimizar? *</Label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {AREAS_TO_OPTIMIZE.map((area) => (
            <div key={area} className="flex items-center space-x-2">
              <Checkbox
                id={`area-${area}`}
                checked={(formData.areasToOptimize || []).includes(area)}
                onCheckedChange={() => toggleAreaToOptimize(area)}
              />
              <label htmlFor={`area-${area}`} className="text-xs md:text-sm cursor-pointer">
                {area}
              </label>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Selecciona todas las áreas donde necesitas mejorar
        </p>
      </div>

      {/* Objetivos Cualitativos */}
      <div>
        <Label htmlFor="mainObjectives" className="text-sm">Objetivos Principales *</Label>
        <Textarea
          id="mainObjectives"
          placeholder="Ej: Ser el líder en instalaciones solares residenciales, digitalizar el proceso comercial, reducir tiempo de cierre..."
          value={formData.mainObjectives}
          onChange={(e) => updateFormData({ mainObjectives: e.target.value })}
          className="min-h-[80px] md:min-h-[100px] text-sm"
        />
      </div>

      {/* KPIs a Medir */}
      <div className="space-y-3">
        <Label className="text-sm md:text-base font-semibold flex items-center gap-2">
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
              <label htmlFor={`kpi-${kpi}`} className="text-xs md:text-sm cursor-pointer">
                {kpi}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Problemas Actuales */}
      <div>
        <Label htmlFor="currentProblems" className="text-sm">Problemas Actuales a Resolver *</Label>
        <Textarea
          id="currentProblems"
          placeholder="Ej: Perdemos leads por falta de seguimiento, no sabemos qué comercial rinde más..."
          value={formData.currentProblems}
          onChange={(e) => updateFormData({ currentProblems: e.target.value })}
          className="min-h-[80px] md:min-h-[100px] text-sm"
        />
      </div>

      {/* Timeline y Restricciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 pt-4 border-t border-border">
        <div>
          <Label htmlFor="urgency" className="text-sm">¿Cuándo necesitas ver resultados?</Label>
          <Select 
            value={formData.urgency} 
            onValueChange={(value) => updateFormData({ urgency: value })}
          >
            <SelectTrigger className="text-sm">
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
          <Label htmlFor="budgetConstraints" className="text-sm">Restricciones de presupuesto</Label>
          <Textarea
            id="budgetConstraints"
            placeholder="Ej: Presupuesto limitado para marketing..."
            value={formData.budgetConstraints}
            onChange={(e) => updateFormData({ budgetConstraints: e.target.value })}
            rows={2}
            className="text-sm"
          />
        </div>
      </div>
    </div>
  );
};
