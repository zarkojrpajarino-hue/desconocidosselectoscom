import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, TrendingUp, AlertCircle, Trophy, Edit3, ChevronDown, Target, BarChart3, Building2, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useMetricsReminder } from '@/hooks/useMetricsReminder';
import MyMetrics from './businessMetrics/MyMetrics';
import TeamRanking from './businessMetrics/TeamRanking';
import { SectionTourButton } from '@/components/SectionTourButton';
import {
  KPITargetsManager,
  KPIChangeAnalysis,
  KPIBenchmarking,
  KPIDataFlowPanel,
} from '@/components/enterprise';

const BusinessMetrics = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showReminder, daysSinceLastUpdate } = useMetricsReminder(user?.id);
  
  const [activeTab, setActiveTab] = useState<string>('my-metrics');
  const [isKpiInfoOpen, setIsKpiInfoOpen] = useState(false);
  const [showDemoData, setShowDemoData] = useState(true);
  const [hasRealData, setHasRealData] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'ranking') {
      setActiveTab('ranking');
    }
  }, [location.search]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-primary shrink-0" />
              <h1 className="text-base sm:text-lg md:text-2xl font-bold truncate">KPIs del Negocio</h1>
            </div>
            <div className="flex items-center gap-1 md:gap-2 shrink-0">
              {!hasRealData && (
                <div className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded-lg">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="kpi-demo-toggle" className="text-xs text-muted-foreground hidden md:inline">
                    Demo
                  </Label>
                  <Switch
                    id="kpi-demo-toggle"
                    checked={showDemoData}
                    onCheckedChange={setShowDemoData}
                  />
                </div>
              )}
              <SectionTourButton sectionId="business-metrics" className="hidden md:flex" />
              <Button variant="outline" onClick={() => navigate('/metrics')} className="gap-1 p-2 md:px-3" size="sm">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden md:inline">Métricas</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Explicación */}
        <Collapsible open={isKpiInfoOpen} onOpenChange={setIsKpiInfoOpen} className="mb-6">
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    📊 ¿Qué son los KPI's?
                  </CardTitle>
                  <ChevronDown className={`h-5 w-5 transition-transform ${isKpiInfoOpen ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="bg-gradient-to-br from-emerald-500/10 via-background to-background border border-emerald-500/20 rounded-xl p-6 text-sm text-muted-foreground space-y-4">
                  <div>
                    <p className="font-semibold text-foreground mb-1">🎯 ¿Qué son los KPIs?</p>
                    <p><strong className="text-foreground">KPI = Key Performance Indicator</strong> - Métricas operativas del día a día que miden el rendimiento de tu negocio.</p>
                  </div>
                  
                  <div>
                    <p className="font-semibold text-foreground mb-1">📊 ¿Cómo funcionan?</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>Mis Métricas:</strong> Aquí introduces tus datos de ventas, marketing, operaciones y cliente cada semana/mes.</li>
                      <li><strong>Ranking:</strong> Compara tu rendimiento con otros usuarios de tu equipo.</li>
                      <li><strong>Metas:</strong> Define objetivos para cada KPI y sigue tu progreso hacia ellos.</li>
                      <li><strong>Cambios:</strong> Analiza variaciones en tus métricas y entiende qué factores influyen.</li>
                      <li><strong>Benchmark:</strong> Compara tus KPIs con promedios de la industria y mejores prácticas.</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-foreground mb-1">🔗 ¿Dónde se usan estos datos?</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>Finanzas → Proyecciones:</strong> Tus ingresos, costes y CAC alimentan las proyecciones financieras.</li>
                      <li><strong>CRM → Forecast:</strong> Leads y conversiones afectan las proyecciones del pipeline.</li>
                      <li><strong>Análisis IA:</strong> Todos tus KPIs son analizados por la IA para darte recomendaciones personalizadas.</li>
                      <li><strong>Dashboard:</strong> Los KPIs clave aparecen en tu resumen ejecutivo.</li>
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-emerald-500/20">
                    <p className="text-xs text-muted-foreground">
                      💡 <strong>Tip:</strong> Actualiza tus métricas al menos 1 vez por semana para obtener análisis más precisos y recomendaciones relevantes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {showReminder && activeTab === 'my-metrics' && (
          <Alert className="mb-6 border-amber-500 bg-amber-500/10">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <AlertDescription className="text-amber-900 dark:text-amber-100">
              {daysSinceLastUpdate === 0 
                ? '¡Bienvenido! Actualiza tus métricas para mejores insights.'
                : `Han pasado ${daysSinceLastUpdate} días desde tu última actualización.`}
            </AlertDescription>
          </Alert>
        )}

        {/* Panel de Flujo de Datos KPIs */}
        <KPIDataFlowPanel className="mb-6" />

        {/* Tabs - Mobile scrollable */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex w-full overflow-x-auto md:grid md:grid-cols-5 h-auto mb-6 gap-1 p-1">
            <TabsTrigger value="my-metrics" className="gap-2">
              <Edit3 className="h-4 w-4" />
              <span className="hidden md:inline">Mis Métricas</span>
            </TabsTrigger>
            <TabsTrigger value="ranking" className="gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden md:inline">Ranking</span>
            </TabsTrigger>
            <TabsTrigger value="targets" className="gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden md:inline">Metas</span>
            </TabsTrigger>
            <TabsTrigger value="changes" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden md:inline">Cambios</span>
            </TabsTrigger>
            <TabsTrigger value="benchmark" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden md:inline">Benchmark</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-metrics">
            <MyMetrics />
          </TabsContent>

          <TabsContent value="ranking">
            <TeamRanking />
          </TabsContent>

          <TabsContent value="targets">
            <KPITargetsManager showDemoData={showDemoData && !hasRealData} />
          </TabsContent>

          <TabsContent value="changes">
            <KPIChangeAnalysis showDemoData={showDemoData && !hasRealData} />
          </TabsContent>

          <TabsContent value="benchmark">
            <KPIBenchmarking showDemoData={showDemoData && !hasRealData} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default BusinessMetrics;
