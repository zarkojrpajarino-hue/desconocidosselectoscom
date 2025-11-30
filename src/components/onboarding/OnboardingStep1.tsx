import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingFormData } from "@/pages/Onboarding";

interface OnboardingStep1Props {
  formData: OnboardingFormData;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
}

export const OnboardingStep1 = ({ formData, updateFormData }: OnboardingStep1Props) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Paso 1: Crea tu Cuenta</h2>
        <p className="text-muted-foreground">
          Primero, configura tus credenciales de acceso
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="accountEmail">Email de acceso *</Label>
          <Input
            id="accountEmail"
            type="email"
            placeholder="tu@empresa.com"
            value={formData.accountEmail}
            onChange={(e) => updateFormData({ accountEmail: e.target.value })}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Usarás este email para acceder a tu app
          </p>
        </div>

        <div>
          <Label htmlFor="accountPassword">Contraseña *</Label>
          <Input
            id="accountPassword"
            type="password"
            placeholder="Mínimo 8 caracteres"
            value={formData.accountPassword}
            onChange={(e) => updateFormData({ accountPassword: e.target.value })}
            required
            minLength={8}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Mínimo 8 caracteres
          </p>
        </div>
      </div>
    </div>
  );
};