import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OnboardingFormData } from "@/pages/Onboarding";
import { Plus, Trash2, Users, TrendingUp, Clock } from "lucide-react";

interface OnboardingStep6Props {
  formData: OnboardingFormData;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
}

const GROWTH_PLAN_OPTIONS = [
  { value: "no_hiring", label: "Sin contrataciones previstas" },
  { value: "1-2_hires", label: "1-2 contrataciones en 6 meses" },
  { value: "3-5_hires", label: "3-5 contrataciones en 6 meses" },
  { value: "aggressive", label: "Crecimiento agresivo (+5 personas)" },
  { value: "uncertain", label: "Depende de resultados" },
];

export const OnboardingStep6 = ({ formData, updateFormData }: OnboardingStep6Props) => {
  const addRole = () => {
    updateFormData({
      teamStructure: [...formData.teamStructure, { role: "", count: "", responsibilities: "" }]
    });
  };

  const removeRole = (index: number) => {
    const updated = formData.teamStructure.filter((_, i) => i !== index);
    updateFormData({ teamStructure: updated });
  };

  const updateRole = (index: number, field: string, value: string) => {
    const updated = formData.teamStructure.map((r, i) =>
      i === index ? { ...r, [field]: value } : r
    );
    updateFormData({ teamStructure: updated });
  };

  // Calcular total de personas del equipo
  const totalTeamSize = formData.teamStructure.reduce((acc, role) => {
    return acc + (parseInt(role.count) || 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold mb-2 flex items-center gap-2">
          <Users className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          Paso 6: Estructura del Equipo
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Define los roles, responsabilidades y planes de crecimiento de tu equipo
        </p>
      </div>

      {/* Roles del equipo */}
      <div className="space-y-4 md:space-y-6">
        {formData.teamStructure.map((role, index) => (
          <div key={index} className="border border-border rounded-lg p-3 md:p-4 space-y-3 md:space-y-4 relative bg-card">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-sm md:text-base">Rol #{index + 1}</h3>
              {index > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRole(index)}
                  className="text-destructive hover:text-destructive/80 h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <Label htmlFor={`role-name-${index}`} className="text-sm">Nombre del Rol *</Label>
                <Input
                  id={`role-name-${index}`}
                  placeholder="Ej: Comercial, Técnico, Admin..."
                  value={role.role}
                  onChange={(e) => updateRole(index, 'role', e.target.value)}
                  required
                  className="text-sm"
                />
              </div>

              <div>
                <Label htmlFor={`role-count-${index}`} className="text-sm">Cantidad *</Label>
                <Input
                  id={`role-count-${index}`}
                  type="number"
                  placeholder="Ej: 2"
                  value={role.count}
                  onChange={(e) => updateRole(index, 'count', e.target.value)}
                  required
                  className="text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor={`role-responsibilities-${index}`} className="text-sm">Responsabilidades *</Label>
                <Textarea
                  id={`role-responsibilities-${index}`}
                  placeholder="Ej: Contactar leads, hacer seguimiento, cerrar ventas..."
                  value={role.responsibilities}
                  onChange={(e) => updateRole(index, 'responsibilities', e.target.value)}
                  className="min-h-[60px] md:min-h-[80px] text-sm"
                  required
                />
              </div>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addRole}
          className="w-full text-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar Otro Rol
        </Button>

        {/* Total del equipo */}
        {totalTeamSize > 0 && (
          <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              Total del equipo: <span className="text-primary">{totalTeamSize} persona{totalTeamSize !== 1 ? 's' : ''}</span>
            </span>
          </div>
        )}
      </div>

      {/* Sección de planificación del equipo - NUEVA para AI Phases */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm md:text-base">Planificación del Equipo</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="teamGrowthPlan" className="text-sm">Plan de crecimiento del equipo</Label>
            <Select 
              value={formData.teamGrowthPlan || ""} 
              onValueChange={(value) => updateFormData({ teamGrowthPlan: value })}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="¿Planeas contratar?" />
              </SelectTrigger>
              <SelectContent>
                {GROWTH_PLAN_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Esto nos ayuda a planificar las fases de crecimiento
            </p>
          </div>

          <div>
            <Label htmlFor="availableHoursWeekly" className="text-sm flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Horas disponibles por semana
            </Label>
            <Input
              id="availableHoursWeekly"
              type="number"
              placeholder="Ej: 40"
              value={formData.availableHoursWeekly || ""}
              onChange={(e) => updateFormData({ availableHoursWeekly: parseInt(e.target.value) || null })}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Horas totales que tu equipo puede dedicar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};