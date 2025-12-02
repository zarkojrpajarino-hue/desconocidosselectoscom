import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, AlertCircle, Trophy, Edit3, ChevronDown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useMetricsReminder } from '@/hooks/useMetricsReminder';
import MyMetrics from './businessMetrics/MyMetrics';
import TeamRanking from './businessMetrics/TeamRanking';
import { SectionTourButton } from '@/components/SectionTourButton';

const BusinessMetrics = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showReminder, daysSinceLastUpdate } = useMetricsReminder(user?.id);
  
  const [activeTab, setActiveTab] = useState<'my-metrics' | 'ranking'>('my-metrics');
  const [isKpiInfoOpen, setIsKpiInfoOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Detect if coming from user metrics page
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
              <h1 className="text-2xl font-bold">
                Métricas del Negocio (KPI's)
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <SectionTourButton sectionId="business-metrics" />
              <Button
                variant="outline"
                onClick={() => navigate('/metrics-hub')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a Métricas
              </Button>
            </div>
          </div>
          
          {/* Tabs Navigation */}
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'my-metrics' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('my-metrics')}
              className="gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Mis Métricas
            </Button>
            <Button
              variant={activeTab === 'ranking' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('ranking')}
              className="gap-2"
            >
              <Trophy className="w-4 h-4" />
              Ranking del Equipo
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Explicación de KPIs */}
        <Collapsible
          open={isKpiInfoOpen}
          onOpenChange={setIsKpiInfoOpen}
          className="mb-6"
        >
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    📊 ¿Qué son los KPI's y para qué sirven?
                  </CardTitle>
                  <ChevronDown 
                    className={`h-5 w-5 text-muted-foreground transition-transform ${
                      isKpiInfoOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="bg-gradient-to-br from-emerald-500/10 via-background to-background border border-emerald-500/20 rounded-xl p-6">
                  <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
                    <p>
                      <strong className="text-foreground">KPI = Key Performance Indicator</strong> (Indicador Clave de Rendimiento). Son métricas operativas del día a día que miden cómo está funcionando tu negocio <span className="text-primary font-medium">AHORA MISMO</span>.
                    </p>
                    <p>
                      <strong className="text-foreground">🎯 Qué miden:</strong> Ventas, pedidos, leads generados, conversiones, NPS, costes operativos, tiempo de producción, satisfacción del cliente, etc. Son datos reales y actuales de tu operación.
                    </p>
                    <p>
                      <strong className="text-foreground">🔍 Para qué sirven:</strong> Te permiten tomar decisiones rápidas basadas en datos. Si ves que la tasa de conversión cae, puedes actuar inmediatamente. Si el NPS baja, sabes que hay problemas de satisfacción. Son tu radar operativo.
                    </p>
                    <p>
                      <strong className="text-foreground">💡 Diferencia con OKRs:</strong> Los KPIs miden lo que ya haces (operación actual). Los OKRs definen hacia dónde quieres ir (objetivos ambiciosos futuros). Ambos se complementan.
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
                ? '¡Bienvenido! Actualiza tus métricas para que la IA pueda darte mejores insights y recomendaciones personalizadas.'
                : `Han pasado ${daysSinceLastUpdate} días desde tu última actualización. Actualiza tus métricas para obtener análisis más precisos.`
              }
            </AlertDescription>
          </Alert>
        )}
        
        {activeTab === 'my-metrics' ? <MyMetrics /> : <TeamRanking />}
      </main>
    </div>
  );
};

export default BusinessMetrics;
