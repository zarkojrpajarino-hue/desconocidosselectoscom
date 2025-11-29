import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, AlertCircle, Trophy, Edit3 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMetricsReminder } from '@/hooks/useMetricsReminder';
import MyMetrics from './businessMetrics/MyMetrics';
import TeamRanking from './businessMetrics/TeamRanking';

const BusinessMetrics = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showReminder, daysSinceLastUpdate } = useMetricsReminder(user?.id);
  
  const [activeTab, setActiveTab] = useState<'my-metrics' | 'ranking'>('my-metrics');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

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
            <Button
              variant="outline"
              onClick={() => navigate('/home')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Menú
            </Button>
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
