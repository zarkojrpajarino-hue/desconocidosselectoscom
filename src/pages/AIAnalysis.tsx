import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Brain, Lock, AlertCircle, Sparkles, FileCheck, BarChart3, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionTourButton } from '@/components/SectionTourButton';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import { AIAnalysisDashboard } from '@/components/ai-analysis/AIAnalysisDashboard';
import { PreAnalysisDataReview } from '@/components/ai-analysis/PreAnalysisDataReview';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { useBackendValidation } from '@/hooks/useBackendValidation';
import { UpgradeModal } from '@/components/UpgradeModal';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { DEMO_AI_ANALYSIS, DEMO_MARKET_STUDY } from '@/data/demo-ai-analysis';
import type { AIAnalysisResult } from '@/types/ai-analysis.types';

const AIAnalysis = () => {
  const { user, loading, currentOrganizationId } = useAuth();
  const navigate = useNavigate();
  const { canUseAiAnalysis, plan, aiAnalysisCount, limits } = useSubscriptionLimits();
  const { canUseAiAnalysis: validateAiBackend, validating } = useBackendValidation();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPreAnalysisModal, setShowPreAnalysisModal] = useState(false);
  const [showDemoData, setShowDemoData] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const analysis = useAIAnalysis({
    organization_id: currentOrganizationId || '',
    user_id: user?.id || '',
    autoLoad: true,
  });

  // Iniciar el flujo de generación - mostrar modal primero
  const handleStartGeneration = async () => {
    // Validación frontend primero (rápida)
    const { allowed } = canUseAiAnalysis();
    if (!allowed) {
      setShowUpgradeModal(true);
      return;
    }

    // Validación backend (segura)
    const backendValidation = await validateAiBackend();
    if (!backendValidation.allowed) {
      toast.error(backendValidation.message || 'Has alcanzado el límite de análisis IA de tu plan');
      setShowUpgradeModal(true);
      return;
    }

    // Mostrar modal de revisión de datos
    setShowPreAnalysisModal(true);
  };

  // Proceder con la generación después de revisar datos
  const handleProceedWithGeneration = async (additionalData: Record<string, unknown>) => {
    setShowPreAnalysisModal(false);
    await analysis.generateAnalysis(additionalData);
  };

  if (loading || !currentOrganizationId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  // Verificar si tiene acceso
  const { allowed: hasAccess, remaining } = canUseAiAnalysis();

  // Determine which data to display
  const displayData: AIAnalysisResult | null = showDemoData 
    ? { ...DEMO_AI_ANALYSIS, market_study: DEMO_MARKET_STUDY } as AIAnalysisResult
    : analysis.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background pb-20 md:pb-0">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <Brain className="w-6 h-6 md:w-8 md:h-8 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg md:text-2xl font-bold truncate">Análisis con IA</h1>
              {limits.max_ai_analysis_per_month !== -1 && (
                <p className="text-xs md:text-sm text-muted-foreground">
                  {aiAnalysisCount}/{limits.max_ai_analysis_per_month} análisis este mes
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            {/* Demo Data Toggle */}
            <div className="hidden sm:flex items-center gap-2">
              <Switch
                id="demo-mode"
                checked={showDemoData}
                onCheckedChange={setShowDemoData}
              />
              <Label htmlFor="demo-mode" className="text-xs md:text-sm cursor-pointer flex items-center gap-1">
                {showDemoData ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                <span className="hidden md:inline">Demo</span>
              </Label>
            </div>
            <SectionTourButton sectionId="ai-analysis" className="hidden sm:flex" />
            <Button variant="outline" size="sm" onClick={() => navigate('/home')} className="gap-1 md:gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-7xl">
        {/* Demo Mode Alert */}
        {showDemoData && (
          <Alert className="mb-6 border-primary/50 bg-primary/5">
            <Eye className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                <strong>Modo Demo Activo:</strong> Visualizando datos de ejemplo profesionales. 
                Genera tu propio análisis para ver datos reales de tu negocio.
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowDemoData(false)}
                className="ml-4 hidden sm:flex"
              >
                Desactivar Demo
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Mobile Demo Toggle */}
        <div className="sm:hidden mb-4">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <Label htmlFor="demo-mode-mobile" className="text-sm cursor-pointer flex items-center gap-2">
              {showDemoData ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              Modo Demo
            </Label>
            <Switch
              id="demo-mode-mobile"
              checked={showDemoData}
              onCheckedChange={setShowDemoData}
            />
          </div>
        </div>

        {!hasAccess && !analysis.data && !showDemoData ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Límite Alcanzado</CardTitle>
                  <CardDescription className="text-base">Análisis IA agotados este mes</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <AlertCircle className="w-6 h-6 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">
                    Has alcanzado el límite de {limits.max_ai_analysis_per_month} análisis IA este mes
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Mejora tu plan para obtener más análisis mensuales con IA.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => navigate('/home')} variant="outline" className="flex-1">
                  Volver al Menú
                </Button>
                <Button onClick={() => setShowUpgradeModal(true)} className="flex-1">
                  Ver Planes
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : displayData ? (
          <AIAnalysisDashboard
            data={displayData}
            onRefresh={showDemoData ? undefined : handleStartGeneration}
            onExport={showDemoData ? undefined : (format) => analysis.exportAnalysis(format)}
            loading={analysis.loading}
            isDemo={showDemoData}
          />
        ) : (
          <Card className="max-w-3xl mx-auto overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-8 h-8 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl md:text-3xl mb-2">Análisis Empresarial con IA</CardTitle>
                  <CardDescription className="text-base md:text-lg">
                    Obtén un análisis completo y personalizado de tu negocio
                    {remaining !== -1 && ` (${remaining} análisis restantes)`}
                  </CardDescription>
                </div>
              </div>
            </div>

            <CardContent className="p-6 md:p-8 space-y-6">
              {/* Features del análisis */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <FileCheck className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Revisión de Datos</h4>
                    <p className="text-xs text-muted-foreground">
                      Verifica y actualiza la información antes del análisis
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <BarChart3 className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">8 Secciones</h4>
                    <p className="text-xs text-muted-foreground">
                      Finanzas, crecimiento, equipo, mercado y más
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <Brain className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">IA Avanzada</h4>
                    <p className="text-xs text-muted-foreground">
                      Recomendaciones específicas para tu negocio
                    </p>
                  </div>
                </div>
              </div>

              {/* Qué incluye */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  El análisis incluye:
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  {[
                    'Salud Financiera',
                    'Análisis de Crecimiento',
                    'Rendimiento del Equipo',
                    'Estrategia Empresarial',
                    'Estudio de Mercado',
                    'Proyecciones Futuras',
                    'Opinión Honesta',
                    'Benchmarking',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleStartGeneration}
                  disabled={analysis.loading}
                  size="lg"
                  className="flex-1 text-lg py-6 gap-3"
                >
                  <Sparkles className="w-5 h-5" />
                  {analysis.loading ? 'Generando análisis...' : 'Comenzar Análisis con IA'}
                </Button>
                <Button 
                  onClick={() => setShowDemoData(true)}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  <Eye className="w-5 h-5" />
                  Ver Demo
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Antes de generar, podrás revisar y actualizar los datos que la IA utilizará
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Modal de revisión pre-análisis */}
      <PreAnalysisDataReview
        open={showPreAnalysisModal}
        onOpenChange={setShowPreAnalysisModal}
        onProceed={handleProceedWithGeneration}
      />

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        currentPlan={plan}
        limitType="ai_analysis"
        currentValue={aiAnalysisCount}
        limitValue={limits.max_ai_analysis_per_month}
      />
    </div>
  );
};

export default AIAnalysis;
