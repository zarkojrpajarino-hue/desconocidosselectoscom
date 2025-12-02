import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { OnboardingStep1 } from "@/components/onboarding/OnboardingStep1";
import { OnboardingStep2 } from "@/components/onboarding/OnboardingStep2";
import { OnboardingStep3 } from "@/components/onboarding/OnboardingStep3";
import { OnboardingStep4 } from "@/components/onboarding/OnboardingStep4";
import { OnboardingStep5 } from "@/components/onboarding/OnboardingStep5";
import { OnboardingStep6 } from "@/components/onboarding/OnboardingStep6";
import { OnboardingStep7Competitors } from "@/components/onboarding/OnboardingStep7Competitors";
import { OnboardingStep8Journey } from "@/components/onboarding/OnboardingStep8Journey";
import { OnboardingStep9Objectives } from "@/components/onboarding/OnboardingStep9Objectives";
import { OnboardingStepper } from "@/components/onboarding/OnboardingStepper";
import { ExistingUserOptions } from "@/components/onboarding/ExistingUserOptions";
import { useAuth } from "@/contexts/AuthContext";

export interface OnboardingFormData {
  // Paso 1: Cuenta
  accountEmail: string;
  accountPassword: string;
  
  // Paso 2: Info básica
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  industry: string;
  companySize: string;
  annualRevenueRange: string;
  
  // Paso 3: Negocio detallado (MEJORADO)
  businessDescription: string;
  targetCustomers: string;
  valueProposition: string;
  foundedYear: number | null;
  geographicMarket: string[];
  businessModel: string;
  competitiveAdvantage: string;
  
  // Paso 4: Productos/Servicios (MEJORADO)
  productsServices: Array<{
    name: string;
    price: string;
    category: string;
    description: string;
    cost: string;
    unitsSoldPerMonth: string;
    productionTime: string;
  }>;
  
  // Paso 5: Proceso comercial (MEJORADO)
  salesProcess: string;
  salesCycleDays: string;
  leadSources: string[];
  monthlyLeads: number | null;
  conversionRate: number | null;
  averageTicket: number | null;
  monthlyMarketingBudget: number | null;
  icpCriteria: string;
  customerPainPoints: string[];
  buyingMotivations: string[];
  
  // Paso 6: Equipo
  teamStructure: Array<{
    role: string;
    count: string;
    responsibilities: string;
  }>;
  
  // Paso 7: Competencia y Mercado (NUEVO)
  topCompetitors: Array<{
    name: string;
    priceRange: string;
    strengths: string;
    weaknesses: string;
  }>;
  marketSize: string;
  marketGrowthRate: string;
  marketShareGoal: number | null;
  pricingStrategy: string;
  brandPerception: string;
  
  // Paso 8: Customer Journey (NUEVO)
  customerAcquisitionChannels: string[];
  researchProcess: string;
  mainObjections: string[];
  decisionMakers: string;
  purchaseTriggers: string[];
  customerRetentionRate: number | null;
  repurchaseFrequency: number | null;
  npsScore: number | null;
  churnReasons: string[];
  
  // Paso 9: Objetivos (MEJORADO)
  mainObjectives: string;
  kpisToMeasure: string[];
  currentProblems: string;
  revenueGoal12Months: number | null;
  customersGoal12Months: number | null;
  growthPriority: string;
  urgency: string;
  budgetConstraints: string;
}

const TOTAL_STEPS = 9;

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, userOrganizations } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showExistingUserOptions, setShowExistingUserOptions] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  
  const [formData, setFormData] = useState<OnboardingFormData>({
    // Paso 1
    accountEmail: "",
    accountPassword: "",
    // Paso 2
    companyName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    industry: "",
    companySize: "",
    annualRevenueRange: "",
    // Paso 3
    businessDescription: "",
    targetCustomers: "",
    valueProposition: "",
    foundedYear: null,
    geographicMarket: [],
    businessModel: "",
    competitiveAdvantage: "",
    // Paso 4
    productsServices: [{ name: "", price: "", category: "", description: "", cost: "", unitsSoldPerMonth: "", productionTime: "" }],
    // Paso 5
    salesProcess: "",
    salesCycleDays: "",
    leadSources: [],
    monthlyLeads: null,
    conversionRate: null,
    averageTicket: null,
    monthlyMarketingBudget: null,
    icpCriteria: "",
    customerPainPoints: ["", "", ""],
    buyingMotivations: ["", "", ""],
    // Paso 6
    teamStructure: [{ role: "", count: "", responsibilities: "" }],
    // Paso 7
    topCompetitors: [{ name: "", priceRange: "", strengths: "", weaknesses: "" }, { name: "", priceRange: "", strengths: "", weaknesses: "" }],
    marketSize: "",
    marketGrowthRate: "",
    marketShareGoal: null,
    pricingStrategy: "",
    brandPerception: "",
    // Paso 8
    customerAcquisitionChannels: [],
    researchProcess: "",
    mainObjections: ["", "", ""],
    decisionMakers: "",
    purchaseTriggers: ["", "", ""],
    customerRetentionRate: null,
    repurchaseFrequency: null,
    npsScore: null,
    churnReasons: ["", "", ""],
    // Paso 9
    mainObjectives: "",
    kpisToMeasure: [],
    currentProblems: "",
    revenueGoal12Months: null,
    customersGoal12Months: null,
    growthPriority: "",
    urgency: "",
    budgetConstraints: "",
  });

  const updateFormData = (data: Partial<OnboardingFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  // Detectar si el usuario ya está logueado al cargar el onboarding
  useEffect(() => {
    if (user && userOrganizations.length > 0) {
      setIsExistingUser(true);
      setShowExistingUserOptions(true);
      // Pre-llenar algunos campos con datos del usuario
      setFormData(prev => ({
        ...prev,
        accountEmail: user.email || '',
        contactName: user.user_metadata?.full_name || '',
        contactEmail: user.email || ''
      }));
    }
  }, [user, userOrganizations]);

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        // Si es usuario existente, saltar validación de paso 1
        if (isExistingUser) return true;
        
        if (!formData.accountEmail || !formData.accountPassword) {
          toast.error("Por favor completa todos los campos del paso 1");
          return false;
        }
        if (formData.accountPassword.length < 8) {
          toast.error("La contraseña debe tener al menos 8 caracteres");
          return false;
        }
        return true;
      
      case 2:
        if (!formData.companyName || !formData.contactName || !formData.contactEmail || 
            !formData.industry || !formData.companySize) {
          toast.error("Por favor completa todos los campos obligatorios del paso 2");
          return false;
        }
        return true;
      
      case 3:
        if (!formData.businessDescription || !formData.targetCustomers || !formData.valueProposition) {
          toast.error("Por favor completa todos los campos del paso 3");
          return false;
        }
        if (formData.businessDescription.length < 300) {
          toast.error("La descripción del negocio debe tener al menos 300 palabras para generar una app de calidad");
          return false;
        }
        return true;
      
      case 4:
        if (formData.productsServices.length === 0 || !formData.productsServices[0].name) {
          toast.error("Agrega al menos 1 producto/servicio");
          return false;
        }
        return true;
      
      case 5:
        if (!formData.salesProcess || formData.leadSources.length === 0) {
          toast.error("Por favor completa todos los campos del paso 5");
          return false;
        }
        return true;
      
      case 6:
        if (formData.teamStructure.length === 0 || !formData.teamStructure[0].role) {
          toast.error("Agrega al menos 1 rol en el equipo");
          return false;
        }
        return true;
      
      case 7:
        // Competencia - solo críticos obligatorios
        if (formData.topCompetitors.filter(c => c.name).length < 2) {
          toast.error("Agrega al menos 2 competidores");
          return false;
        }
        if (!formData.pricingStrategy) {
          toast.error("Selecciona tu estrategia de precios");
          return false;
        }
        return true;
      
      case 8:
        // Customer Journey - solo críticos obligatorios
        if (formData.customerAcquisitionChannels.length === 0) {
          toast.error("Selecciona al menos un canal de adquisición");
          return false;
        }
        if (formData.researchProcess.split(/\s+/).filter(Boolean).length < 150) {
          toast.error("El proceso de investigación debe tener al menos 150 palabras");
          return false;
        }
        if (formData.mainObjections.filter(o => o.trim()).length < 3) {
          toast.error("Agrega al menos 3 objeciones de compra");
          return false;
        }
        return true;
      
      case 9:
        // Objetivos - solo críticos obligatorios
        if (!formData.mainObjectives || formData.kpisToMeasure.length === 0 || !formData.currentProblems) {
          toast.error("Por favor completa todos los campos obligatorios del paso 9");
          return false;
        }
        if (!formData.revenueGoal12Months) {
          toast.error("Define tu objetivo de facturación a 12 meses");
          return false;
        }
        return true;
      
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < TOTAL_STEPS) {
        setCurrentStep(prev => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const generateMegaPrompt = (data: OnboardingFormData): string => {
    return `
# Generar App OPTIMUS-K para: ${data.companyName}

## INSTRUCCIONES PARA LOVABLE AI:
Genera una app IDÉNTICA al proyecto "Experiencia Selecta" (OPTIMUS-K base), pero 100% personalizada con la siguiente información del cliente:

---

## 📋 INFORMACIÓN DE LA EMPRESA

**Nombre**: ${data.companyName}
**Industria**: ${data.industry}
**Tamaño**: ${data.companySize}
**Revenue Anual**: ${data.annualRevenueRange || 'No especificado'}

**Contacto**:
- Nombre: ${data.contactName}
- Email: ${data.contactEmail}
- Teléfono: ${data.contactPhone || 'No especificado'}

---

## 🎯 DESCRIPCIÓN COMPLETA DEL NEGOCIO

${data.businessDescription}

**Clientes objetivo**:
${data.targetCustomers}

**Propuesta de valor**:
${data.valueProposition}

---

## 💼 PRODUCTOS Y SERVICIOS

${data.productsServices.map((p, i) => `
### ${i + 1}. ${p.name}
- **Precio**: ${p.price}
- **Categoría**: ${p.category}
- **Descripción**: ${p.description}
`).join('\n')}

---

## 🚀 PROCESO COMERCIAL COMPLETO

**Descripción paso a paso**:
${data.salesProcess}

**Ciclo de venta promedio**: ${data.salesCycleDays || 'No especificado'} días

**Fuentes de leads**:
${data.leadSources.map(s => `- ${s}`).join('\n')}

---

## 👥 ESTRUCTURA DEL EQUIPO

${data.teamStructure.map((t, i) => `
### ${i + 1}. ${t.role}
- **Cantidad**: ${t.count} persona(s)
- **Responsabilidades**: ${t.responsibilities}
`).join('\n')}

---

## 🎯 OBJETIVOS Y MÉTRICAS

**Objetivos principales**:
${data.mainObjectives}

**KPIs a medir**:
${data.kpisToMeasure.map(k => `- ${k}`).join('\n')}

**Problemas actuales a resolver**:
${data.currentProblems}

---

## 📦 INSTRUCCIONES DE GENERACIÓN

### ESTRUCTURA BASE (NO CAMBIAR):
- Dashboard con tareas semanales
- Sistema de OKRs con Key Results
- CRM con pipeline personalizado
- Módulo de métricas KPI
- Sistema de gamificación
- Alertas inteligentes
- Calendario semanal

### PERSONALIZACIONES REQUERIDAS:

#### 1. TAREAS (Generar 50 tareas específicas)
Basándote en el proceso comercial descrito, genera 50 tareas concretas distribuidas en 4 fases:
- **Fase 1 - Captar**: Tareas para generar y cualificar leads
- **Fase 2 - Proponer**: Tareas para presentar propuestas y negociar
- **Fase 3 - Cerrar**: Tareas para firmar contratos
- **Fase 4 - Entregar**: Tareas post-venta y retención

Ejemplos adaptados a su industria (${data.industry}):
[Genera tareas reales que esta empresa haría día a día]

#### 2. PIPELINE CRM
Adapta las etapas del pipeline basándote en su proceso comercial:
${data.salesProcess.split('\n').slice(0, 7).map((step, i) => `- Etapa ${i + 1}: ${step}`).join('\n')}

#### 3. MÉTRICAS KPI
Crea un dashboard con estas métricas específicas:
${data.kpisToMeasure.map(k => `- ${k}`).join('\n')}

#### 4. OKRs
Genera 3 objetivos principales alineados con:
${data.mainObjectives}

#### 5. PRODUCTOS EN CRM
Lista de productos/servicios para el CRM:
${data.productsServices.map(p => `- ${p.name} (${p.category}) - ${p.price}`).join('\n')}

#### 6. ROLES Y PERMISOS
Estructura de equipo para permisos:
${data.teamStructure.map(t => `- ${t.role}: ${t.count} usuario(s)`).join('\n')}

---

## 🎨 PERSONALIZACIÓN UI (OPCIONAL)

- Usar terminología específica de ${data.industry}
- Adaptar ejemplos y placeholders a su negocio
- Mantener estructura base de Experiencia Selecta

---

## ✅ CHECKLIST DE GENERACIÓN

- [ ] 50 tareas específicas generadas
- [ ] Pipeline CRM con etapas personalizadas
- [ ] Dashboard KPI con métricas correctas
- [ ] 3 OKRs alineados con objetivos
- [ ] Productos/servicios en sistema
- [ ] Roles de equipo configurados
- [ ] Base de datos adaptada
- [ ] RLS policies configuradas
- [ ] Funcionalidades base mantenidas

---

**IMPORTANTE**: 
1. NO cambies la arquitectura base
2. NO agregues funcionalidades nuevas no solicitadas
3. SÍ personaliza contenido, tareas, métricas y textos
4. SÍ mantén toda la funcionalidad de gamificación, alertas, colaboración
5. Genera una app lista para producción

**Resultado esperado**: App funcionando 100%, personalizada, sin bugs, lista para desplegar.
    `.trim();
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // 1. Check if user is already logged in
      const { data: existingUserData } = await supabase.auth.getUser();
      let userId: string;
      let isNewUser = false;
      
      if (existingUserData?.user) {
        // Usuario ya logueado, crear solo la organización
        userId = existingUserData.user.id;
        toast.success('Creando nueva organización para tu cuenta existente...');
      } else {
        // 2. Create new user account
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: formData.accountEmail,
          password: formData.accountPassword,
          options: {
            data: {
              full_name: formData.contactName,
            }
          }
        });

        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            throw new Error('Este email ya está registrado. Por favor inicia sesión primero.');
          }
          throw signUpError;
        }
        if (!authData.user) throw new Error('No se pudo crear el usuario');

        userId = authData.user.id;
        isNewUser = true;

        // 3. Wait for trigger to create user in public.users (only for new users)
        let userCreated = false;
        for (let i = 0; i < 6; i++) {
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('id', userId)
            .single();
          
          if (userData) {
            userCreated = true;
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (!userCreated) {
          throw new Error('Error al configurar el usuario. Intenta de nuevo.');
        }
      }
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: formData.companyName,
          industry: formData.industry,
          company_size: formData.companySize,
          annual_revenue_range: formData.annualRevenueRange,
          business_description: formData.businessDescription,
          target_customers: formData.targetCustomers,
          value_proposition: formData.valueProposition,
          founded_year: formData.foundedYear,
          geographic_market: formData.geographicMarket,
          business_model: formData.businessModel,
          competitive_advantage: formData.competitiveAdvantage,
          sales_process: formData.salesProcess,
          sales_cycle_days: parseInt(formData.salesCycleDays) || null,
          lead_sources: formData.leadSources,
          monthly_leads: formData.monthlyLeads,
          conversion_rate: formData.conversionRate,
          average_ticket: formData.averageTicket,
          monthly_marketing_budget: formData.monthlyMarketingBudget,
          icp_criteria: formData.icpCriteria,
          customer_pain_points: formData.customerPainPoints.filter(p => p.trim()),
          buying_motivations: formData.buyingMotivations.filter(m => m.trim()),
          products_services: formData.productsServices,
          team_structure: formData.teamStructure,
          top_competitors: formData.topCompetitors.filter(c => c.name),
          market_size: formData.marketSize,
          market_growth_rate: formData.marketGrowthRate,
          market_share_goal: formData.marketShareGoal,
          pricing_strategy: formData.pricingStrategy,
          brand_perception: formData.brandPerception,
          customer_acquisition_channels: formData.customerAcquisitionChannels,
          research_process: formData.researchProcess,
          main_objections: formData.mainObjections.filter(o => o.trim()),
          decision_makers: formData.decisionMakers,
          purchase_triggers: formData.purchaseTriggers.filter(t => t.trim()),
          customer_retention_rate: formData.customerRetentionRate,
          repurchase_frequency: formData.repurchaseFrequency,
          nps_score: formData.npsScore,
          churn_reasons: formData.churnReasons.filter(r => r.trim()),
          main_objectives: formData.mainObjectives,
          kpis_to_measure: formData.kpisToMeasure,
          current_problems: formData.currentProblems,
          revenue_goal_12_months: formData.revenueGoal12Months,
          customers_goal_12_months: formData.customersGoal12Months,
          growth_priority: formData.growthPriority,
          urgency: formData.urgency,
          budget_constraints: formData.budgetConstraints,
          contact_name: formData.contactName,
          contact_email: formData.contactEmail,
          contact_phone: formData.contactPhone,
          ai_generation_status: 'pending',
        })
        .select()
        .single();

      if (orgError) {
        // Cleanup: delete auth user if org creation fails (only for new users)
        if (isNewUser) {
          await supabase.auth.admin.deleteUser(userId);
        }
        throw new Error(`Error al crear organización: ${orgError.message}`);
      }

      // 5. Create user_role entry (admin role for this organization)
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          organization_id: org.id,
          role: 'admin',
          role_name: 'Administrador',
          role_description: 'Administrador de la organización'
        });

      if (roleError) {
        console.error('Error creating user role:', roleError);
        throw new Error(`Error al asignar rol: ${roleError.message}`);
      }

      // 6. Update users table with organization_id for backwards compatibility
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ 
          organization_id: org.id,
          role: 'admin'
        })
        .eq('id', userId);

      if (userUpdateError) {
        throw new Error(`Error al vincular usuario: ${userUpdateError.message}`);
      }

      // 7. Set this as current organization
      localStorage.setItem('current_organization_id', org.id);

      // 8. Trigger AI generation (async - NO esperar respuesta)
      supabase.functions.invoke('generate-workspace', {
        body: { organizationId: org.id }
      }).catch((error) => {
        console.error('AI generation error:', error);
      });

      // 9. Redirect to generating workspace screen
      navigate(`/generating-workspace?org=${org.id}`);
      
    } catch (error: any) {
      console.error('Error submitting onboarding:', error);
      
      // More descriptive error messages
      let errorMessage = 'Error al crear tu cuenta';
      let errorDescription = 'Intenta de nuevo o contacta soporte';
      
      if (error.message.includes('already registered') || error.message.includes('ya está registrado')) {
        errorMessage = 'Email ya registrado';
        errorDescription = 'Este email ya tiene una cuenta. Inicia sesión en su lugar.';
      } else if (error.message.includes('organización')) {
        errorMessage = 'Error al crear organización';
        errorDescription = error.message;
      } else if (error.message.includes('configurar el usuario')) {
        errorMessage = 'Error de sincronización';
        errorDescription = 'Hubo un problema al configurar tu cuenta. Intenta de nuevo.';
      } else if (error.message) {
        errorDescription = error.message;
      }
      
      toast.error(errorMessage, { description: errorDescription });
    } finally {
      setLoading(false);
    }
  };

  const progress = (currentStep / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Bienvenido a <span className="text-primary">OPTIMUS-K</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Generador de Apps de Gestión Empresarial
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Completa este formulario y en 2-3 horas tendrás tu app personalizada lista
          </p>
        </div>

        {/* Progress - Stepper Visual */}
        <Card className="p-6 mb-6">
          <OnboardingStepper
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
            onStepClick={(step) => {
              // Solo permitir ir a pasos ya completados o el actual
              if (step <= currentStep) {
                setCurrentStep(step);
              }
            }}
            completedSteps={Array.from({ length: currentStep - 1 }, (_, i) => i + 1)}
          />
        </Card>

        {/* Form Steps */}
        <Card className="p-8">
          {/* Si es usuario existente con organizaciones, mostrar opciones */}
          {showExistingUserOptions ? (
            <ExistingUserOptions
              userEmail={formData.accountEmail}
              organizations={userOrganizations.map(o => ({
                organization_id: o.organization_id,
                organization_name: o.organization_name,
                role: o.role
              }))}
              onCreateNew={() => {
                setShowExistingUserOptions(false);
                setCurrentStep(2); // Saltar paso 1 (ya tiene cuenta)
              }}
            />
          ) : (
            <>
              {currentStep === 1 && <OnboardingStep1 formData={formData} updateFormData={updateFormData} />}
              {currentStep === 2 && <OnboardingStep2 formData={formData} updateFormData={updateFormData} />}
              {currentStep === 3 && <OnboardingStep3 formData={formData} updateFormData={updateFormData} />}
              {currentStep === 4 && <OnboardingStep4 formData={formData} updateFormData={updateFormData} />}
              {currentStep === 5 && <OnboardingStep5 formData={formData} updateFormData={updateFormData} />}
              {currentStep === 6 && <OnboardingStep6 formData={formData} updateFormData={updateFormData} />}
              {currentStep === 7 && <OnboardingStep7Competitors formData={formData} updateFormData={updateFormData} />}
              {currentStep === 8 && <OnboardingStep8Journey formData={formData} updateFormData={updateFormData} />}
              {currentStep === 9 && <OnboardingStep9Objectives formData={formData} updateFormData={updateFormData} />}
            </>
          )}

          {/* Navigation - solo si no está en opciones de usuario existente */}
          {!showExistingUserOptions && (
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || loading}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>

              <Button
                onClick={handleNext}
                disabled={loading}
              >
                {loading ? (
                  "Guardando..."
                ) : currentStep === TOTAL_STEPS ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Finalizar
                  </>
                ) : (
                  <>
                    Siguiente
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>

        {/* Trial Info */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>🎁 <strong>14 días GRATIS</strong></p>
          <p>Luego desde €99/mes · Sin permanencia · Cancela cuando quieras</p>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;