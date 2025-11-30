import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Target, History } from 'lucide-react';
import OKRsDashboard from '@/components/OKRsDashboard';

const OKRsPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

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
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                OKRs Semanales Personalizados
              </h1>
              <p className="text-sm text-muted-foreground">
                Objetivos generados con IA basados en tus tareas de la semana
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => navigate('/okrs/history')}
              className="gap-2"
            >
              <History className="h-4 w-4" />
              Historial de OKRs
            </Button>
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
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <OKRsDashboard />
      </main>
    </div>
  );
};

export default OKRsPage;
