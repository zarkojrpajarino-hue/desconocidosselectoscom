// ============================================
// PRE-ANALYSIS DATA REVIEW MODAL
// Shows ALL data AI will use + allows updates + predefined questions
// ============================================

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Building2,
  Users,
  DollarSign,
  Target,
  TrendingUp,
  Globe,
  Package,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Brain,
  FileText,
  BarChart3,
  Settings,
  RefreshCw,
  ChevronRight,
  Info,
  Loader2,
  Lightbulb,
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface OrganizationData {
  id: string;
  name: string;
  industry: string;
  business_description: string;
  country_code: string;
  company_size: string;
  founded_year: number;
  business_model: string;
  target_market: string;
  competitive_advantage: string;
  products_services: ProductService[];
  monthly_revenue_goal: number;
  team_members_count: number;
  business_stage?: string;
}

interface DiscoveryProfileData {
  current_situation: string;
  hours_weekly: number;
  risk_tolerance: number;
  motivations: string[];
  skills: string[];
  industries: string[];
  target_audience_preference: string;
  initial_capital: string;
  existing_idea: string;
  business_type_preference: string;
  revenue_urgency: string;
  generated_ideas: unknown[];
  selected_idea_id: string | null;
}

interface ProductService {
  name: string;
  price: number;
  cost: number;
  category: string;
  description: string;
}

interface MetricsSummary {
  totalRevenue: number;
  totalExpenses: number;
  totalLeads: number;
  wonLeads: number;
  conversionRate: number;
  teamMembers: number;
  activeOKRs: number;
  completedTasks: number;
}

interface PreAnalysisQuestion {
  id: string;
  category: 'business' | 'financial' | 'market' | 'team' | 'goals';
  question: string;
  type: 'text' | 'number' | 'slider' | 'radio' | 'checkbox';
  options?: string[];
  placeholder?: string;
  helpText?: string;
  value?: string | number | boolean | string[];
}

interface PreAnalysisDataReviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProceed: (additionalData: Record<string, unknown>) => void;
}

const PREDEFINED_QUESTIONS: PreAnalysisQuestion[] = [
  // Business Context
  {
    id: 'current_challenges',
    category: 'business',
    question: '¿Cuáles son tus 3 mayores desafíos actuales?',
    type: 'text',
    placeholder: 'Ej: Escalar ventas, retener talento, reducir costos...',
    helpText: 'Esto ayuda a la IA a priorizar las recomendaciones',
  },
  {
    id: 'growth_stage',
    category: 'business',
    question: '¿En qué etapa de crecimiento está tu empresa?',
    type: 'radio',
    options: ['Pre-lanzamiento', 'Validación (0-10 clientes)', 'Tracción inicial (10-50 clientes)', 'Crecimiento (50-200 clientes)', 'Escalamiento (200+ clientes)', 'Madurez'],
  },
  {
    id: 'urgency_level',
    category: 'business',
    question: '¿Qué tan urgente es mejorar tu situación actual?',
    type: 'slider',
    helpText: '1 = Sin prisa, 10 = Crítico/Urgente',
  },
  // Financial Context
  {
    id: 'cash_runway',
    category: 'financial',
    question: '¿Cuántos meses de runway tienes actualmente?',
    type: 'radio',
    options: ['Menos de 3 meses', '3-6 meses', '6-12 meses', '12-18 meses', 'Más de 18 meses', 'Rentable/Sin runway'],
  },
  {
    id: 'funding_plans',
    category: 'financial',
    question: '¿Planeas levantar inversión en los próximos 12 meses?',
    type: 'radio',
    options: ['Sí, activamente buscando', 'Sí, pero más adelante', 'No, crecimiento orgánico', 'No aplica'],
  },
  {
    id: 'revenue_model',
    category: 'financial',
    question: '¿Cuál es tu principal modelo de ingresos?',
    type: 'checkbox',
    options: ['Suscripción recurrente', 'Venta única', 'Comisiones/Marketplace', 'Servicios profesionales', 'Publicidad', 'Freemium', 'Licencias'],
  },
  // Market Context
  {
    id: 'competitive_pressure',
    category: 'market',
    question: '¿Cómo describirías la presión competitiva en tu mercado?',
    type: 'radio',
    options: ['Muy baja (casi sin competidores)', 'Baja (pocos competidores)', 'Media (competencia moderada)', 'Alta (muchos competidores)', 'Muy alta (mercado saturado)'],
  },
  {
    id: 'market_trend',
    category: 'market',
    question: '¿Cómo está evolucionando tu mercado?',
    type: 'radio',
    options: ['Creciendo rápidamente (+20% anual)', 'Creciendo moderadamente (5-20% anual)', 'Estable', 'Contrayéndose', 'Transformándose/Disruptivo'],
  },
  {
    id: 'main_competitors',
    category: 'market',
    question: '¿Quiénes son tus 3 principales competidores y qué te diferencia?',
    type: 'text',
    placeholder: 'Ej: Competidor A - más barato pero peor soporte...',
    helpText: 'Incluye nombres y diferenciadores clave',
  },
  // Team Context
  {
    id: 'team_capacity',
    category: 'team',
    question: '¿Tu equipo actual puede manejar 2x el volumen de trabajo?',
    type: 'radio',
    options: ['Sí, con holgura', 'Sí, pero ajustado', 'No, estamos al límite', 'No, ya estamos sobrecargados'],
  },
  {
    id: 'hiring_plans',
    category: 'team',
    question: '¿Qué roles planeas contratar en los próximos 6 meses?',
    type: 'text',
    placeholder: 'Ej: 2 developers, 1 sales, 1 marketing...',
  },
  {
    id: 'team_morale',
    category: 'team',
    question: '¿Cómo calificarías la moral del equipo actualmente?',
    type: 'slider',
    helpText: '1 = Muy baja, 10 = Excelente',
  },
  // Goals
  {
    id: 'primary_goal_12m',
    category: 'goals',
    question: '¿Cuál es tu objetivo principal para los próximos 12 meses?',
    type: 'radio',
    options: ['Aumentar ingresos', 'Reducir costos', 'Expandir a nuevos mercados', 'Lanzar nuevo producto', 'Mejorar retención', 'Levantar inversión', 'Preparar para venta/exit'],
  },
  {
    id: 'revenue_target',
    category: 'goals',
    question: '¿Cuál es tu meta de ingresos para los próximos 12 meses?',
    type: 'text',
    placeholder: 'Ej: €500,000 o 2x ingresos actuales',
  },
  {
    id: 'biggest_fear',
    category: 'goals',
    question: '¿Cuál es tu mayor miedo respecto al negocio?',
    type: 'text',
    placeholder: 'Ej: Quedarme sin dinero, perder a un cliente clave...',
    helpText: 'Ser honesto ayuda a la IA a identificar riesgos reales',
  },
];

export function PreAnalysisDataReview({ open, onOpenChange, onProceed }: PreAnalysisDataReviewProps) {
  const { currentOrganizationId, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [orgData, setOrgData] = useState<OrganizationData | null>(null);
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [countryData, setCountryData] = useState<Record<string, unknown> | null>(null);
  const [competitors, setCompetitors] = useState<Record<string, unknown>[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | number | boolean | string[]>>({});
  const [dataCompleteness, setDataCompleteness] = useState(0);
  const [discoveryProfile, setDiscoveryProfile] = useState<DiscoveryProfileData | null>(null);
  const isDiscovery = orgData?.business_stage === 'discovery';

  useEffect(() => {
    if (open && currentOrganizationId) {
      loadAllData();
    }
  }, [open, currentOrganizationId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Load organization data
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', currentOrganizationId)
        .single();

      if (org) {
        setOrgData(org as unknown as OrganizationData);
        
        // Load country data if available
        if (org.country_code) {
          const { data: country } = await supabase
            .from('country_data')
            .select('*')
            .eq('country_code', org.country_code)
            .single();
          setCountryData(country as Record<string, unknown>);
        }
        
        // Load Discovery profile if Discovery user
        if (org.business_stage === 'discovery') {
          const { data: dp } = await supabase
            .from('discovery_profiles')
            .select('*')
            .eq('organization_id', currentOrganizationId)
            .maybeSingle();
          if (dp) {
            setDiscoveryProfile(dp as unknown as DiscoveryProfileData);
          }
        }
      }

      // Load metrics summary
      const [revenueRes, expenseRes, leadsRes, teamRes, okrsRes, tasksRes] = await Promise.all([
        supabase.from('revenue_entries').select('amount').eq('organization_id', currentOrganizationId),
        supabase.from('expense_entries').select('amount').eq('organization_id', currentOrganizationId),
        supabase.from('leads').select('id, stage, pipeline_stage').eq('organization_id', currentOrganizationId),
        supabase.from('user_roles').select('id').eq('organization_id', currentOrganizationId),
        supabase.from('objectives').select('id').eq('organization_id', currentOrganizationId),
        supabase.from('task_completions').select('id').eq('completed_by_user', true),
      ]);

      const totalRevenue = (revenueRes.data || []).reduce((sum, r) => sum + ((r as { amount?: number }).amount || 0), 0);
      const totalExpenses = (expenseRes.data || []).reduce((sum, e) => sum + ((e as { amount?: number }).amount || 0), 0);
      const leads = leadsRes.data || [];
      const wonLeads = leads.filter(l => 
        (l as { stage?: string }).stage === 'won' || 
        (l as { pipeline_stage?: string }).pipeline_stage === 'closed_won'
      ).length;

      setMetrics({
        totalRevenue,
        totalExpenses,
        totalLeads: leads.length,
        wonLeads,
        conversionRate: leads.length > 0 ? (wonLeads / leads.length) * 100 : 0,
        teamMembers: (teamRes.data || []).length,
        activeOKRs: (okrsRes.data || []).length,
        completedTasks: (tasksRes.data || []).length,
      });

      // Load competitors
      const { data: comps } = await supabase
        .from('competitors')
        .select('*')
        .eq('organization_id', currentOrganizationId);
      setCompetitors((comps || []) as Record<string, unknown>[]);

      // Calculate data completeness
      calculateCompleteness(org);

    } catch (error) {
      logger.error('[PreAnalysisDataReview] Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const calculateCompleteness = (org: Record<string, unknown> | null) => {
    if (!org) {
      setDataCompleteness(0);
      return;
    }

    const fields = [
      'name', 'industry', 'business_description', 'country_code', 
      'company_size', 'business_model', 'target_market', 'competitive_advantage',
      'products_services', 'monthly_revenue_goal'
    ];

    const filled = fields.filter(f => org[f] && org[f] !== '').length;
    setDataCompleteness(Math.round((filled / fields.length) * 100));
  };

  const updateAnswer = (questionId: string, value: string | number | boolean | string[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleProceed = () => {
    const additionalData = {
      answers,
      orgData,
      metrics,
      countryData,
      competitors,
      questionsAnswered: Object.keys(answers).length,
      dataCompleteness,
    };
    onProceed(additionalData);
    onOpenChange(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getCategoryQuestions = (category: PreAnalysisQuestion['category']) => {
    return PREDEFINED_QUESTIONS.filter(q => q.category === category);
  };

  const renderQuestion = (question: PreAnalysisQuestion) => {
    const value = answers[question.id];

    return (
      <Card key={question.id} className="border-border/50">
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1">
                <Label className="text-sm font-medium">{question.question}</Label>
                {question.helpText && (
                  <p className="text-xs text-muted-foreground mt-1">{question.helpText}</p>
                )}
              </div>
            </div>

            {question.type === 'text' && (
              <Textarea
                placeholder={question.placeholder}
                value={(value as string) || ''}
                onChange={(e) => updateAnswer(question.id, e.target.value)}
                className="min-h-[80px]"
              />
            )}

            {question.type === 'number' && (
              <Input
                type="number"
                placeholder={question.placeholder}
                value={(value as number) || ''}
                onChange={(e) => updateAnswer(question.id, Number(e.target.value))}
              />
            )}

            {question.type === 'slider' && (
              <div className="space-y-2">
                <Slider
                  value={[(value as number) || 5]}
                  onValueChange={(v) => updateAnswer(question.id, v[0])}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span className="font-medium text-primary">{(value as number) || 5}</span>
                  <span>10</span>
                </div>
              </div>
            )}

            {question.type === 'radio' && question.options && (
              <RadioGroup
                value={(value as string) || ''}
                onValueChange={(v) => updateAnswer(question.id, v)}
                className="grid grid-cols-1 gap-2"
              >
                {question.options.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                    <Label htmlFor={`${question.id}-${option}`} className="text-sm font-normal cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {question.type === 'checkbox' && question.options && (
              <div className="grid grid-cols-2 gap-2">
                {question.options.map((option) => {
                  const currentValues = (value as string[]) || [];
                  const isChecked = currentValues.includes(option);
                  return (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${question.id}-${option}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          const newValues = checked
                            ? [...currentValues, option]
                            : currentValues.filter(v => v !== option);
                          updateAnswer(question.id, newValues);
                        }}
                      />
                      <Label htmlFor={`${question.id}-${option}`} className="text-sm font-normal cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-lg">Cargando datos de tu empresa...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Preparar Análisis con IA</DialogTitle>
              <DialogDescription>
                Revisa y actualiza tus datos para obtener el análisis más preciso posible
              </DialogDescription>
            </div>
          </div>
          
          {/* Data Completeness Indicator */}
          <div className="mt-4 p-4 bg-card rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Completitud de datos</span>
              <Badge variant={dataCompleteness >= 80 ? 'default' : dataCompleteness >= 50 ? 'secondary' : 'destructive'}>
                {dataCompleteness}%
              </Badge>
            </div>
            <Progress value={dataCompleteness} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {dataCompleteness >= 80 
                ? '✨ Excelente! Tienes datos suficientes para un análisis completo'
                : dataCompleteness >= 50
                ? '📝 Completa más datos para mejorar la precisión del análisis'
                : '⚠️ Datos insuficientes - Completa el perfil de tu empresa para mejores resultados'}
            </p>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="px-6 py-3 border-b bg-muted/30">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="overview" className="gap-2">
                <Building2 className="w-4 h-4" />
                <span className="hidden md:inline">Empresa</span>
              </TabsTrigger>
              <TabsTrigger value="metrics" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden md:inline">Métricas</span>
              </TabsTrigger>
              <TabsTrigger value="market" className="gap-2">
                <Globe className="w-4 h-4" />
                <span className="hidden md:inline">Mercado</span>
              </TabsTrigger>
              <TabsTrigger value="questions" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                <span className="hidden md:inline">Preguntas</span>
              </TabsTrigger>
              <TabsTrigger value="goals" className="gap-2">
                <Target className="w-4 h-4" />
                <span className="hidden md:inline">Objetivos</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[50vh] px-6 py-4">
            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="mt-0 space-y-4">
              <Alert className="border-primary/30 bg-primary/5">
                <Info className="w-4 h-4" />
                <AlertDescription>
                  Estos son los datos de tu empresa que la IA utilizará para generar el análisis. 
                  Puedes editarlos en <strong>Perfil → Configuración</strong>.
                </AlertDescription>
              </Alert>

              {/* Discovery-specific profile section */}
              {isDiscovery && discoveryProfile && (
                <Card className="md:col-span-2 border-primary/30 bg-primary/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Perfil de Descubrimiento
                    </CardTitle>
                    <CardDescription>Datos de tu proceso de validación de idea</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <DataRow label="Situación actual" value={discoveryProfile.current_situation} />
                      <DataRow label="Horas/semana" value={discoveryProfile.hours_weekly?.toString()} />
                      <DataRow label="Tolerancia al riesgo" value={`${discoveryProfile.risk_tolerance}/5`} />
                      <DataRow label="Capital inicial" value={discoveryProfile.initial_capital} />
                      <DataRow label="Público objetivo" value={discoveryProfile.target_audience_preference} />
                      <DataRow label="Tipo de negocio" value={discoveryProfile.business_type_preference} />
                      <DataRow label="Urgencia ingresos" value={discoveryProfile.revenue_urgency} />
                      <DataRow label="Idea seleccionada" value={discoveryProfile.selected_idea_id ? 'Sí' : 'No'} />
                    </div>
                    {discoveryProfile.motivations?.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Motivaciones:</p>
                        <div className="flex flex-wrap gap-1">
                          {discoveryProfile.motivations.map((m, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{m}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {discoveryProfile.skills?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Habilidades:</p>
                        <div className="flex flex-wrap gap-1">
                          {discoveryProfile.skills.map((s, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {discoveryProfile.existing_idea && (
                      <div className="mt-4 p-3 bg-background rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Idea existente:</p>
                        <p className="text-sm">{discoveryProfile.existing_idea}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      {isDiscovery ? 'Tu Proyecto' : 'Información General'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <DataRow label="Nombre" value={orgData?.name} />
                    <DataRow label="Industria" value={orgData?.industry} />
                    {!isDiscovery && (
                      <>
                        <DataRow label="Tamaño" value={orgData?.company_size} />
                        <DataRow label="Año fundación" value={orgData?.founded_year?.toString()} />
                        <DataRow label="Modelo de negocio" value={orgData?.business_model} />
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      Estrategia
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <DataRow label="Mercado objetivo" value={orgData?.target_market} />
                    <DataRow label="Ventaja competitiva" value={orgData?.competitive_advantage} />
                    <DataRow label="Meta de ingresos" value={orgData?.monthly_revenue_goal ? formatCurrency(orgData.monthly_revenue_goal) : undefined} />
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Descripción del Negocio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {orgData?.business_description || 'Sin descripción. Añade una en tu perfil para mejor análisis.'}
                    </p>
                  </CardContent>
                </Card>

                {orgData?.products_services && orgData.products_services.length > 0 && (
                  <Card className="md:col-span-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Package className="w-4 h-4 text-primary" />
                        Productos/Servicios ({orgData.products_services.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {orgData.products_services.slice(0, 6).map((product, idx) => (
                          <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Precio: {formatCurrency(product.price)} | Costo: {formatCurrency(product.cost)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Business Questions */}
              <Separator className="my-6" />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Preguntas sobre tu Negocio
                </h3>
                <p className="text-sm text-muted-foreground">
                  Responder estas preguntas ayudará a la IA a darte recomendaciones más específicas
                </p>
                <div className="space-y-3">
                  {getCategoryQuestions('business').map(renderQuestion)}
                </div>
              </div>
            </TabsContent>

            {/* METRICS TAB */}
            <TabsContent value="metrics" className="mt-0 space-y-4">
              <Alert className="border-success/30 bg-success/5">
                <BarChart3 className="w-4 h-4" />
                <AlertDescription>
                  Estas métricas se calculan automáticamente de tus datos en la plataforma.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  icon={<DollarSign className="w-5 h-5" />}
                  label="Ingresos Totales"
                  value={formatCurrency(metrics?.totalRevenue || 0)}
                  color="success"
                />
                <MetricCard
                  icon={<TrendingUp className="w-5 h-5" />}
                  label="Gastos Totales"
                  value={formatCurrency(metrics?.totalExpenses || 0)}
                  color="destructive"
                />
                <MetricCard
                  icon={<Users className="w-5 h-5" />}
                  label="Total Leads"
                  value={metrics?.totalLeads?.toString() || '0'}
                  color="primary"
                />
                <MetricCard
                  icon={<CheckCircle2 className="w-5 h-5" />}
                  label="Conversión"
                  value={`${(metrics?.conversionRate || 0).toFixed(1)}%`}
                  color="warning"
                />
                <MetricCard
                  icon={<Users className="w-5 h-5" />}
                  label="Equipo"
                  value={`${metrics?.teamMembers || 0} miembros`}
                  color="primary"
                />
                <MetricCard
                  icon={<Target className="w-5 h-5" />}
                  label="OKRs Activos"
                  value={metrics?.activeOKRs?.toString() || '0'}
                  color="info"
                />
                <MetricCard
                  icon={<CheckCircle2 className="w-5 h-5" />}
                  label="Tareas Completadas"
                  value={metrics?.completedTasks?.toString() || '0'}
                  color="success"
                />
                <MetricCard
                  icon={<DollarSign className="w-5 h-5" />}
                  label="Margen"
                  value={metrics?.totalRevenue 
                    ? `${(((metrics.totalRevenue - (metrics.totalExpenses || 0)) / metrics.totalRevenue) * 100).toFixed(1)}%`
                    : '0%'}
                  color={(metrics?.totalRevenue || 0) > (metrics?.totalExpenses || 0) ? 'success' : 'destructive'}
                />
              </div>

              {/* Financial Questions */}
              <Separator className="my-6" />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Preguntas Financieras
                </h3>
                <div className="space-y-3">
                  {getCategoryQuestions('financial').map(renderQuestion)}
                </div>
              </div>
            </TabsContent>

            {/* MARKET TAB */}
            <TabsContent value="market" className="mt-0 space-y-4">
              {countryData ? (
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Globe className="w-4 h-4 text-primary" />
                      Datos de Mercado: {(countryData as { country_name?: string }).country_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-card rounded-lg">
                        <p className="text-2xl font-bold text-primary">{(countryData as { vat_rate?: number }).vat_rate}%</p>
                        <p className="text-xs text-muted-foreground">IVA</p>
                      </div>
                      <div className="text-center p-3 bg-card rounded-lg">
                        <p className="text-2xl font-bold text-primary">{(countryData as { corporate_tax_rate?: number }).corporate_tax_rate}%</p>
                        <p className="text-xs text-muted-foreground">Impuesto Corp.</p>
                      </div>
                      <div className="text-center p-3 bg-card rounded-lg">
                        <p className="text-2xl font-bold text-primary">{(countryData as { internet_penetration?: number }).internet_penetration}%</p>
                        <p className="text-xs text-muted-foreground">Internet</p>
                      </div>
                      <div className="text-center p-3 bg-card rounded-lg">
                        <p className="text-2xl font-bold text-primary">{(countryData as { ecommerce_penetration?: number }).ecommerce_penetration}%</p>
                        <p className="text-xs text-muted-foreground">E-commerce</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Alert className="border-warning/30 bg-warning/5">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    No tienes país configurado. Añádelo en tu perfil para obtener análisis de mercado específico.
                  </AlertDescription>
                </Alert>
              )}

              {/* Competitors */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Competidores Registrados ({competitors.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {competitors.length > 0 ? (
                    <div className="space-y-3">
                      {competitors.map((comp, idx) => (
                        <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                          <p className="font-medium">{(comp as { name?: string }).name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(comp as { description?: string }).description || 'Sin descripción'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No tienes competidores registrados. Añádelos para análisis competitivo.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Market Questions */}
              <Separator className="my-6" />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Preguntas de Mercado
                </h3>
                <div className="space-y-3">
                  {getCategoryQuestions('market').map(renderQuestion)}
                </div>
              </div>
            </TabsContent>

            {/* QUESTIONS TAB */}
            <TabsContent value="questions" className="mt-0 space-y-4">
              <Alert className="border-primary/30 bg-primary/5">
                <Sparkles className="w-4 h-4" />
                <AlertDescription>
                  Responder estas preguntas mejorará significativamente la calidad del análisis.
                  <strong> Cuanto más respondas, más preciso será.</strong>
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Preguntas sobre tu Equipo
                </h3>
                <div className="space-y-3">
                  {getCategoryQuestions('team').map(renderQuestion)}
                </div>
              </div>
            </TabsContent>

            {/* GOALS TAB */}
            <TabsContent value="goals" className="mt-0 space-y-4">
              <Alert className="border-success/30 bg-success/5">
                <Target className="w-4 h-4" />
                <AlertDescription>
                  Definir tus objetivos ayuda a la IA a priorizar las recomendaciones.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Objetivos y Metas
                </h3>
                <div className="space-y-3">
                  {getCategoryQuestions('goals').map(renderQuestion)}
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4" />
            <span>{Object.keys(answers).length} de {PREDEFINED_QUESTIONS.length} preguntas respondidas</span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleProceed} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Generar Análisis
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper Components
function DataRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      {value ? (
        <span className="text-sm font-medium">{value}</span>
      ) : (
        <Badge variant="outline" className="text-xs">Sin datos</Badge>
      )}
    </div>
  );
}

function MetricCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  color: 'primary' | 'success' | 'destructive' | 'warning' | 'info';
}) {
  const colorClasses = {
    primary: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    destructive: 'text-destructive bg-destructive/10',
    warning: 'text-warning bg-warning/10',
    info: 'text-info bg-info/10',
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-lg font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  );
}

export default PreAnalysisDataReview;
