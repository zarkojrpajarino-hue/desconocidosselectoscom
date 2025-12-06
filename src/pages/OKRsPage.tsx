import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Target, History, Building2, ChevronDown, Calendar, CheckSquare, Link2, RotateCcw, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import OKRsDashboard from '@/components/OKRsDashboard';
import { LoadingSpinner } from '@/components/ui/loading-skeleton';
import { SectionTourButton } from '@/components/SectionTourButton';
import {
  OKRQuarterlyView,
  OKRCheckInForm,
  OKRDependencyMap,
  OKRRetrospective,
} from '@/components/enterprise';

const OKRsPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isOkrInfoOpen, setIsOkrInfoOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('weekly');
  const [objectives, setObjectives] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchObjectives();
    }
  }, [user]);

  const fetchObjectives = async () => {
    if (!user?.id) return;
    try {
      // @ts-ignore - Supabase types issue with nested selects
      const { data } = await supabase
        .from('objectives')
        .select('id, title, status, key_results(id, title, current_value, target_value)')
        .eq('user_id', user.id) as { data: any[] | null };
      setObjectives(data || []);
    } catch (error) {
      console.error('Error fetching objectives:', error);
    }
  };

  // Calcular estadísticas de OKRs
  const okrStats = useMemo(() => {
    const totalOKRs = objectives.length;
    const completedOKRs = objectives.filter(o => 
      o.key_results?.length > 0 && o.key_results.every((kr: any) => (kr.current_value || 0) >= (kr.target_value || 1))
    ).length;
    const inProgressOKRs = objectives.filter(o => 
      o.key_results?.some((kr: any) => (kr.current_value || 0) > 0 && (kr.current_value || 0) < (kr.target_value || 1))
    ).length;
    const atRiskOKRs = objectives.filter(o => {
      if (!o.key_results?.length) return false;
      const avgProgress = o.key_results.reduce((sum: number, kr: any) => 
        sum + ((kr.current_value || 0) / (kr.target_value || 1)), 0) / o.key_results.length;
      return avgProgress < 0.3;
    }).length;
    const overallProgress = totalOKRs > 0
      ? Math.round((objectives.reduce((sum, o) => {
          if (!o.key_results?.length) return sum;
          const okrProgress = o.key_results.reduce((krSum: number, kr: any) => 
            krSum + Math.min((kr.current_value || 0) / (kr.target_value || 1), 1), 0
          ) / o.key_results.length;
          return sum + okrProgress;
        }, 0) / totalOKRs) * 100)
      : 0;

    return { totalOKRs, completedOKRs, inProgressOKRs, atRiskOKRs, overallProgress };
  }, [objectives]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Gestión de OKRs
              </h1>
              <p className="text-sm text-muted-foreground">
                Objetivos y Resultados Clave
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SectionTourButton sectionId="okrs" />
            <Button variant="secondary" onClick={() => navigate('/okrs/organization')} className="gap-2">
              <Building2 className="h-4 w-4" />
              OKRs Empresa
            </Button>
            <Button variant="secondary" onClick={() => navigate('/okrs/history')} className="gap-2">
              <History className="h-4 w-4" />
              Historial
            </Button>
            <Button variant="outline" onClick={() => navigate('/metrics')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* OKR Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            variant="primary"
            size="md"
            value={okrStats.totalOKRs}
            label="OKRs Activos"
            change={`Q${Math.ceil((new Date().getMonth() + 1) / 3)}`}
            trend="neutral"
            icon={<Target className="w-5 h-5 text-primary" />}
            className="animate-fade-in"
          />
          
          <StatCard
            variant="success"
            size="md"
            value={okrStats.completedOKRs}
            label="Completados"
            change={okrStats.totalOKRs > 0 ? `${Math.round((okrStats.completedOKRs / okrStats.totalOKRs) * 100)}%` : '0%'}
            trend="up"
            icon={<CheckCircle2 className="w-5 h-5 text-success" />}
            className="animate-fade-in"
            style={{ animationDelay: '100ms' }}
          />
          
          <StatCard
            variant="info"
            size="md"
            value={okrStats.inProgressOKRs}
            label="En Progreso"
            change={`${okrStats.overallProgress}% promedio`}
            trend={okrStats.overallProgress > 50 ? "up" : "neutral"}
            icon={<TrendingUp className="w-5 h-5 text-info" />}
            className="animate-fade-in"
            style={{ animationDelay: '200ms' }}
          />
          
          <StatCard
            variant={okrStats.atRiskOKRs > 0 ? "warning" : "success"}
            size="md"
            value={okrStats.atRiskOKRs}
            label="En Riesgo"
            change={okrStats.atRiskOKRs > 0 ? "Requieren atención" : "Todo OK"}
            trend={okrStats.atRiskOKRs > 0 ? "down" : "up"}
            icon={okrStats.atRiskOKRs > 0 ? <AlertTriangle className="w-5 h-5 text-warning" /> : <CheckCircle2 className="w-5 h-5 text-success" />}
            className="animate-fade-in"
            style={{ animationDelay: '300ms' }}
          />
        </div>

        {/* Explicación */}
        <Collapsible open={isOkrInfoOpen} onOpenChange={setIsOkrInfoOpen} className="mb-6">
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    🎯 ¿Qué son los OKRs?
                  </CardTitle>
                  <ChevronDown className={`h-5 w-5 transition-transform ${isOkrInfoOpen ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="bg-gradient-to-br from-primary/10 via-background to-background border border-primary/20 rounded-xl p-6 text-sm text-muted-foreground space-y-2">
                  <p><strong className="text-foreground">OKR = Objectives and Key Results</strong> - Marcos para metas ambiciosas y medición de progreso.</p>
                  <p><strong className="text-foreground">🎯 Semanales vs Empresa:</strong> Los semanales son tácticos, los de empresa estratégicos.</p>
                  <p><strong className="text-foreground">📊 Estructura:</strong> 1 Objetivo + 3-5 Key Results medibles.</p>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto mb-6">
            <TabsTrigger value="weekly" className="gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden md:inline">Semanales</span>
            </TabsTrigger>
            <TabsTrigger value="quarterly" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden md:inline">Trimestral</span>
            </TabsTrigger>
            <TabsTrigger value="checkin" className="gap-2">
              <CheckSquare className="h-4 w-4" />
              <span className="hidden md:inline">Check-in</span>
            </TabsTrigger>
            <TabsTrigger value="dependencies" className="gap-2">
              <Link2 className="h-4 w-4" />
              <span className="hidden md:inline">Dependencias</span>
            </TabsTrigger>
            <TabsTrigger value="retro" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              <span className="hidden md:inline">Retrospectiva</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="weekly">
            <OKRsDashboard />
          </TabsContent>

          <TabsContent value="quarterly">
            <OKRQuarterlyView />
          </TabsContent>

          <TabsContent value="checkin">
            <OKRCheckInForm />
          </TabsContent>

          <TabsContent value="dependencies">
            <OKRDependencyMap />
          </TabsContent>

          <TabsContent value="retro">
            <OKRRetrospective />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default OKRsPage;
