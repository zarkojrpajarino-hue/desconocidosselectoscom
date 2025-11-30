import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DollarSign, FileText } from 'lucide-react';
import FinancialDashboard from '@/components/FinancialDashboard';
import { toast } from 'sonner';

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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-success" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-success to-primary bg-clip-text text-transparent">
                  Panel Financiero
                </h1>
                <p className="text-sm text-muted-foreground">
                  Métricas automáticas desde KPIs, Tareas y OKRs
                </p>
              </div>
            </div>
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
        {/* Explicación del Panel Financiero */}
        <div className="bg-gradient-to-br from-primary/10 via-background to-background border border-primary/20 rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-foreground">
                ℹ️ ¿Qué es el Panel Financiero y cómo funciona?
              </h3>
              <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
                <p>
                  <strong className="text-foreground">📊 Vista Automática:</strong> Este dashboard consolida automáticamente las métricas financieras del negocio calculadas a partir de los datos que el equipo ha registrado manualmente en la Contabilidad Detallada.
                </p>
                <p>
                  <strong className="text-foreground">💰 Origen de los Datos:</strong> Los números provienen de tres fuentes principales: <span className="text-primary font-medium">Ingresos</span> (ventas registradas), <span className="text-destructive font-medium">Gastos</span> (costes operativos) y <span className="text-warning font-medium">Marketing</span> (inversión en canales). Estos se registran en la Contabilidad Detallada por admins y líderes.
                </p>
                <p>
                  <strong className="text-foreground">📈 KPIs Calculados:</strong> El sistema calcula automáticamente métricas avanzadas como Margen Bruto, Burn Rate, Runway (meses de supervivencia), ROI por canal de marketing y distribuciones de ingresos/gastos.
                </p>
                <p>
                  <strong className="text-foreground">🎯 Para qué sirve:</strong> Te da visión estratégica de la salud financiera del negocio, identifica productos más rentables, canales con mejor ROI y proyecta la sostenibilidad económica del proyecto.
                </p>
              </div>
            </div>
          </div>
        </div>

        <FinancialDashboard />
      </main>
    </div>
  );
};

export default FinancialPage;