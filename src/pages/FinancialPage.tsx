import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, DollarSign, Plus, AlertCircle, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import FinancialDashboard from '@/components/FinancialDashboard';
import RevenueFormModal from '@/components/financial/RevenueFormModal';
import ExpenseFormModal from '@/components/financial/ExpenseFormModal';
import MarketingFormModal from '@/components/financial/MarketingFormModal';
import { useFinancialData } from '@/hooks/useFinancialData';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { formatCurrency } from '@/lib/currencyUtils';
import { formatDate } from '@/lib/dateUtils';
import { toast } from 'sonner';

const FinancialPage = () => {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [revenueModalOpen, setRevenueModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [marketingModalOpen, setMarketingModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFinancialInfoOpen, setIsFinancialInfoOpen] = useState(false);

  // Use custom hook for financial data
  const { transactions, loading: transactionsLoading, refetch } = useFinancialData();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const handleSuccess = () => {
    refetch();
    setRefreshKey(prev => prev + 1);
    toast.success('Transacción guardada correctamente');
  };

  if (loading || transactionsLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 h-8 bg-muted rounded w-1/4 animate-pulse" />
          <LoadingSkeleton />
        </div>
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

      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        {/* Explicación unificada del Panel Financiero */}
        <Collapsible
          open={isFinancialInfoOpen}
          onOpenChange={setIsFinancialInfoOpen}
        >
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-success" />
                    ℹ️ ¿Qué es el Panel Financiero y cómo funciona?
                  </CardTitle>
                  <ChevronDown 
                    className={`h-5 w-5 text-muted-foreground transition-transform ${
                      isFinancialInfoOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="bg-gradient-to-br from-primary/10 via-background to-background border border-primary/20 rounded-xl p-6">
                  <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
                    <p>
                      <strong className="text-foreground">📊 Vista Completa:</strong> Este panel integra tanto las <strong>métricas financieras automáticas</strong> calculadas a partir de tus datos registrados, como la opción de <strong>registrar transacciones manualmente</strong> con control total sobre cada entrada contable.
                    </p>
                    <p>
                      <strong className="text-foreground">💰 Origen de los Datos:</strong> Los números provienen de tres fuentes principales que tú registras: <span className="text-primary font-medium">Ingresos</span> (ventas), <span className="text-destructive font-medium">Gastos</span> (costes operativos) y <span className="text-warning font-medium">Marketing</span> (inversión en canales). Solo admins y líderes pueden registrar transacciones.
                    </p>
                    <p>
                      <strong className="text-foreground">📈 KPIs Calculados Automáticamente:</strong> El sistema calcula métricas avanzadas como Margen Bruto, Burn Rate, Runway (meses de supervivencia), ROI por canal de marketing y distribuciones de ingresos/gastos.
                    </p>
                    <p>
                      <strong className="text-foreground">🏢 Datos Corporativos:</strong> Los datos aquí son <strong>financieros de la empresa</strong>, no personales. Todas las transacciones quedan registradas con fecha, hora y usuario para auditoría completa.
                    </p>
                    <p>
                      <strong className="text-foreground">🎯 Para qué sirve:</strong> Te da visión estratégica de la salud financiera, identifica productos más rentables, canales con mejor ROI y proyecta la sostenibilidad económica del proyecto.
                    </p>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Sección de Registro Manual de Transacciones */}
        {(userProfile?.role === 'admin' || userProfile?.role === 'leader') ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Registrar Nueva Transacción</CardTitle>
                  <CardDescription>
                    Registra ingresos, gastos o campañas de marketing de la empresa manualmente
                  </CardDescription>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/financial/transactions')}
                  className="gap-2"
                >
                  📜 Historial de Transacciones
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={() => setRevenueModalOpen(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Ingreso
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => setExpenseModalOpen(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Gasto
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => setMarketingModalOpen(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nueva Campaña
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-destructive">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="w-16 h-16 text-destructive mb-4" />
              <h3 className="text-xl font-semibold mb-2">Acceso Restringido</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Solo administradores y líderes pueden registrar transacciones financieras de la empresa
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dashboard Financiero */}
        <div>
          <h3 className="text-2xl font-bold mb-4">📊 Métricas Financieras Automáticas</h3>
          <FinancialDashboard key={refreshKey} />
        </div>

        {/* Modals */}
        <RevenueFormModal
          open={revenueModalOpen}
          onOpenChange={setRevenueModalOpen}
          onSuccess={handleSuccess}
        />
        <ExpenseFormModal
          open={expenseModalOpen}
          onOpenChange={setExpenseModalOpen}
          onSuccess={handleSuccess}
        />
        <MarketingFormModal
          open={marketingModalOpen}
          onOpenChange={setMarketingModalOpen}
          onSuccess={handleSuccess}
        />
      </main>
    </div>
  );
};

export default FinancialPage;