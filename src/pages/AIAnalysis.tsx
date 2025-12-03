import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Brain, Lock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { SectionTourButton } from '@/components/SectionTourButton';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import { AIAnalysisDashboard } from '@/components/ai-analysis/AIAnalysisDashboard';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { useBackendValidation } from '@/hooks/useBackendValidation';
import { UpgradeModal } from '@/components/UpgradeModal';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const AIAnalysis = () => {
  const { user, loading, currentOrganizationId } = useAuth();
  const navigate = useNavigate();
  const { canUseAiAnalysis, plan, aiAnalysisCount, limits } = useSubscriptionLimits();
  const { canUseAiAnalysis: validateAiBackend, validating } = useBackendValidation();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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

  const handleGenerateAnalysis = async () => {
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

    await analysis.generateAnalysis();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Análisis con IA</h1>
              {limits.max_ai_analysis_per_month !== -1 && (
                <p className="text-sm text-muted-foreground">
                  {aiAnalysisCount}/{limits.max_ai_analysis_per_month} análisis este mes
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SectionTourButton sectionId="ai-analysis" />
            <Button variant="outline" onClick={() => navigate('/home')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver al Menú
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {!hasAccess && !analysis.data ? (
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
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="font-semibold text-amber-900">
                    Has alcanzado el límite de {limits.max_ai_analysis_per_month} análisis IA este mes
                  </p>
                  <p className="text-sm text-amber-800">
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
        ) : analysis.data ? (
          <AIAnalysisDashboard
            data={analysis.data}
            onRefresh={handleGenerateAnalysis}
            onExport={(format) => analysis.exportAnalysis(format)}
            loading={analysis.loading}
          />
        ) : (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Generar Análisis con IA</CardTitle>
              <CardDescription>
                Analiza el rendimiento completo de tu empresa
                {remaining !== -1 && ` (${remaining} análisis restantes este mes)`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleGenerateAnalysis}
                disabled={analysis.loading}
                className="w-full"
              >
                {analysis.loading ? 'Generando análisis...' : 'Generar Análisis'}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

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
