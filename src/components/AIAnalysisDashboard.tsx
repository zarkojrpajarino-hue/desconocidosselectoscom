import { useState, useEffect } from 'react';

interface AIAnalysisDashboardProps {
  onAnalysisComplete?: () => void;
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { 
  DollarSign, 
  Zap, 
  Target, 
  TrendingUp, 
  HelpCircle, 
  Flame,
  Lock,
  RefreshCw,
  FileDown,
  Info,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Activity,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  PieChart as RechartsPie, 
  Pie, 
  Cell,
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { toast } from 'sonner';

interface AnalysisData {
  money_section: {
    revenue: number;
    growth: number;
    efficiency: number;
    margin: number;
    products: Array<{
      name: string;
      margin: number;
      volume: number;
    }>;
    channels: Array<{
      name: string;
      leads: number;
      conversion: number;
      cac: number;
      roi: number;
    }>;
    ai_analysis: string;
  };
  efficiency_section: {
    time_distribution: Array<{
      category: string;
      percentage: number;
    }>;
    team_performance: Array<{
      name: string;
      tasks: number;
      avg_time: number;
      impact: string;
      score: number;
    }>;
    bottlenecks: string[];
    ai_analysis: string;
  };
  focus_section: {
    priorities: Array<{
      title: string;
      impact: string;
      effort: string;
      priority: number;
    }>;
    alerts: Array<{
      type: string;
      message: string;
      severity: string;
    }>;
    executive_summary: string;
  };
  future_section: {
    projections: Array<{
      week: string;
      real: number;
      projected: number;
    }>;
    phase_prediction: {
      phase: number;
      probability: number;
      weeks: number;
    };
    burnout_risks: Array<{
      user: string;
      risk: string;
      reason: string;
      action: string;
    }>;
    scenarios: Array<{
      title: string;
      impact: string;
      roi: string;
    }>;
    ai_analysis: string;
  };
  questions_section: {
    focus_questions: Array<{
      question: string;
      context: string;
      action: string;
    }>;
    money_questions: Array<{
      question: string;
      context: string;
      action: string;
    }>;
    team_questions: Array<{
      question: string;
      context: string;
      action: string;
    }>;
  };
  tough_decisions: {
    decisions: Array<{
      title: string;
      description: string;
      impact: string;
      risk: string;
      recommendation: string;
    }>;
    decision_history: Array<{
      date: string;
      decision: string;
      projected: string;
      real: string;
      accuracy: number;
    }>;
    ai_raw_feedback: string;
  };
  generated_at: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const AIAnalysisDashboard = ({ onAnalysisComplete }: AIAnalysisDashboardProps = {}) => {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('money');
  const [showConfidentialInfo, setShowConfidentialInfo] = useState(true);

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const fetchAnalysis = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const { data: analysisData, error } = await supabase.functions.invoke('analyze-project-data', {
        body: { force_refresh: forceRefresh }
      });

      if (error) throw error;

      setData(analysisData);
      toast.success('Análisis actualizado');
      
      // Notificar que se completó el análisis
      if (onAnalysisComplete) {
        onAnalysisComplete();
      }
    } catch (error) {
      console.error('Error fetching analysis:', error);
      toast.error('Error al cargar análisis');
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async (type: 'executive' | 'strategic' | 'confidential') => {
    toast.info(`Generando PDF ${type}...`);
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Analizando tu proyecto con IA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard de Análisis IA</h2>
          <p className="text-muted-foreground">
            Análisis profundo con recomendaciones accionables
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div 
            className="flex items-center gap-2 bg-muted/20 px-4 py-2 rounded-full cursor-help"
            title="Análisis 100% privado. Sin compartir datos. Sin juzgar, solo hechos."
          >
            <Lock className="w-4 h-4" />
            <span className="text-sm font-medium">Modo Confidencial</span>
            <Info 
              className="w-4 h-4 cursor-pointer" 
              onClick={() => setShowConfidentialInfo(true)}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAnalysis(true)}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => exportPDF('strategic')}
            className="gap-2"
          >
            <FileDown className="w-4 h-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Modal Confidencial */}
      {showConfidentialInfo && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Tu Sala de Guerra Privada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Este espacio está diseñado para que tomes decisiones estratégicas con total libertad:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
                <span>Sin juicios, solo datos reales</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
                <span>Sin compartir información externa</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
                <span>Feedback sincero y directo</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
                <span>Análisis 100% confidencial</span>
              </li>
            </ul>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowConfidentialInfo(false)}>
                Entendido
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="money" className="gap-2">
            <DollarSign className="w-4 h-4" />
            Dinero
          </TabsTrigger>
          <TabsTrigger value="efficiency" className="gap-2">
            <Zap className="w-4 h-4" />
            Eficiencia
          </TabsTrigger>
          <TabsTrigger value="focus" className="gap-2">
            <Target className="w-4 h-4" />
            Foco
          </TabsTrigger>
          <TabsTrigger value="future" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Futuro
          </TabsTrigger>
          <TabsTrigger value="questions" className="gap-2">
            <HelpCircle className="w-4 h-4" />
            Preguntas
          </TabsTrigger>
          <TabsTrigger value="tough" className="gap-2">
            <Flame className="w-4 h-4" />
            Decisiones
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: DINERO */}
        <TabsContent value="money" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Ingresos
                </CardDescription>
                <CardTitle className="text-3xl">€{data.money_section.revenue.toLocaleString()}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Crecimiento
                </CardDescription>
                <CardTitle className="text-3xl text-success">+{data.money_section.growth}%</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Eficiencia
                </CardDescription>
                <CardTitle className="text-3xl">{data.money_section.efficiency}%</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Margen
                </CardDescription>
                <CardTitle className="text-3xl text-primary">{data.money_section.margin}%</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Rentabilidad por Producto/Servicio</CardTitle>
              <CardDescription>Margen neto por tipo de producto</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.money_section.products}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="margin" fill="hsl(var(--primary))" name="Margen %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Canales de Adquisición</CardTitle>
              <CardDescription>ROI y eficiencia por canal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Canal</th>
                      <th className="text-right py-3 px-4">Leads</th>
                      <th className="text-right py-3 px-4">Conv.</th>
                      <th className="text-right py-3 px-4">CAC</th>
                      <th className="text-right py-3 px-4">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.money_section.channels.map((channel, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{channel.name}</td>
                        <td className="text-right py-3 px-4">{channel.leads}</td>
                        <td className="text-right py-3 px-4">{channel.conversion}%</td>
                        <td className="text-right py-3 px-4">€{channel.cac}</td>
                        <td className="text-right py-3 px-4">
                          <Badge variant={channel.roi > 5 ? 'default' : 'secondary'}>
                            {channel.roi}x
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🤖 Análisis de IA - Dónde Está el Dinero
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div dangerouslySetInnerHTML={{ __html: data.money_section.ai_analysis }} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: EFICIENCIA */}
        <TabsContent value="efficiency" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>¿Dónde va el tiempo del equipo?</CardTitle>
              <CardDescription>Distribución de esfuerzo por tipo de tarea</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={data.efficiency_section.time_distribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="percentage"
                    nameKey="category"
                  >
                    {data.efficiency_section.time_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Eficiencia por Persona</CardTitle>
              <CardDescription>Tiempo y impacto de cada miembro</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Persona</th>
                      <th className="text-right py-3 px-4">Tareas</th>
                      <th className="text-right py-3 px-4">Tiempo</th>
                      <th className="text-right py-3 px-4">Impacto</th>
                      <th className="text-right py-3 px-4">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.efficiency_section.team_performance.map((person, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{person.name}</td>
                        <td className="text-right py-3 px-4">{person.tasks}</td>
                        <td className="text-right py-3 px-4">{person.avg_time}h</td>
                        <td className="text-right py-3 px-4">
                          <Badge 
                            variant={
                              person.impact === 'Alto' ? 'default' : 
                              person.impact === 'Medio' ? 'secondary' : 
                              'outline'
                            }
                          >
                            {person.impact}
                          </Badge>
                        </td>
                        <td className="text-right py-3 px-4">
                          <div className="flex flex-col items-end gap-1">
                            <span className="font-medium">{person.score}%</span>
                            <Progress value={person.score} className="w-20 h-2" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-warning">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Cuellos de Botella Detectados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.efficiency_section.bottlenecks.map((bottleneck, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <TrendingDown className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                    <span>{bottleneck}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🤖 Análisis de IA - Eficiencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div dangerouslySetInnerHTML={{ __html: data.efficiency_section.ai_analysis }} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: FOCO */}
        <TabsContent value="focus" className="space-y-6">
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle>🎯 Diagnóstico Inteligente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div dangerouslySetInnerHTML={{ __html: data.focus_section.executive_summary }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Matriz de Priorización</CardTitle>
              <CardDescription>Qué hacer primero basado en impacto y esfuerzo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.focus_section.priorities.map((priority, index) => (
                  <Card key={index} className={
                    priority.priority === 1 ? 'border-2 border-primary' :
                    priority.priority === 2 ? 'border-2 border-warning' :
                    ''
                  }>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{priority.title}</CardTitle>
                        <Badge variant={
                          priority.priority === 1 ? 'default' :
                          priority.priority === 2 ? 'secondary' :
                          'outline'
                        }>
                          P{priority.priority}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Impacto:</span>
                        <Badge variant={priority.impact === 'Alto' ? 'default' : 'secondary'}>
                          {priority.impact}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Esfuerzo:</span>
                        <Badge variant={priority.effort === 'Bajo' ? 'default' : 'secondary'}>
                          {priority.effort}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.focus_section.alerts.map((alert, index) => (
              <Card key={index} className={
                alert.severity === 'high' ? 'border-2 border-destructive' :
                alert.severity === 'medium' ? 'border-2 border-warning' :
                ''
              }>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {alert.severity === 'high' && <AlertTriangle className="w-5 h-5 text-destructive" />}
                    {alert.severity === 'medium' && <Info className="w-5 h-5 text-warning" />}
                    {alert.severity === 'low' && <CheckCircle2 className="w-5 h-5 text-success" />}
                    {alert.type}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{alert.message}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 4: FUTURO */}
        <TabsContent value="future" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Proyección de Crecimiento</CardTitle>
              <CardDescription>Real vs Proyección IA</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.future_section.projections}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="real" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" name="Real" />
                  <Area type="monotone" dataKey="projected" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.3} name="Proyección" strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🎯 Fase Alcanzable
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="text-4xl font-bold">Fase {data.future_section.phase_prediction.phase}</h3>
                  <p className="text-muted-foreground">Crecimiento</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center space-y-1">
                    <p className="text-2xl font-bold text-success">{data.future_section.phase_prediction.probability}%</p>
                    <p className="text-sm text-muted-foreground">Probabilidad</p>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-2xl font-bold text-primary">{data.future_section.phase_prediction.weeks} semanas</p>
                    <p className="text-sm text-muted-foreground">Tiempo estimado</p>
                  </div>
                </div>
                <Progress value={data.future_section.phase_prediction.probability} className="h-3" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-warning">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Usuarios en Riesgo de Burnout
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Usuario</th>
                      <th className="text-left py-3 px-4">Riesgo</th>
                      <th className="text-left py-3 px-4">Razón</th>
                      <th className="text-left py-3 px-4">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.future_section.burnout_risks.map((risk, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{risk.user}</td>
                        <td className="py-3 px-4">
                          <Badge variant={
                            risk.risk === 'Alto' ? 'destructive' :
                            risk.risk === 'Medio' ? 'secondary' :
                            'outline'
                          }>
                            {risk.risk}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm">{risk.reason}</td>
                        <td className="py-3 px-4 text-sm">{risk.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🎮 Simulador de Escenarios
              </CardTitle>
              <CardDescription>Impacto proyectado de diferentes decisiones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.future_section.scenarios.map((scenario, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-base">{scenario.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm">{scenario.impact}</p>
                      <Badge variant="default">{scenario.roi}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🤖 Análisis de IA - Escalabilidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div dangerouslySetInnerHTML={{ __html: data.future_section.ai_analysis }} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: PREGUNTAS */}
        <TabsContent value="questions" className="space-y-6">
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle>💭 Preguntas que Cambiarán tu Negocio</CardTitle>
              <CardDescription>
                Basadas en tus datos reales. Para reflexionar y actuar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  🎯 Preguntas de Foco (responde esta semana)
                </h3>
                {data.questions_section.focus_questions.map((q, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-base">❓ {q.question}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Contexto:</span> {q.context}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Acción sugerida:</span> {q.action}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  💰 Preguntas de Dinero (responde este mes)
                </h3>
                {data.questions_section.money_questions.map((q, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-base">❓ {q.question}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Contexto:</span> {q.context}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Acción sugerida:</span> {q.action}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  👥 Preguntas de Equipo (próxima reunión)
                </h3>
                {data.questions_section.team_questions.map((q, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-base">❓ {q.question}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Contexto:</span> {q.context}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Acción sugerida:</span> {q.action}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button variant="outline" className="w-full">
                Exportar Preguntas para Reunión
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 6: DECISIONES DIFÍCILES */}
        <TabsContent value="tough" className="space-y-6">
          <Card className="border-2 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Espacio Confidencial Activado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Feedback sin filtros. Solo datos duros y recomendaciones sinceras. 
                Este análisis es 100% privado y confidencial.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-destructive" />
                Decisiones Difíciles (pero necesarias)
              </CardTitle>
              <CardDescription>
                La IA ha detectado situaciones que requieren decisiones complicadas pero críticas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.tough_decisions.decisions.map((decision, index) => (
                <Card key={index} className="border-warning">
                  <CardHeader>
                    <CardTitle className="text-base">{index + 1}. {decision.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm">{decision.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-success mt-0.5" />
                        <div className="text-sm">
                          <span className="font-medium">Impacto:</span> {decision.impact}
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                        <div className="text-sm">
                          <span className="font-medium">Riesgo:</span> {decision.risk}
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                        <div className="text-sm">
                          <span className="font-medium">Recomendación:</span> {decision.recommendation}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📜 Decisiones Tomadas y su Impacto
              </CardTitle>
              <CardDescription>
                Historial de aciertos de la IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.tough_decisions.decision_history.map((history, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{history.date}</CardTitle>
                          <CardDescription>{history.decision}</CardDescription>
                        </div>
                        <Badge variant={history.accuracy > 90 ? 'default' : 'secondary'}>
                          {history.accuracy}% acierto
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Proyección IA:</span> {history.projected}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Real:</span> {history.real}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🤖 Feedback Sin Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div dangerouslySetInnerHTML={{ __html: data.tough_decisions.ai_raw_feedback }} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="text-center text-sm text-muted-foreground py-4 border-t">
        <div className="flex items-center justify-center gap-2">
          <Lock className="w-4 h-4" />
          <span>Análisis 100% privado | Sin compartir datos | Sin juicios</span>
        </div>
        <p className="mt-1">Generado: {data.generated_at}</p>
      </div>
    </div>
  );
};

export default AIAnalysisDashboard;
