import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BarChart3, TrendingUp, PieChart, Activity, Download, RefreshCw, Calendar, Database, Info, HelpCircle, ChevronDown, Zap, Clock, LineChart, Users } from 'lucide-react';
import { RevenueAnalytics } from '@/components/bi/RevenueAnalytics';
import { SalesPerformance } from '@/components/bi/SalesPerformance';
import { CustomerInsights } from '@/components/bi/CustomerInsights';
import { OperationalMetrics } from '@/components/bi/OperationalMetrics';
import { ExecutiveSummary } from '@/components/bi/ExecutiveSummary';
import { LockedFeatureCard } from '@/components/plan';

const BIDashboard = () => {
  const { currentOrganizationId } = useAuth();
  const planAccess = usePlanAccess();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [showDemoData, setShowDemoData] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleExport = () => {
    console.log('Exporting BI dashboard...');
  };

  // Check plan access
  const hasAccess = planAccess.hasFeature('advanced_reports');

  if (!hasAccess) {
    return (
      <div className="container mx-auto p-6 max-w-3xl">
        <LockedFeatureCard
          icon="📊"
          title="Business Intelligence Avanzado"
          description="Dashboards ejecutivos con análisis profundo de métricas, tendencias y KPIs."
          requiredPlan="professional"
          features={[
            'Análisis de ingresos por producto y canal',
            'Rendimiento del equipo de ventas',
            'Insights de clientes (LTV, CAC, cohortes)',
            'Métricas operacionales en tiempo real',
            'Exportación de reportes personalizados'
          ]}
          onUpgrade={() => navigate('/#pricing')}
        />
      </div>
    );
  }

  if (!currentOrganizationId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Selecciona una organización para ver el dashboard</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 md:p-6 space-y-4 md:space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:gap-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-xl md:text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-primary flex-shrink-0" />
              <span className="truncate">Business Intelligence</span>
            </h1>
            <p className="text-xs md:text-base text-muted-foreground mt-1">
              Análisis avanzado de métricas y tendencias en tiempo real
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowHelp(!showHelp)}
            className="flex-shrink-0"
          >
            <HelpCircle className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">¿Cómo funciona?</span>
          </Button>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[130px] md:w-[140px] flex-shrink-0">
              <Calendar className="w-4 h-4 mr-1 md:mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 días</SelectItem>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
              <SelectItem value="90d">Últimos 90 días</SelectItem>
              <SelectItem value="365d">Último año</SelectItem>
              <SelectItem value="all">Todo el tiempo</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing} className="flex-shrink-0">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleExport} className="flex-shrink-0">
            <Download className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>

          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            <Database className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="demo-mode" className="text-sm text-muted-foreground whitespace-nowrap">
              Demo
            </Label>
            <Switch
              id="demo-mode"
              checked={showDemoData}
              onCheckedChange={setShowDemoData}
            />
          </div>
        </div>
      </div>

      {/* Help Section */}
      <Collapsible open={showHelp} onOpenChange={setShowHelp}>
        <CollapsibleContent>
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                ¿Qué es el Business Intelligence?
              </CardTitle>
              <CardDescription>
                Tu centro de mando para visualizar y analizar los datos de tu negocio en tiempo real
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-background border">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-sm">Datos en Tiempo Real</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Los dashboards muestran datos actualizados automáticamente cada vez que visitas la página. Sin necesidad de generar reportes manualmente.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-background border">
                  <div className="flex items-center gap-2 mb-2">
                    <LineChart className="w-5 h-5 text-success" />
                    <span className="font-semibold text-sm">Fuentes de Datos</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Los gráficos se alimentan de: ingresos, gastos, leads del CRM, tareas completadas, y métricas de negocio que registres.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-background border">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-warning" />
                    <span className="font-semibold text-sm">Filtro por Período</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Usa el selector de fechas para ver datos de los últimos 7, 30, 90, 365 días o todo el histórico de tu empresa.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-background border">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-info" />
                    <span className="font-semibold text-sm">Modo Demo</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Activa el toggle "Demo" para ver cómo se verían los dashboards con datos de ejemplo profesionales.
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="text-sm">
                  <strong className="text-success">💡 Tip:</strong> Conforme añadas más datos a tu CRM, registres ingresos/gastos y completes tareas, estos dashboards se enriquecerán automáticamente mostrando tendencias y patrones de tu negocio.
                </p>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {showDemoData && (
        <Alert className="bg-primary/5 border-primary/20">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            Visualizando datos de demostración profesionales. Desactiva el toggle para ver tus datos reales.
          </AlertDescription>
        </Alert>
      )}

      {/* Executive Summary */}
      <ExecutiveSummary 
        organizationId={currentOrganizationId} 
        dateRange={dateRange}
        showDemoData={showDemoData}
        key={`summary-${refreshing}-${showDemoData}`}
      />

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="flex overflow-x-auto w-full lg:w-auto lg:inline-grid lg:grid-cols-4 gap-1">
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Ingresos</span>
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Ventas</span>
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            <span className="hidden sm:inline">Clientes</span>
          </TabsTrigger>
          <TabsTrigger value="operations" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Operaciones</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <RevenueAnalytics 
            organizationId={currentOrganizationId} 
            dateRange={dateRange}
            showDemoData={showDemoData}
            key={`revenue-${refreshing}-${showDemoData}`}
          />
        </TabsContent>

        <TabsContent value="sales">
          <SalesPerformance 
            organizationId={currentOrganizationId} 
            dateRange={dateRange}
            showDemoData={showDemoData}
            key={`sales-${refreshing}-${showDemoData}`}
          />
        </TabsContent>

        <TabsContent value="customers">
          <CustomerInsights 
            organizationId={currentOrganizationId} 
            dateRange={dateRange}
            showDemoData={showDemoData}
            key={`customers-${refreshing}-${showDemoData}`}
          />
        </TabsContent>

        <TabsContent value="operations">
          <OperationalMetrics 
            organizationId={currentOrganizationId} 
            dateRange={dateRange}
            showDemoData={showDemoData}
            key={`operations-${refreshing}-${showDemoData}`}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BIDashboard;
