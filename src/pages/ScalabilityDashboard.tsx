import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Users, 
  Settings, 
  DollarSign, 
  Package,
  Zap,
  Target,
  CheckCircle2,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

interface Analysis {
  id: string;
  overall_score: number;
  people_score: number;
  process_score: number;
  product_score: number;
  financial_score: number;
  score_reasoning: string;
  analysis_date: string;
}

interface Bottleneck {
  id: string;
  type: 'people' | 'process' | 'product' | 'capital';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact_description: string;
  recommendation_title: string;
  recommendation_description: string;
  estimated_impact: string;
  implementation_effort: string;
  priority_score: number;
  tools_recommended: string[];
  estimated_cost_range: string;
}

interface Dependency {
  id: string;
  person_name: string;
  dependent_tasks: string[];
  dependent_processes: string[];
  risk_level: 'critical' | 'high' | 'medium' | 'low';
  risk_description: string;
  mitigation_recommendations: string[];
}

interface AutomationOpportunity {
  id: string;
  process_name: string;
  current_time_hours_month: number;
  automated_time_hours_month: number;
  time_saved_hours_month: number;
  tools_recommended: string[];
  implementation_steps: string[];
  estimated_cost: string;
  roi_months: number;
  priority: number;
}

const ScalabilityDashboard = () => {
  const { analysisId } = useParams();
  const navigate = useNavigate();
  
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [bottlenecks, setBottlenecks] = useState<Bottleneck[]>([]);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [opportunities, setOpportunities] = useState<AutomationOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (analysisId) loadAnalysis();
  }, [analysisId]);
  
  const loadAnalysis = async () => {
    try {
      const { data: analysisData, error: analysisError } = await supabase
        .from('scalability_analyses')
        .select('*')
        .eq('id', analysisId)
        .single();
      
      if (analysisError) throw analysisError;
      setAnalysis(analysisData);
      
      const { data: bottlenecksData } = await supabase
        .from('scalability_bottlenecks')
        .select('*')
        .eq('analysis_id', analysisId)
        .order('priority_score', { ascending: false });
      
      setBottlenecks((bottlenecksData || []) as Bottleneck[]);
      
      const { data: dependenciesData } = await supabase
        .from('scalability_dependencies')
        .select('*')
        .eq('analysis_id', analysisId);
      
      setDependencies((dependenciesData || []) as Dependency[]);
      
      const { data: opportunitiesData } = await supabase
        .from('automation_opportunities')
        .select('*')
        .eq('analysis_id', analysisId)
        .order('priority', { ascending: false });
      
      setOpportunities((opportunitiesData || []) as AutomationOpportunity[]);
      
    } catch (error) {
      toast.error('Error cargando análisis');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando análisis...</p>
        </div>
      </div>
    );
  }
  
  if (!analysis) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Análisis no encontrado</p>
            <Button onClick={() => navigate('/scalability')}>Volver</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-primary';
    if (score >= 40) return 'text-yellow-600';
    return 'text-destructive';
  };
  
  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'Excelente';
    if (score >= 40) return 'Moderado';
    return 'Crítico';
  };
  
  const getSeverityVariant = (severity: string): 'destructive' | 'secondary' | 'outline' => {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'people': return <Users className="w-5 h-5" />;
      case 'process': return <Settings className="w-5 h-5" />;
      case 'product': return <Package className="w-5 h-5" />;
      case 'capital': return <DollarSign className="w-5 h-5" />;
      default: return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const totalTimeSaved = opportunities.reduce((sum, opp) => sum + (opp.time_saved_hours_month || 0), 0);
  
  return (
    <div className="container mx-auto p-3 md:p-6 space-y-4 md:space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-2 md:gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/scalability')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl md:text-3xl font-bold truncate">Análisis de Escalabilidad</h1>
          <p className="text-xs md:text-base text-muted-foreground">
            {new Date(analysis.analysis_date).toLocaleDateString('es-ES', { 
              day: 'numeric', month: 'long', year: 'numeric' 
            })}
          </p>
        </div>
      </div>
      
      {/* Overall Score */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Score General</p>
              <div className="flex items-baseline gap-3">
                <span className={`text-6xl font-bold ${getScoreColor(analysis.overall_score)}`}>
                  {analysis.overall_score}
                </span>
                <span className="text-3xl text-muted-foreground">/100</span>
              </div>
              <p className={`text-lg font-medium mt-2 ${getScoreColor(analysis.overall_score)}`}>
                {getScoreLabel(analysis.overall_score)}
              </p>
              {analysis.score_reasoning && (
                <p className="text-sm text-muted-foreground mt-3 max-w-2xl">
                  {analysis.score_reasoning}
                </p>
              )}
            </div>
            
            <div className="text-right">
              {analysis.overall_score >= 70 ? (
                <TrendingUp className="w-16 h-16 text-primary mb-2" />
              ) : (
                <TrendingDown className="w-16 h-16 text-destructive mb-2" />
              )}
            </div>
          </div>
          
          {/* Scores by category */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { icon: Users, label: 'Equipo', score: analysis.people_score },
              { icon: Settings, label: 'Procesos', score: analysis.process_score },
              { icon: Package, label: 'Producto', score: analysis.product_score },
              { icon: DollarSign, label: 'Financiero', score: analysis.financial_score },
            ].map(({ icon: Icon, label, score }) => (
              <div key={label}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm font-medium">{label}</p>
                </div>
                <Progress value={score} className="h-2" />
                <p className={`text-lg font-bold mt-1 ${getScoreColor(score)}`}>{score}%</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs */}
      <Tabs defaultValue="bottlenecks" className="space-y-4">
        <TabsList className="flex overflow-x-auto w-full md:grid md:grid-cols-3 gap-1">
          <TabsTrigger value="bottlenecks" className="text-xs md:text-sm whitespace-nowrap">Cuellos ({bottlenecks.length})</TabsTrigger>
          <TabsTrigger value="dependencies" className="text-xs md:text-sm whitespace-nowrap">Dependencias ({dependencies.length})</TabsTrigger>
          <TabsTrigger value="automation" className="text-xs md:text-sm whitespace-nowrap">Automatización ({opportunities.length})</TabsTrigger>
        </TabsList>
        
        {/* BOTTLENECKS */}
        <TabsContent value="bottlenecks" className="space-y-4">
          {bottlenecks.map((bottleneck) => (
            <Card key={bottleneck.id} className="border-l-4 border-l-destructive">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">{getTypeIcon(bottleneck.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <CardTitle className="text-xl">{bottleneck.title}</CardTitle>
                        <Badge variant={getSeverityVariant(bottleneck.severity)}>
                          {bottleneck.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="capitalize">{bottleneck.type}</Badge>
                      </div>
                      <CardDescription className="text-base">{bottleneck.description}</CardDescription>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm text-muted-foreground mb-1">Prioridad</p>
                    <p className="text-2xl font-bold text-primary">{bottleneck.priority_score}</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {bottleneck.impact_description && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <p className="text-sm font-medium text-destructive mb-2">💥 Impacto:</p>
                    <p className="text-sm">{bottleneck.impact_description}</p>
                  </div>
                )}
                
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <Target className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-primary mb-2">{bottleneck.recommendation_title}</p>
                      <p className="text-sm whitespace-pre-line">{bottleneck.recommendation_description}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-primary/20">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Impacto</p>
                      <p className="text-sm font-medium">{bottleneck.estimated_impact}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Esfuerzo</p>
                      <p className="text-sm font-medium">{bottleneck.implementation_effort}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Costo</p>
                      <p className="text-sm font-medium">{bottleneck.estimated_cost_range}</p>
                    </div>
                  </div>
                </div>
                
                {bottleneck.tools_recommended?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">🛠️ Herramientas:</p>
                    <div className="flex flex-wrap gap-2">
                      {bottleneck.tools_recommended.map((tool, idx) => (
                        <Badge key={idx} variant="secondary">{tool}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          
          {bottlenecks.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
                <p className="text-lg font-medium">¡Excelente!</p>
                <p className="text-muted-foreground mt-2">No se identificaron cuellos de botella críticos.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* DEPENDENCIES */}
        <TabsContent value="dependencies" className="space-y-4">
          {dependencies.map((dep) => (
            <Card key={dep.id} className="border-l-4 border-l-destructive">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Users className="w-6 h-6 mt-1" />
                  <div>
                    <CardTitle className="text-xl">{dep.person_name}</CardTitle>
                    <Badge variant={getSeverityVariant(dep.risk_level)} className="mt-2">
                      Riesgo {dep.risk_level.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {dep.risk_description && (
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm font-medium mb-2">⚠️ Riesgo:</p>
                    <p className="text-sm">{dep.risk_description}</p>
                  </div>
                )}
                
                {dep.dependent_tasks?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Tareas Dependientes:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {dep.dependent_tasks.map((task, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground">{task}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {dep.mitigation_recommendations?.length > 0 && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <p className="text-sm font-medium text-primary mb-3">💡 Mitigación:</p>
                    <ol className="list-decimal list-inside space-y-2">
                      {dep.mitigation_recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm">{rec}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          
          {dependencies.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
                <p className="text-lg font-medium">¡Bien distribuido!</p>
                <p className="text-muted-foreground mt-2">No hay dependencias críticas.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* AUTOMATION */}
        <TabsContent value="automation" className="space-y-4">
          {opportunities.length > 0 && (
            <Card className="border-2 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Zap className="w-12 h-12 text-primary" />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Ahorro Total Potencial</h3>
                    <p className="text-3xl font-bold text-primary mb-2">{totalTimeSaved} horas/mes</p>
                    <p className="text-sm text-muted-foreground">
                      ~€{(totalTimeSaved * 60).toLocaleString()}/mes (a €60/hora)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {opportunities.map((opp) => (
            <Card key={opp.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{opp.process_name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">Prioridad {opp.priority}/10</Badge>
                      <Badge variant="outline">ROI en {opp.roi_months} {opp.roi_months === 1 ? 'mes' : 'meses'}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-destructive/10 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Actual</p>
                    <p className="text-2xl font-bold text-destructive">{opp.current_time_hours_month}h</p>
                  </div>
                  <div className="flex items-center justify-center">
                    <ArrowRight className="w-8 h-8 text-primary" />
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Automatizado</p>
                    <p className="text-2xl font-bold text-primary">{opp.automated_time_hours_month}h</p>
                  </div>
                </div>
                
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
                  <p className="text-sm font-medium mb-1">💰 Ahorro</p>
                  <p className="text-3xl font-bold text-primary">{opp.time_saved_hours_month} horas/mes</p>
                </div>
                
                {opp.tools_recommended?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">🛠️ Herramientas:</p>
                    <div className="flex flex-wrap gap-2">
                      {opp.tools_recommended.map((tool, idx) => (
                        <Badge key={idx} variant="secondary">{tool}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {opp.implementation_steps?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-3">📋 Pasos:</p>
                    <ol className="space-y-2">
                      {opp.implementation_steps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-sm">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          
          {opportunities.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
                <p className="text-lg font-medium">Procesos optimizados</p>
                <p className="text-muted-foreground mt-2">No hay oportunidades de automatización identificadas.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScalabilityDashboard;
