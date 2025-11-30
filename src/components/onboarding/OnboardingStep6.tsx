import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { OnboardingFormData } from "@/pages/Onboarding";
import { Plus, Trash2 } from "lucide-react";

interface OnboardingStep6Props {
  formData: OnboardingFormData;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
}

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Paso 6: Estructura del Equipo</h2>
        <p className="text-muted-foreground">
          Define los roles y responsabilidades de tu equipo
        </p>
      </div>

      <div className="space-y-6">
        {formData.teamStructure.map((role, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-4 relative">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Rol #{index + 1}</h3>
              {index > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRole(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`role-name-${index}`}>Nombre del Rol *</Label>
                <Input
                  id={`role-name-${index}`}
                  placeholder="Ej: Comercial, Técnico Instalador, Admin..."
                  value={role.role}
                  onChange={(e) => updateRole(index, 'role', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor={`role-count-${index}`}>Cantidad *</Label>
                <Input
                  id={`role-count-${index}`}
                  type="number"
                  placeholder="Ej: 2"
                  value={role.count}
                  onChange={(e) => updateRole(index, 'count', e.target.value)}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor={`role-responsibilities-${index}`}>Responsabilidades *</Label>
                <Textarea
                  id={`role-responsibilities-${index}`}
                  placeholder="Ej: Contactar leads nuevos en <2h, hacer llamadas de seguimiento, agendar visitas técnicas, enviar propuestas, cerrar ventas..."
                  value={role.responsibilities}
                  onChange={(e) => updateRole(index, 'responsibilities', e.target.value)}
                  className="min-h-[80px]"
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
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar Otro Rol
        </Button>
      </div>
    </div>
  );
};