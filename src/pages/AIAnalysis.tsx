import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Brain, Lock, AlertCircle } from 'lucide-react';
import AIAnalysisDashboard from '@/components/AIAnalysisDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

const AIAnalysis = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [canUseAI, setCanUseAI] = useState<any>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      checkAIAccess();
    }
  }, [user]);

  const checkAIAccess = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('can_use_ai_analysis', {
        _user_id: user.id
      });

      if (error) {
        console.error('Error checking AI access:', error);
        setCanUseAI({ allowed: false, reason: 'Error al verificar permisos' });
      } else {
        setCanUseAI(data);
      }
    } catch (error) {
      console.error('Exception checking AI access:', error);
      setCanUseAI({ allowed: false, reason: 'Error al verificar permisos' });
    } finally {
      setCheckingAccess(false);
    }
  };

  const handleAnalysisComplete = async () => {
    // Registrar uso de análisis IA
    if (user) {
      await supabase.rpc('register_ai_analysis_usage', {
        _user_id: user.id
      });
      // Revalidar acceso después de usar
      checkAIAccess();
    }
  };

  if (loading || checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">
              Análisis con IA
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/home')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Menú
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {canUseAI && !canUseAI.allowed ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Acceso Restringido</CardTitle>
                  <CardDescription className="text-base">
                    Limitaciones del Plan Gratuito
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="font-semibold text-amber-900">
                    {canUseAI.reason}
                  </p>
                  {canUseAI.days_remaining !== undefined && (
                    <p className="text-sm text-amber-800">
                      Podrás hacer un nuevo análisis en {canUseAI.days_remaining} días.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Restricciones del Plan Gratuito:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span><strong>Solo el administrador</strong> puede ejecutar el análisis con IA</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span><strong>1 análisis por semana</strong> máximo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span><strong>Actualiza a plan de pago</strong> para análisis ilimitados</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => navigate('/home')} variant="outline" className="flex-1">
                  Volver al Menú
                </Button>
                <Button className="flex-1" disabled>
                  Próximamente: Actualizar Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <AIAnalysisDashboard onAnalysisComplete={handleAnalysisComplete} />
        )}
      </main>
    </div>
  );
};

export default AIAnalysis;
