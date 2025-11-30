import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { OnboardingFormData } from "@/pages/Onboarding";
import { AlertCircle } from "lucide-react";

interface OnboardingStep3Props {
  formData: OnboardingFormData;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
}

export const OnboardingStep3 = ({ formData, updateFormData }: OnboardingStep3Props) => {
  const wordCount = formData.businessDescription.trim().split(/\s+/).filter(Boolean).length;
  const isValid = wordCount >= 300;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Paso 3: Describe tu Negocio</h2>
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

      <div>
        <Label htmlFor="businessDescription">
          Descripción Completa del Negocio * 
          <span className={`ml-2 text-sm ${isValid ? 'text-green-600' : 'text-red-600'}`}>
            ({wordCount}/300 palabras)
          </span>
        </Label>
        <Textarea
          id="businessDescription"
          placeholder="Ej: Somos GreenBox Solar, una empresa dedicada a la instalación de paneles solares para viviendas y empresas. Nuestro proceso empieza cuando un cliente solicita presupuesto en nuestra web o nos llama. Primero hacemos una llamada de 20min para entender sus necesidades de energía, tamaño de techo, presupuesto... Luego, si está interesado, agendamos una visita técnica donde vamos a su casa, medimos el techo con herramientas especializadas, tomamos fotos, calculamos orientación solar... Con esa info, nuestro equipo técnico prepara una propuesta personalizada con el número de paneles, coste total, ahorro mensual estimado, tiempo de instalación (2-3 días), garantías de 25 años... Se la enviamos por email y hacemos seguimiento cada 3-4 días. Si acepta, firmamos contrato, cobramos 30% adelanto, y agendamos instalación. El día de instalación llega nuestro equipo técnico (2-3 personas), instalan los paneles, conectan inversor, hacen pruebas... Al final, el cliente firma conformidad y empieza a ahorrar en su factura de luz desde el primer día. Luego hacemos seguimiento a los 15 días, 3 meses, 6 meses y cada año para mantenimiento. Nuestros principales problemas son: seguimiento manual de leads (se nos pierden muchos), no sabemos qué comercial cierra más, tardamos mucho en hacer propuestas técnicas, y no medimos bien el rendimiento mensual de cada instalador. Queremos una app donde cada comercial vea sus leads del día, pueda marcar cuando llamó a alguien, agendar visitas técnicas en el calendario, ver el pipeline completo, y que yo como CEO vea métricas en tiempo real de leads/semana, conversiones, ingresos..."
          value={formData.businessDescription}
          onChange={(e) => updateFormData({ businessDescription: e.target.value })}
          className="min-h-[300px]"
          required
        />
        <p className="text-xs text-muted-foreground mt-2">
          Incluye: ¿Qué hacen? ¿Proceso completo? ¿Quiénes son sus clientes? ¿Cómo trabajan día a día?
        </p>
      </div>

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
    </div>
  );
};