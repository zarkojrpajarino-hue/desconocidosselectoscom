import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, DollarSign, Plus, AlertCircle, ChevronDown, TrendingUp, TrendingDown, PieChart, BarChart3, Package, PiggyBank, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  const { user, loading, currentOrganizationId, userOrganizations } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [revenueModalOpen, setRevenueModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [marketingModalOpen, setMarketingModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFinancialInfoOpen, setIsFinancialInfoOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Obtener el rol actual del usuario en la organización seleccionada
  const currentUserRole = userOrganizations.find(
    org => org.organization_id === currentOrganizationId
  )?.role || 'member';
  const isAdmin = currentUserRole === 'admin';
  const canViewTransactions = currentUserRole === 'admin' || currentUserRole === 'leader';

  const { 
    transactions, 
    loading: transactionsLoading, 
    refetch,
    financialVisibility,
    toggleFinancialVisibility,
    isHiddenForTeam 
  } = useFinancialData();

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

  // Si los datos financieros están ocultos para este usuario
  if (isHiddenForTeam && !isAdmin) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <DollarSign className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Datos financieros restringidos</h3>
              <p className="text-muted-foreground">
                El administrador ha restringido la visibilidad de los datos financieros para el equipo.
              </p>
              <Button variant="outline" onClick={() => navigate('/dashboard/home')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-success shrink-0" />
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg md:text-2xl font-bold bg-gradient-to-r from-success to-primary bg-clip-text text-transparent truncate">
                  {t('financial.title')}
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                  {t('financial.subtitle')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 md:gap-2 shrink-0">
              {/* Toggle de visibilidad financiera - solo para admin */}
              {isAdmin && (
                <div className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-1.5">
                    {financialVisibility ? (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Label htmlFor="financial-visibility" className="text-xs text-muted-foreground hidden md:inline">
                      Visible al equipo
                    </Label>
                  </div>
                  <Switch
                    id="financial-visibility"
                    checked={financialVisibility}
                    onCheckedChange={toggleFinancialVisibility}
                  />
                </div>
              )}
              <SectionTourButton sectionId="financial" className="hidden md:flex" />
              <Button
                variant="outline"
                onClick={() => navigate('/metrics')}
                className="gap-1 p-2 md:px-3"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden md:inline">{t('metrics.title')}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
        {/* Tabs de navegación */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex w-full overflow-x-auto md:grid md:grid-cols-6 h-auto gap-1 p-1">
            <TabsTrigger value="dashboard" className="gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden md:inline">{t('financial.tabs.dashboard')}</span>
            </TabsTrigger>
            <TabsTrigger value="projections" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden md:inline">{t('financial.tabs.projections')}</span>
            </TabsTrigger>
            <TabsTrigger value="cashflow" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden md:inline">{t('financial.tabs.cashflow')}</span>
            </TabsTrigger>
            <TabsTrigger value="budget" className="gap-2">
              <PieChart className="h-4 w-4" />
              <span className="hidden md:inline">{t('financial.tabs.budget')}</span>
            </TabsTrigger>
            <TabsTrigger value="ratios" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden md:inline">{t('financial.tabs.ratios')}</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden md:inline">{t('financial.tabs.products')}</span>
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
                    label={t('financial.revenue')}
                    change={t('financial.thisPeriod')}
                    trend="up"
                    icon={<TrendingUp className="w-6 h-6 text-success" />}
                    className="animate-fade-in"
                  />
                  
                  <StatCard
                    variant="danger"
                    size="lg"
                    value={`€${expenses.toLocaleString()}`}
                    label={t('financial.expenses')}
                    change={t('financial.thisPeriod')}
                    trend="down"
                    icon={<TrendingDown className="w-6 h-6 text-destructive" />}
                    className="animate-fade-in"
                    style={{ animationDelay: '100ms' }}
                  />
                  
                  <StatCard
                    variant={profit > 0 ? "success" : "danger"}
                    size="lg"
                    value={`€${profit.toLocaleString()}`}
                    label={t('financial.netProfit')}
                    change={`${profitMargin}% ${t('financial.margin')}`}
                    trend={profit > 0 ? "up" : "down"}
                    icon={<DollarSign className="w-6 h-6" />}
                    className="animate-fade-in"
                    style={{ animationDelay: '200ms' }}
                  />
                  
                  <StatCard
                    variant={profitMargin > 20 ? "success" : profitMargin > 0 ? "warning" : "danger"}
                    size="lg"
                    value={`${profitMargin}%`}
                    label={t('financial.profitMargin')}
                    change={profitMargin > 20 ? t('financial.healthy') : profitMargin > 0 ? t('financial.improvable') : t('financial.inLosses')}
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
              const monthlyBurn = expenses / 3;
              const estimatedRunway = monthlyBurn > 0 ? Math.round(income / monthlyBurn) : 999;
              
              if (estimatedRunway < 6) {
                return (
                  <Alert variant="destructive" className="animate-fade-in">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>⚠️ {t('financial.runwayCritical')}: ~{estimatedRunway} meses</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                      <span>{t('financial.burnRate')}: €{monthlyBurn.toLocaleString()}/mes. {t('financial.actionRequired')}</span>
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
                        label={t('financial.alertFinance')}
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
                        ℹ️ {t('financial.whatIsPanel')}
                      </CardTitle>
                      <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isFinancialInfoOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="bg-gradient-to-br from-primary/10 via-background to-background border border-primary/20 rounded-xl p-6 text-sm text-muted-foreground space-y-2">
                      <p><strong className="text-foreground">{t('financial.panelExplanation1')}</strong></p>
                      <p><strong className="text-foreground">{t('financial.panelExplanation2')}</strong></p>
                      <p><strong className="text-foreground">{t('financial.panelExplanation3')}</strong></p>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Registro de Transacciones */}
            {canViewTransactions ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{t('financial.registerTransaction')}</CardTitle>
                      <CardDescription>{t('financial.registerDescription')}</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/financial/transactions')} className="gap-2">
                      📜 {t('financial.historyLabel')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => setRevenueModalOpen(true)} className="gap-2">
                      <Plus className="w-4 h-4" />{t('financial.newRevenue')}
                    </Button>
                    <Button variant="destructive" onClick={() => setExpenseModalOpen(true)} className="gap-2">
                      <Plus className="w-4 h-4" />{t('financial.newExpense')}
                    </Button>
                    <Button variant="secondary" onClick={() => setMarketingModalOpen(true)} className="gap-2">
                      <Plus className="w-4 h-4" />{t('financial.newCampaign')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-destructive">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <AlertCircle className="w-16 h-16 text-destructive mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{t('financial.accessRestricted')}</h3>
                  <p className="text-muted-foreground text-center max-w-md">{t('financial.accessRestrictedDesc')}</p>
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
