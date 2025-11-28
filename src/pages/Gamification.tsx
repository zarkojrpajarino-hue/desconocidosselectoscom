import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import GamificationDashboard from '@/components/GamificationDashboard';

const Gamification = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <Button
        variant="outline"
        onClick={() => navigate('/home')}
        className="fixed top-4 right-4 z-50 gap-2 shadow-lg"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Volver al Menú</span>
      </Button>

      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            🏆 Gamificación
          </h1>
          <p className="text-muted-foreground">
            Tu progreso, badges y ranking en el equipo
          </p>
        </div>

        <GamificationDashboard />
      </div>
    </div>
  );
};

export default Gamification;
