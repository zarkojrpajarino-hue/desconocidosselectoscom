import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OnboardingFormData } from "@/pages/Onboarding";

interface OnboardingStep2Props {
  formData: OnboardingFormData;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
}

export const OnboardingStep2 = ({ formData, updateFormData }: OnboardingStep2Props) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Paso 2: Información de la Empresa</h2>
        <p className="text-muted-foreground">
          Cuéntanos lo básico sobre tu empresa
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="companyName">Nombre de la Empresa *</Label>
          <Input
            id="companyName"
            placeholder="Ej: GreenBox Solar"
            value={formData.companyName}
            onChange={(e) => updateFormData({ companyName: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="contactName">Tu Nombre Completo *</Label>
          <Input
            id="contactName"
            placeholder="Ej: Juan Pérez"
            value={formData.contactName}
            onChange={(e) => updateFormData({ contactName: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="contactEmail">Email de Contacto *</Label>
          <Input
            id="contactEmail"
            type="email"
            placeholder="juan@greenbox.com"
            value={formData.contactEmail}
            onChange={(e) => updateFormData({ contactEmail: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="contactPhone">Teléfono (Opcional)</Label>
          <Input
            id="contactPhone"
            type="tel"
            placeholder="+34 600 123 456"
            value={formData.contactPhone}
            onChange={(e) => updateFormData({ contactPhone: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="industry">Industria *</Label>
          <Select
            value={formData.industry}
            onValueChange={(value) => updateFormData({ industry: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona industria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tecnologia">Tecnología</SelectItem>
              <SelectItem value="servicios">Servicios</SelectItem>
              <SelectItem value="retail">Retail / E-commerce</SelectItem>
              <SelectItem value="manufactura">Manufactura</SelectItem>
              <SelectItem value="construccion">Construcción</SelectItem>
              <SelectItem value="salud">Salud</SelectItem>
              <SelectItem value="educacion">Educación</SelectItem>
              <SelectItem value="finanzas">Finanzas</SelectItem>
              <SelectItem value="hosteleria">Hostelería</SelectItem>
              <SelectItem value="energia">Energía</SelectItem>
              <SelectItem value="otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="companySize">Tamaño de Empresa *</Label>
          <Select
            value={formData.companySize}
            onValueChange={(value) => updateFormData({ companySize: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona tamaño" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-5">1-5 empleados</SelectItem>
              <SelectItem value="6-10">6-10 empleados</SelectItem>
              <SelectItem value="11-25">11-25 empleados</SelectItem>
              <SelectItem value="26-50">26-50 empleados</SelectItem>
              <SelectItem value="51-100">51-100 empleados</SelectItem>
              <SelectItem value="100+">Más de 100 empleados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="annualRevenueRange">Facturación Anual (Opcional)</Label>
          <Select
            value={formData.annualRevenueRange}
            onValueChange={(value) => updateFormData({ annualRevenueRange: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona rango" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0-50k">0-50K €</SelectItem>
              <SelectItem value="50k-100k">50K-100K €</SelectItem>
              <SelectItem value="100k-250k">100K-250K €</SelectItem>
              <SelectItem value="250k-500k">250K-500K €</SelectItem>
              <SelectItem value="500k-1M">500K-1M €</SelectItem>
              <SelectItem value="1M+">Más de 1M €</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};