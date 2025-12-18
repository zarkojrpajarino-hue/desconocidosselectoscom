import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Building2, Users, Target, RefreshCw, CheckCircle2, AlertCircle, HelpCircle, TrendingUp, Lightbulb, MessageSquare, ShoppingCart, UserCheck, Save, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ToolType } from '@/hooks/useToolContent';

interface ToolDataReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolType: ToolType;
  toolName: string;
  onRegenerate: () => void;
}

interface StrategicQuestion {
  id: string;
  question: string;
  type: 'text' | 'radio';
  options?: string[];
  placeholder?: string;
  helpText?: string;
}

interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'array' | 'json' | 'number';
  placeholder?: string;
}

interface OnboardingDataConfig {
  title: string;
  icon: React.ReactNode;
  fields: FieldConfig[];
}

// Configuration for what onboarding data each tool uses
const TOOL_ONBOARDING_DATA: Record<string, OnboardingDataConfig[]> = {
  buyer_persona: [
    {
      title: 'Información del Cliente Ideal',
      icon: <UserCheck className="w-4 h-4" />,
      fields: [
        { key: 'target_customers', label: 'Clientes Objetivo', type: 'text', placeholder: 'Ej: Empresas medianas del sector tecnología' },
        { key: 'icp_criteria', label: 'Criterios ICP', type: 'text', placeholder: 'Ej: Facturación > 1M€, equipo > 20 personas' },
        { key: 'customer_pain_points', label: 'Dolores del Cliente', type: 'text', placeholder: 'Ej: Falta de automatización, procesos manuales lentos' },
        { key: 'buying_motivations', label: 'Motivaciones de Compra', type: 'text', placeholder: 'Ej: Ahorro de tiempo, reducción de errores' },
      ]
    },
    {
      title: 'Demografía y Mercado',
      icon: <Target className="w-4 h-4" />,
      fields: [
        { key: 'geographic_market', label: 'Mercado Geográfico', type: 'text', placeholder: 'Ej: España, LATAM' },
        { key: 'industry', label: 'Industria', type: 'text', placeholder: 'Ej: SaaS B2B, Consultoría' },
        { key: 'decision_makers', label: 'Tomadores de Decisión', type: 'text', placeholder: 'Ej: CEO, Director de Operaciones' },
      ]
    }
  ],
  customer_journey: [
    {
      title: 'Proceso de Adquisición',
      icon: <TrendingUp className="w-4 h-4" />,
      fields: [
        { key: 'customer_acquisition_channels', label: 'Canales de Adquisición', type: 'text' },
        { key: 'research_process', label: 'Proceso de Investigación del Cliente', type: 'text' },
        { key: 'purchase_triggers', label: 'Disparadores de Compra', type: 'text' },
      ]
    },
    {
      title: 'Retención y Experiencia',
      icon: <Users className="w-4 h-4" />,
      fields: [
        { key: 'customer_retention_rate', label: 'Tasa de Retención (%)', type: 'text' },
        { key: 'repurchase_frequency', label: 'Frecuencia de Recompra', type: 'text' },
        { key: 'nps_score', label: 'NPS Score', type: 'text' },
        { key: 'churn_reasons', label: 'Razones de Abandono', type: 'text' },
      ]
    }
  ],
  growth_model: [
    {
      title: 'Métricas de Crecimiento',
      icon: <TrendingUp className="w-4 h-4" />,
      fields: [
        { key: 'monthly_leads', label: 'Leads Mensuales', type: 'text' },
        { key: 'conversion_rate', label: 'Tasa de Conversión (%)', type: 'text' },
        { key: 'average_ticket', label: 'Ticket Promedio (€)', type: 'text' },
        { key: 'customer_retention_rate', label: 'Retención (%)', type: 'text' },
      ]
    },
    {
      title: 'Canales y Estrategia',
      icon: <Target className="w-4 h-4" />,
      fields: [
        { key: 'customer_acquisition_channels', label: 'Canales de Adquisición', type: 'text' },
        { key: 'monthly_marketing_budget', label: 'Budget Marketing (€)', type: 'text' },
        { key: 'market_growth_rate', label: 'Crecimiento del Mercado (%)', type: 'text' },
      ]
    }
  ],
  lead_scoring: [
    {
      title: 'Perfil de Lead Ideal',
      icon: <UserCheck className="w-4 h-4" />,
      fields: [
        { key: 'icp_criteria', label: 'Criterios ICP', type: 'text' },
        { key: 'decision_makers', label: 'Tomadores de Decisión', type: 'text' },
        { key: 'buying_motivations', label: 'Motivaciones de Compra', type: 'text' },
      ]
    },
    {
      title: 'Proceso Comercial',
      icon: <ShoppingCart className="w-4 h-4" />,
      fields: [
        { key: 'sales_process', label: 'Proceso de Ventas', type: 'text' },
        { key: 'sales_cycle_days', label: 'Ciclo de Ventas (días)', type: 'text' },
        { key: 'conversion_rate', label: 'Tasa de Conversión (%)', type: 'text' },
      ]
    }
  ],
  sales_playbook: [
    {
      title: 'Estrategia Comercial',
      icon: <Target className="w-4 h-4" />,
      fields: [
        { key: 'sales_process', label: 'Proceso de Ventas', type: 'text' },
        { key: 'value_proposition', label: 'Propuesta de Valor', type: 'text' },
        { key: 'competitive_advantage', label: 'Ventaja Competitiva', type: 'text' },
      ]
    },
    {
      title: 'Objeciones y Competencia',
      icon: <MessageSquare className="w-4 h-4" />,
      fields: [
        { key: 'main_objections', label: 'Objeciones Principales', type: 'text' },
        { key: 'top_competitors', label: 'Competidores Principales', type: 'json' },
        { key: 'pricing_strategy', label: 'Estrategia de Precios', type: 'text' },
      ]
    }
  ],
  sales_simulator: [
    {
      title: 'Escenarios de Venta',
      icon: <Users className="w-4 h-4" />,
      fields: [
        { key: 'target_customers', label: 'Tipos de Clientes', type: 'text' },
        { key: 'main_objections', label: 'Objeciones Frecuentes', type: 'text' },
        { key: 'sales_process', label: 'Proceso de Ventas', type: 'text' },
      ]
    },
    {
      title: 'Contexto Comercial',
      icon: <ShoppingCart className="w-4 h-4" />,
      fields: [
        { key: 'average_ticket', label: 'Ticket Promedio (€)', type: 'text' },
        { key: 'sales_cycle_days', label: 'Ciclo de Ventas (días)', type: 'text' },
        { key: 'decision_makers', label: 'Tomadores de Decisión', type: 'text' },
      ]
    }
  ],
  communication_guide: [
    {
      title: 'Identidad de Marca',
      icon: <MessageSquare className="w-4 h-4" />,
      fields: [
        { key: 'value_proposition', label: 'Propuesta de Valor', type: 'text' },
        { key: 'brand_perception', label: 'Percepción de Marca', type: 'text' },
        { key: 'competitive_advantage', label: 'Diferenciación', type: 'text' },
      ]
    },
    {
      title: 'Audiencia y Mensaje',
      icon: <Users className="w-4 h-4" />,
      fields: [
        { key: 'target_customers', label: 'Audiencia Objetivo', type: 'text' },
        { key: 'buying_motivations', label: 'Motivaciones del Cliente', type: 'text' },
        { key: 'customer_pain_points', label: 'Problemas a Resolver', type: 'text' },
      ]
    }
  ],
};

// Professional strategic questions per tool type
const TOOL_QUESTIONS: Record<string, StrategicQuestion[]> = {
  buyer_persona: [
    { 
      id: 'persona_decision_process', 
      question: '¿Cómo es el proceso de decisión típico de tu cliente ideal?', 
      type: 'text', 
      placeholder: 'Ej: Investiga online 2 semanas, consulta con su equipo, necesita aprobación del CFO...',
      helpText: 'Describe los pasos que sigue desde que detecta la necesidad hasta que compra'
    },
    { 
      id: 'persona_information_sources', 
      question: '¿Dónde busca información tu cliente antes de comprar?', 
      type: 'radio', 
      options: ['Google/SEO', 'LinkedIn/Redes profesionales', 'Recomendaciones de colegas', 'Eventos/Webinars', 'Contenido especializado (blogs, podcasts)', 'Combinación de varios'] 
    },
    { 
      id: 'persona_success_metric', 
      question: '¿Cómo mide tu cliente el éxito de la compra?', 
      type: 'text', 
      placeholder: 'Ej: ROI en 6 meses, reducción de tiempo, mejora en métricas específicas...',
      helpText: 'Qué resultados concretos espera obtener'
    },
  ],
  customer_journey: [
    { 
      id: 'journey_awareness_trigger', 
      question: '¿Qué evento o situación hace que el cliente se dé cuenta que tiene un problema?', 
      type: 'text', 
      placeholder: 'Ej: Pérdida de un cliente importante, auditoría fallida, nuevo competidor...',
      helpText: 'El momento "aha" que inicia la búsqueda'
    },
    { 
      id: 'journey_evaluation_criteria', 
      question: '¿Qué criterios usa el cliente para evaluar opciones?', 
      type: 'text', 
      placeholder: 'Ej: Precio vs calidad, tiempo de implementación, soporte incluido, referencias...',
      helpText: 'Los factores decisivos en la comparación'
    },
    { 
      id: 'journey_post_purchase', 
      question: '¿Qué hace tu cliente después de comprar para validar su decisión?', 
      type: 'radio', 
      options: ['Mide resultados inmediatamente', 'Busca validación de su equipo', 'Compara con expectativas iniciales', 'Espera resultados a largo plazo'] 
    },
  ],
  growth_model: [
    { 
      id: 'growth_best_channel', 
      question: '¿Cuál es tu canal de adquisición más rentable actualmente?', 
      type: 'radio', 
      options: ['SEO/Contenido orgánico', 'Ads pagados (Google/Meta)', 'Referidos/Boca a boca', 'Outbound comercial', 'Partnerships/Alianzas', 'Aún explorando'] 
    },
    { 
      id: 'growth_activation_moment', 
      question: '¿Cuál es el momento "aha" que define que un usuario está activado?', 
      type: 'text', 
      placeholder: 'Ej: Primera compra, uso de feature clave, invitar a un colega, completar onboarding...',
      helpText: 'La acción que predice retención a largo plazo'
    },
    { 
      id: 'growth_viral_potential', 
      question: '¿Cómo pueden tus clientes actuales traerte nuevos clientes?', 
      type: 'text', 
      placeholder: 'Ej: Programa de referidos, compartir resultados, casos de éxito, comunidad...',
      helpText: 'Mecanismos de viralidad y referral'
    },
  ],
  lead_scoring: [
    { 
      id: 'scoring_ideal_signals', 
      question: '¿Qué señales indican que un lead está listo para comprar?', 
      type: 'text', 
      placeholder: 'Ej: Visita pricing, solicita demo, descarga caso de estudio, múltiples visitas en 1 semana...',
      helpText: 'Comportamientos que predicen conversión'
    },
    { 
      id: 'scoring_disqualifying', 
      question: '¿Qué características descalifican inmediatamente a un lead?', 
      type: 'text', 
      placeholder: 'Ej: Empresa muy pequeña, industria no compatible, sin presupuesto, solo curiosidad...',
      helpText: 'Red flags que indican mala fit'
    },
    { 
      id: 'scoring_urgency_indicator', 
      question: '¿Qué indica urgencia real en un lead?', 
      type: 'radio', 
      options: ['Pregunta por implementación inmediata', 'Menciona deadline específico', 'Involucra a múltiples stakeholders', 'Compara activamente con competencia', 'Tiene presupuesto aprobado'] 
    },
  ],
  sales_playbook: [
    { 
      id: 'playbook_winning_approach', 
      question: '¿Cuál es tu "arma secreta" para ganar deals complicados?', 
      type: 'text', 
      placeholder: 'Ej: Demo personalizada, piloto gratuito, garantía de resultados, caso de éxito específico...',
      helpText: 'La táctica que marca la diferencia'
    },
    { 
      id: 'playbook_common_objection', 
      question: '¿Cuál es la objeción más difícil de superar y cómo la manejas?', 
      type: 'text', 
      placeholder: 'Ej: "Es muy caro" → Mostrar ROI en X meses, comparar con costo de no actuar...',
      helpText: 'Tu mejor respuesta a la objeción más común'
    },
    { 
      id: 'playbook_deal_killer', 
      question: '¿Qué hace que pierdas deals que pensabas tener ganados?', 
      type: 'radio', 
      options: ['Competidor con mejor precio', 'Proceso de decisión muy largo', 'Cambio de prioridades del cliente', 'Falta de champion interno', 'Budget cortado', 'Status quo ganó'] 
    },
  ],
  sales_simulator: [
    { 
      id: 'simulator_hardest_scenario', 
      question: '¿Cuál es el escenario de venta más desafiante para tu equipo?', 
      type: 'text', 
      placeholder: 'Ej: Cliente escéptico que ya probó competidores, C-level con poco tiempo, procurement agresivo...',
      helpText: 'La situación donde más entrenamiento necesitan'
    },
    { 
      id: 'simulator_client_types', 
      question: '¿Qué tipos de clientes son más comunes en tu pipeline?', 
      type: 'radio', 
      options: ['Empresas que nunca han comprado algo así', 'Clientes de competidores insatisfechos', 'Empresas en crecimiento rápido', 'Corporaciones con proceso largo', 'Startups con decisión rápida'] 
    },
    { 
      id: 'simulator_training_focus', 
      question: '¿En qué parte del proceso necesita más práctica tu equipo?', 
      type: 'radio', 
      options: ['Apertura y rapport inicial', 'Descubrimiento de necesidades', 'Presentación de valor', 'Manejo de objeciones', 'Técnicas de cierre', 'Negociación de precio'] 
    },
  ],
  communication_guide: [
    { 
      id: 'comms_brand_personality', 
      question: '¿Si tu marca fuera una persona, cómo la describirías?', 
      type: 'text', 
      placeholder: 'Ej: Un mentor experimentado que habla claro, un amigo experto que simplifica lo complejo...',
      helpText: 'La personalidad que quieres transmitir'
    },
    { 
      id: 'comms_differentiation', 
      question: '¿Qué quieres que piensen los clientes cuando escuchen tu marca?', 
      type: 'text', 
      placeholder: 'Ej: "Son los expertos en X", "Son los más accesibles", "Son los que garantizan resultados"...',
      helpText: 'El posicionamiento mental deseado'
    },
    { 
      id: 'comms_tone', 
      question: '¿Qué tono prefieres en tu comunicación?', 
      type: 'radio', 
      options: ['Profesional y formal', 'Cercano y conversacional', 'Experto pero accesible', 'Inspirador y motivacional', 'Directo y sin rodeos'] 
    },
  ],
};

export const ToolDataReviewModal = ({ 
  open, 
  onOpenChange, 
  toolType, 
  toolName,
  onRegenerate 
}: ToolDataReviewModalProps) => {
  const { currentOrganizationId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [organization, setOrganization] = useState<Record<string, unknown> | null>(null);
  const [editedData, setEditedData] = useState<Record<string, string | number>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('data');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (open && currentOrganizationId) {
      fetchOrganizationData();
      setIsEditing(false);
      setEditedData({});
    }
  }, [open, currentOrganizationId]);

  const fetchOrganizationData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', currentOrganizationId)
        .single();

      if (error) throw error;
      setOrganization(data);
      
      // Initialize edited data with current values
      const dataConfig = TOOL_ONBOARDING_DATA[toolType] || [];
      const initialData: Record<string, string | number> = {};
      dataConfig.forEach(section => {
        section.fields.forEach(field => {
          const value = data[field.key];
          if (value !== null && value !== undefined) {
            if (field.type === 'json' && typeof value === 'object') {
              initialData[field.key] = JSON.stringify(value);
            } else {
              initialData[field.key] = String(value);
            }
          } else {
            initialData[field.key] = '';
          }
        });
      });
      setEditedData(initialData);
    } catch (error) {
      console.error('Error fetching organization:', error);
      toast.error('Error al cargar datos de la organización');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (key: string, value: string) => {
    setEditedData(prev => ({ ...prev, [key]: value }));
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSaveData = async () => {
    setSaving(true);
    try {
      // Build update object with proper types
      const dataConfig = TOOL_ONBOARDING_DATA[toolType] || [];
      const updateObj: Record<string, unknown> = {};
      
      dataConfig.forEach(section => {
        section.fields.forEach(field => {
          const value = editedData[field.key];
          if (value !== undefined && value !== '') {
            if (field.type === 'number') {
              updateObj[field.key] = parseFloat(String(value)) || 0;
            } else if (field.type === 'json') {
              try {
                updateObj[field.key] = JSON.parse(String(value));
              } catch {
                updateObj[field.key] = String(value);
              }
            } else {
              updateObj[field.key] = String(value);
            }
          }
        });
      });

      const { error } = await supabase
        .from('organizations')
        .update(updateObj)
        .eq('id', currentOrganizationId);

      if (error) throw error;
      
      toast.success('Datos guardados correctamente');
      setIsEditing(false);
      await fetchOrganizationData();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Error al guardar los datos');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      if (Object.keys(answers).length > 0) {
        console.log('Strategic answers for', toolType, ':', answers);
      }
      
      onRegenerate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar');
    } finally {
      setRegenerating(false);
    }
  };

  const questions = TOOL_QUESTIONS[toolType] || [];
  const dataConfig = TOOL_ONBOARDING_DATA[toolType] || [];

  const calculateCompleteness = () => {
    if (!organization || dataConfig.length === 0) return 0;
    
    const allFields = dataConfig.flatMap(section => section.fields.map(f => f.key));
    const filledFields = allFields.filter(field => {
      const value = editedData[field] || organization[field];
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim() !== '';
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object') return Object.keys(value).length > 0;
      return true;
    });
    
    return allFields.length > 0 ? Math.round((filledFields.length / allFields.length) * 100) : 0;
  };

  const renderEditableField = (field: FieldConfig) => {
    const value = editedData[field.key] ?? '';
    
    if (!isEditing) {
      // Read-only display
      if (value === '' || value === null || value === undefined) {
        return <span className="text-muted-foreground italic text-xs">No definido - Haz clic en Editar para añadir</span>;
      }
      
      if (field.type === 'json') {
        try {
          const parsed = typeof value === 'string' ? JSON.parse(value) : value;
          if (Array.isArray(parsed)) {
            return (
              <div className="flex flex-wrap gap-1">
                {parsed.slice(0, 3).map((item: unknown, idx: number) => {
                  const displayText = typeof item === 'object' && item !== null 
                    ? String((item as Record<string, unknown>).name || JSON.stringify(item).slice(0, 30))
                    : String(item);
                  return (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {displayText}
                    </Badge>
                  );
                })}
                {parsed.length > 3 && <Badge variant="secondary" className="text-xs">+{parsed.length - 3}</Badge>}
              </div>
            );
          }
        } catch {
          // If parse fails, show as text
        }
        return <span className="text-xs">{String(value).slice(0, 80)}...</span>;
      }
      
      const strValue = String(value);
      return <span className="text-sm">{strValue.length > 100 ? strValue.slice(0, 100) + '...' : strValue}</span>;
    }

    // Editable input
    if (field.type === 'number') {
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => handleFieldChange(field.key, e.target.value)}
          placeholder={field.placeholder || `Ingresa ${field.label.toLowerCase()}`}
          className="h-9"
        />
      );
    }

    return (
      <Textarea
        value={String(value)}
        onChange={(e) => handleFieldChange(field.key, e.target.value)}
        placeholder={field.placeholder || `Describe ${field.label.toLowerCase()}`}
        className="min-h-[70px] resize-none"
      />
    );
  };

  const completeness = calculateCompleteness();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            Actualizar {toolName}
          </DialogTitle>
          <DialogDescription>
            Revisa los datos del onboarding y responde preguntas estratégicas para personalizar tu herramienta
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Completeness indicator */}
            <Card className={completeness >= 70 ? 'border-green-500/50 bg-green-500/5' : 'border-amber-500/50 bg-amber-500/5'}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {completeness >= 70 ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                    )}
                    <span className="font-medium">Datos para {toolName}: {completeness}% completos</span>
                  </div>
                  <Badge variant={completeness >= 70 ? 'default' : 'secondary'}>
                    {completeness >= 70 ? 'Datos suficientes' : 'Datos incompletos'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="data" className="gap-1">
                  <Building2 className="w-3 h-3" />
                  Datos del Onboarding
                </TabsTrigger>
                <TabsTrigger value="questions" className="gap-1">
                  <Lightbulb className="w-3 h-3" />
                  Preguntas Estratégicas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="data" className="space-y-4 mt-4">
                {dataConfig.length > 0 ? (
                  <div className="space-y-4">
                    {/* Edit toggle */}
                    <div className="flex justify-end">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setIsEditing(false);
                              fetchOrganizationData();
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={handleSaveData}
                            disabled={saving}
                            className="gap-1"
                          >
                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            Guardar Cambios
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setIsEditing(true)}
                          className="gap-1"
                        >
                          <Pencil className="w-3 h-3" />
                          Editar Datos
                        </Button>
                      )}
                    </div>

                    {dataConfig.map((section, sectionIdx) => (
                      <Card key={sectionIdx} className={isEditing ? 'border-primary/30' : ''}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            {section.icon}
                            {section.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {section.fields.map((field, fieldIdx) => (
                            <div key={fieldIdx} className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground font-medium">
                                {field.label}
                              </Label>
                              {renderEditableField(field)}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                    
                    {!isEditing && (
                      <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <p className="text-xs text-primary flex items-center gap-1">
                          <Pencil className="w-3 h-3" />
                          Haz clic en <strong className="mx-1">Editar Datos</strong> para actualizar la información
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No hay configuración de datos específica para esta herramienta</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="questions" className="space-y-4 mt-4">
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm text-primary flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Responde estas preguntas para generar una herramienta más precisa y personalizada
                  </p>
                </div>

                {questions.length > 0 ? (
                  <div className="space-y-5">
                    {questions.map((q) => (
                      <div key={q.id} className="space-y-2 p-4 border rounded-lg bg-card">
                        <Label htmlFor={q.id} className="text-sm font-medium">{q.question}</Label>
                        {q.helpText && (
                          <p className="text-xs text-muted-foreground">{q.helpText}</p>
                        )}
                        {q.type === 'text' ? (
                          <Textarea
                            id={q.id}
                            placeholder={q.placeholder}
                            value={answers[q.id] || ''}
                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                            className="min-h-[80px] mt-2"
                          />
                        ) : (
                          <RadioGroup
                            value={answers[q.id] || ''}
                            onValueChange={(value) => handleAnswerChange(q.id, value)}
                            className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2"
                          >
                            {q.options?.map((option) => (
                              <div key={option} className="flex items-center space-x-2 p-2 rounded border hover:bg-muted/50 transition-colors">
                                <RadioGroupItem value={option} id={`${q.id}-${option}`} />
                                <Label htmlFor={`${q.id}-${option}`} className="text-sm font-normal cursor-pointer flex-1">
                                  {option}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No hay preguntas estratégicas para esta herramienta</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleRegenerate} disabled={regenerating} className="gap-2">
                {regenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Regenerando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Regenerar {toolName}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ToolDataReviewModal;
