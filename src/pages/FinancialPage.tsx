import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DollarSign, FileText } from 'lucide-react';
import FinancialDashboard from '@/components/FinancialDashboard';

const FinancialPage = () => {
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
          <Button
            variant="default"
            onClick={() => navigate('/financial/detailed')}
            className="gap-2 bg-black hover:bg-black/90 text-white"
          >
            <FileText className="h-4 w-4" />
            Contabilidad Detallada
          </Button>
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
        <FinancialDashboard />
      </main>
    </div>
  );
};

export default FinancialPage;