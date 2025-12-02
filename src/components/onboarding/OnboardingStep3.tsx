import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { OnboardingFormData } from "@/pages/Onboarding";
import { AlertCircle, FileText } from "lucide-react";

interface OnboardingStep3Props {
  formData: OnboardingFormData;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
}

const GEOGRAPHIC_MARKETS = [
  "España", "México", "Argentina", "Colombia", "Chile", "Perú",
  "USA", "UK", "Alemania", "Francia", "Italia", "Portugal",
  "Latinoamérica", "Europa", "Global"
];

const BUSINESS_MODELS = [
  { value: "b2b", label: "B2B - Vendes a empresas" },
  { value: "b2c", label: "B2C - Vendes a consumidores" },
  { value: "b2b2c", label: "B2B2C - Vendes a empresas que venden a consumidores" },
  { value: "saas", label: "SaaS - Software como servicio" },
  { value: "marketplace", label: "Marketplace - Conectas compradores y vendedores" },
  { value: "ecommerce", label: "E-commerce - Venta online de productos" },
  { value: "services", label: "Servicios profesionales" },
  { value: "subscription", label: "Suscripción / Membresía" },
  { value: "other", label: "Otro" },
];

export const OnboardingStep3 = ({ formData, updateFormData }: OnboardingStep3Props) => {
  const wordCount = formData.businessDescription.trim().split(/\s+/).filter(Boolean).length;
  const isValid = wordCount >= 300;

  const toggleMarket = (market: string) => {
    const current = formData.geographicMarket;
    if (current.includes(market)) {
      updateFormData({ geographicMarket: current.filter(m => m !== market) });
    } else {
      updateFormData({ geographicMarket: [...current, market] });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Paso 3: Describe tu Negocio
        </h2>
        <p className="text-muted-foreground">
          Esta es la parte MÁS IMPORTANTE. Cuanto más detallado, mejor será tu app.
        </p>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>CRÍTICO:</strong> La calidad de tu app depende 100% de este paso.
            Escribe MÍNIMO 300 palabras describiendo tu negocio de forma detallada.
          </div>
        </div>
      </div>

      {/* Datos básicos del negocio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="foundedYear">Año de fundación</Label>
          <Input
            id="foundedYear"
            type="number"
            min={1900}
            max={new Date().getFullYear()}
            placeholder="Ej: 2018"
            value={formData.foundedYear || ""}
            onChange={(e) => updateFormData({ foundedYear: parseInt(e.target.value) || null })}
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="businessModel">Modelo de negocio *</Label>
          <Select 
            value={formData.businessModel} 
            onValueChange={(value) => updateFormData({ businessModel: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona tu modelo de negocio" />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_MODELS.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mercados geográficos */}
      <div className="space-y-2">
        <Label>¿En qué países/regiones opera?</Label>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {GEOGRAPHIC_MARKETS.map((market) => (
            <div key={market} className="flex items-center space-x-2">
              <Checkbox
                id={`market-${market}`}
                checked={formData.geographicMarket.includes(market)}
                onCheckedChange={() => toggleMarket(market)}
              />
              <label htmlFor={`market-${market}`} className="text-sm cursor-pointer">
                {market}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Descripción del negocio */}
      <div>
        <Label htmlFor="businessDescription">
          Descripción Completa del Negocio * 
          <span className={`ml-2 text-sm ${isValid ? 'text-green-600' : 'text-red-600'}`}>
            ({wordCount}/300 palabras)
          </span>
        </Label>
        <Textarea
          id="businessDescription"
          placeholder="Ej: Somos GreenBox Solar, una empresa dedicada a la instalación de paneles solares para viviendas y empresas. Nuestro proceso empieza cuando un cliente solicita presupuesto en nuestra web o nos llama. Primero hacemos una llamada de 20min para entender sus necesidades de energía, tamaño de techo, presupuesto... Luego, si está interesado, agendamos una visita técnica donde vamos a su casa, medimos el techo con herramientas especializadas, tomamos fotos, calculamos orientación solar... Con esa info, nuestro equipo técnico prepara una propuesta personalizada con el número de paneles, coste total, ahorro mensual estimado, tiempo de instalación (2-3 días), garantías de 25 años... Se la enviamos por email y hacemos seguimiento cada 3-4 días. Si acepta, firmamos contrato, cobramos 30% adelanto, y agendamos instalación..."
          value={formData.businessDescription}
          onChange={(e) => updateFormData({ businessDescription: e.target.value })}
          className="min-h-[250px]"
          required
        />
        <p className="text-xs text-muted-foreground mt-2">
          Incluye: ¿Qué hacen? ¿Proceso completo? ¿Quiénes son sus clientes? ¿Cómo trabajan día a día?
        </p>
      </div>

      {/* Clientes objetivo */}
      <div>
        <Label htmlFor="targetCustomers">¿Quiénes son tus Clientes Objetivo? *</Label>
        <Textarea
          id="targetCustomers"
          placeholder="Ej: Dueños de viviendas unifamiliares con techos amplios (>30m²), familias de clase media-alta que buscan reducir factura de luz, empresas con naves industriales que quieren sostenibilidad..."
          value={formData.targetCustomers}
          onChange={(e) => updateFormData({ targetCustomers: e.target.value })}
          className="min-h-[100px]"
          required
        />
      </div>

      {/* Propuesta de valor */}
      <div>
        <Label htmlFor="valueProposition">¿Por qué te eligen a ti? (Propuesta de Valor) *</Label>
        <Textarea
          id="valueProposition"
          placeholder="Ej: Somos los más rápidos del mercado (instalamos en 48h vs 2 semanas de competencia), ofrecemos garantía de 25 años, financiación 0% interés, y seguimiento personalizado post-venta con app para ver producción solar en tiempo real..."
          value={formData.valueProposition}
          onChange={(e) => updateFormData({ valueProposition: e.target.value })}
          className="min-h-[100px]"
          required
        />
      </div>

      {/* Ventaja competitiva */}
      <div>
        <Label htmlFor="competitiveAdvantage">¿Qué te hace único vs la competencia?</Label>
        <Textarea
          id="competitiveAdvantage"
          placeholder="Describe qué te diferencia de los competidores: tecnología, precio, servicio, experiencia, certificaciones, patentes, equipo..."
          value={formData.competitiveAdvantage}
          onChange={(e) => updateFormData({ competitiveAdvantage: e.target.value })}
          className="min-h-[100px]"
        />
      </div>
    </div>
  );
};
