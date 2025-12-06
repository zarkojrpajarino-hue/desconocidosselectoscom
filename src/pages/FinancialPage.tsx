import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, DollarSign, Plus, AlertCircle, ChevronDown, TrendingUp, TrendingDown, PieChart, BarChart3, Package, PiggyBank, AlertTriangle } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import FinancialDashboard from '@/components/FinancialDashboard';
import RevenueFormModal from '@/components/financial/RevenueFormModal';
import ExpenseFormModal from '@/components/financial/ExpenseFormModal';
import MarketingFormModal from '@/components/financial/MarketingFormModal';
import { useFinancialData } from '@/hooks/useFinancialData';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { toast } from 'sonner';
import { SectionTourButton } from '@/components/SectionTourButton';
import { IntegrationButton } from '@/components/IntegrationButton';
import { 
  FinancialFromKPIs, 
  CashFlowForecast, 
  BudgetTracking, 
  FinancialRatios,
  ProductProfitability 
} from '@/components/enterprise';

const FinancialPage = () => {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [revenueModalOpen, setRevenueModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [marketingModalOpen, setMarketingModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFinancialInfoOpen, setIsFinancialInfoOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

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
            <div className="flex items-center gap-2">
              <SectionTourButton sectionId="financial" />
              <Button
                variant="outline"
                onClick={() => navigate('/metrics')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a Métricas
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
        {/* Tabs de navegación */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 h-auto">
            <TabsTrigger value="dashboard" className="gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden md:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="projections" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden md:inline">Proyecciones</span>
            </TabsTrigger>
            <TabsTrigger value="cashflow" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden md:inline">Cash Flow</span>
            </TabsTrigger>
            <TabsTrigger value="budget" className="gap-2">
              <PieChart className="h-4 w-4" />
              <span className="hidden md:inline">Presupuesto</span>
            </TabsTrigger>
            <TabsTrigger value="ratios" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden md:inline">Ratios</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden md:inline">Productos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 mt-6">
            {/* Financial Stats Cards */}
            {transactions && transactions.length > 0 && (() => {
              const income = transactions
                .filter(t => t.type === 'revenue')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
              const expenses = transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
              const profit = income - expenses;
              const profitMargin = income > 0 ? Math.round((profit / income) * 100) : 0;

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    variant="success"
                    size="lg"
                    value={`€${income.toLocaleString()}`}
                    label="Ingresos"
                    change="este período"
                    trend="up"
                    icon={<TrendingUp className="w-6 h-6 text-success" />}
                    className="animate-fade-in"
                  />
                  
                  <StatCard
                    variant="danger"
                    size="lg"
                    value={`€${expenses.toLocaleString()}`}
                    label="Gastos"
                    change="este período"
                    trend="down"
                    icon={<TrendingDown className="w-6 h-6 text-destructive" />}
                    className="animate-fade-in"
                    style={{ animationDelay: '100ms' }}
                  />
                  
                  <StatCard
                    variant={profit > 0 ? "success" : "danger"}
                    size="lg"
                    value={`€${profit.toLocaleString()}`}
                    label="Beneficio Neto"
                    change={`${profitMargin}% margen`}
                    trend={profit > 0 ? "up" : "down"}
                    icon={<DollarSign className="w-6 h-6" />}
                    className="animate-fade-in"
                    style={{ animationDelay: '200ms' }}
                  />
                  
                  <StatCard
                    variant={profitMargin > 20 ? "success" : profitMargin > 0 ? "warning" : "danger"}
                    size="lg"
                    value={`${profitMargin}%`}
                    label="Margen de Beneficio"
                    change={profitMargin > 20 ? "Saludable" : profitMargin > 0 ? "Mejorable" : "En pérdidas"}
                    trend={profitMargin > 20 ? "up" : profitMargin > 0 ? "neutral" : "down"}
                    icon={<PiggyBank className="w-6 h-6" />}
                    className="animate-fade-in"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              );
            })()}

            {/* Alerta Runway Crítico */}
            {transactions && (() => {
              const income = transactions.filter(t => t.type === 'revenue').reduce((sum, t) => sum + (t.amount || 0), 0);
              const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
              const monthlyBurn = expenses / 3; // Estimación burn mensual
              const estimatedRunway = monthlyBurn > 0 ? Math.round(income / monthlyBurn) : 999;
              
              if (estimatedRunway < 6) {
                return (
                  <Alert variant="destructive" className="animate-fade-in">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>⚠️ Runway crítico: ~{estimatedRunway} meses</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                      <span>Burn rate: €{monthlyBurn.toLocaleString()}/mes. Acción requerida.</span>
                      <IntegrationButton
                        type="slack"
                        action="notify"
                        data={{
                          message: `🚨 *ALERTA RUNWAY CRÍTICO*\n\n` +
                            `📉 Runway estimado: ${estimatedRunway} meses\n` +
                            `🔥 Burn rate: €${monthlyBurn.toLocaleString()}/mes\n` +
                            `💰 Ingresos: €${income.toLocaleString()}\n` +
                            `💸 Gastos: €${expenses.toLocaleString()}\n\n` +
                            `@channel - Acción financiera requerida`,
                          channel: '#finance-alerts'
                        }}
                        label="Alertar finanzas"
                        size="sm"
                        variant="outline"
                      />
                    </AlertDescription>
                  </Alert>
                );
              }
              return null;
            })()}

            {/* Explicación */}
            <Collapsible open={isFinancialInfoOpen} onOpenChange={setIsFinancialInfoOpen}>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-success" />
                        ℹ️ ¿Qué es el Panel Financiero?
                      </CardTitle>
                      <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isFinancialInfoOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="bg-gradient-to-br from-primary/10 via-background to-background border border-primary/20 rounded-xl p-6 text-sm text-muted-foreground space-y-2">
                      <p><strong className="text-foreground">📊 Vista Completa:</strong> Integra métricas financieras automáticas y registro manual de transacciones.</p>
                      <p><strong className="text-foreground">💰 Origen:</strong> Ingresos (ventas), Gastos (costes) y Marketing (inversión).</p>
                      <p><strong className="text-foreground">📈 KPIs Automáticos:</strong> Margen, Burn Rate, Runway, ROI por canal.</p>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Registro de Transacciones */}
            {(userProfile?.role === 'admin' || userProfile?.role === 'leader') ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Registrar Nueva Transacción</CardTitle>
                      <CardDescription>Registra ingresos, gastos o campañas de marketing</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/financial/transactions')} className="gap-2">
                      📜 Historial
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => setRevenueModalOpen(true)} className="gap-2">
                      <Plus className="w-4 h-4" />Nuevo Ingreso
                    </Button>
                    <Button variant="destructive" onClick={() => setExpenseModalOpen(true)} className="gap-2">
                      <Plus className="w-4 h-4" />Nuevo Gasto
                    </Button>
                    <Button variant="secondary" onClick={() => setMarketingModalOpen(true)} className="gap-2">
                      <Plus className="w-4 h-4" />Nueva Campaña
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-destructive">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <AlertCircle className="w-16 h-16 text-destructive mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Acceso Restringido</h3>
                  <p className="text-muted-foreground text-center max-w-md">Solo administradores y líderes pueden registrar transacciones</p>
                </CardContent>
              </Card>
            )}

            <FinancialDashboard key={refreshKey} />
          </TabsContent>

          <TabsContent value="projections" className="mt-6">
            <FinancialFromKPIs />
          </TabsContent>

          <TabsContent value="cashflow" className="mt-6">
            <CashFlowForecast />
          </TabsContent>

          <TabsContent value="budget" className="mt-6">
            <BudgetTracking />
          </TabsContent>

          <TabsContent value="ratios" className="mt-6">
            <FinancialRatios />
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            <ProductProfitability />
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <RevenueFormModal open={revenueModalOpen} onOpenChange={setRevenueModalOpen} onSuccess={handleSuccess} />
        <ExpenseFormModal open={expenseModalOpen} onOpenChange={setExpenseModalOpen} onSuccess={handleSuccess} />
        <MarketingFormModal open={marketingModalOpen} onOpenChange={setMarketingModalOpen} onSuccess={handleSuccess} />
      </main>
    </div>
  );
};

export default FinancialPage;
