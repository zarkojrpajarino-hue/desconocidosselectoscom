import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, TrendingUp, AlertCircle, Trophy, Edit3, ChevronDown, Target, BarChart3, Building2 } from 'lucide-react';
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
} from '@/components/enterprise';

const BusinessMetrics = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showReminder, daysSinceLastUpdate } = useMetricsReminder(user?.id);
  
  const [activeTab, setActiveTab] = useState<string>('my-metrics');
  const [isKpiInfoOpen, setIsKpiInfoOpen] = useState(false);

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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold">Métricas del Negocio (KPI's)</h1>
            </div>
            <div className="flex items-center gap-2">
              <SectionTourButton sectionId="business-metrics" />
              <Button variant="outline" onClick={() => navigate('/metrics-hub')} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver a Métricas
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
                <div className="bg-gradient-to-br from-emerald-500/10 via-background to-background border border-emerald-500/20 rounded-xl p-6 text-sm text-muted-foreground space-y-2">
                  <p><strong className="text-foreground">KPI = Key Performance Indicator</strong> - Métricas operativas del día a día.</p>
                  <p><strong className="text-foreground">🎯 Qué miden:</strong> Ventas, leads, conversiones, NPS, costes, etc.</p>
                  <p><strong className="text-foreground">💡 Diferencia con OKRs:</strong> KPIs miden operación actual, OKRs definen objetivos futuros.</p>
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto mb-6">
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
            <KPITargetsManager />
          </TabsContent>

          <TabsContent value="changes">
            <KPIChangeAnalysis />
          </TabsContent>

          <TabsContent value="benchmark">
            <KPIBenchmarking />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default BusinessMetrics;
