import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, PieChart, Activity, Download, RefreshCw, Calendar } from 'lucide-react';
import { RevenueAnalytics } from '@/components/bi/RevenueAnalytics';
import { SalesPerformance } from '@/components/bi/SalesPerformance';
import { CustomerInsights } from '@/components/bi/CustomerInsights';
import { OperationalMetrics } from '@/components/bi/OperationalMetrics';
import { ExecutiveSummary } from '@/components/bi/ExecutiveSummary';

const BIDashboard = () => {
  const { currentOrganizationId } = useAuth();
  const [dateRange, setDateRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Trigger refresh in child components via key change
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleExport = () => {
    // Export dashboard data
    console.log('Exporting BI dashboard...');
  };

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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-primary" />
            Business Intelligence
          </h1>
          <p className="text-muted-foreground mt-1">
            Análisis avanzado de métricas y tendencias de negocio
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="w-4 h-4 mr-2" />
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
          
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      <ExecutiveSummary 
        organizationId={currentOrganizationId} 
        dateRange={dateRange}
        key={`summary-${refreshing}`}
      />

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
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
            key={`revenue-${refreshing}`}
          />
        </TabsContent>

        <TabsContent value="sales">
          <SalesPerformance 
            organizationId={currentOrganizationId} 
            dateRange={dateRange}
            key={`sales-${refreshing}`}
          />
        </TabsContent>

        <TabsContent value="customers">
          <CustomerInsights 
            organizationId={currentOrganizationId} 
            dateRange={dateRange}
            key={`customers-${refreshing}`}
          />
        </TabsContent>

        <TabsContent value="operations">
          <OperationalMetrics 
            organizationId={currentOrganizationId} 
            dateRange={dateRange}
            key={`operations-${refreshing}`}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BIDashboard;
