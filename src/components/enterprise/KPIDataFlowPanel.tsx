import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target,
  Brain,
  Bell,
  Database,
  Zap,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DataFlowItem {
  id: string;
  source: string;
  destination: string;
  description: string;
  status: 'active' | 'syncing' | 'error';
  lastSync?: string;
  count?: number;
}

interface KPIDataFlowPanelProps {
  className?: string;
}

export function KPIDataFlowPanel({ className }: KPIDataFlowPanelProps) {
  const { t } = useTranslation();
  const { currentOrganizationId } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [flowStats, setFlowStats] = useState({
    kpisRegistered: 0,
    revenuesSynced: 0,
    leadsCreated: 0,
    alertsGenerated: 0,
  });

  useEffect(() => {
    async function fetchFlowStats() {
      if (!currentOrganizationId) return;

      const [kpis, revenues, leads, alerts] = await Promise.all([
        supabase
          .from('business_metrics')
          .select('id', { count: 'exact' })
          .eq('organization_id', currentOrganizationId),
        supabase
          .from('revenue_entries')
          .select('id', { count: 'exact' })
          .eq('organization_id', currentOrganizationId)
          .eq('product_category', 'kpi_ventas'),
        supabase
          .from('leads')
          .select('id', { count: 'exact' })
          .eq('organization_id', currentOrganizationId)
          .ilike('notes', '%desde Marketing Spend%'),
        supabase
          .from('smart_alerts')
          .select('id', { count: 'exact' })
          .in('alert_type', ['cac_spike', 'ltv_cac_warning', 'cac_rising']),
      ]);

      setFlowStats({
        kpisRegistered: kpis.count || 0,
        revenuesSynced: revenues.count || 0,
        leadsCreated: leads.count || 0,
        alertsGenerated: alerts.count || 0,
      });
    }

    fetchFlowStats();
  }, [currentOrganizationId]);

  const dataFlows: DataFlowItem[] = [
    {
      id: 'kpi-financial',
      source: 'KPIs de Ventas',
      destination: 'Finanzas (Ingresos)',
      description: 'Revenue y ticket promedio se registran automáticamente como ingresos en el módulo financiero',
      status: 'active',
      count: flowStats.revenuesSynced,
    },
    {
      id: 'kpi-expenses',
      source: 'KPIs Operaciones',
      destination: 'Finanzas (Gastos)',
      description: 'Costos operacionales se sincronizan como gastos para cálculo de márgenes',
      status: 'active',
    },
    {
      id: 'marketing-leads',
      source: 'Marketing Spend',
      destination: 'CRM (Leads)',
      description: 'Al registrar campañas con leads generados, se crean leads automáticamente en el CRM',
      status: 'active',
      count: flowStats.leadsCreated,
    },
    {
      id: 'kpi-alerts',
      source: 'CAC / LTV',
      destination: 'Smart Alerts',
      description: 'Si CAC sube >20% o ratio LTV/CAC cae <3:1, se genera alerta automática',
      status: 'active',
      count: flowStats.alertsGenerated,
    },
    {
      id: 'kpi-ai',
      source: 'Todos los KPIs',
      destination: 'Análisis con IA',
      description: 'Los últimos 90 días de KPIs alimentan el análisis de IA para insights personalizados',
      status: 'active',
    },
    {
      id: 'kpi-projections',
      source: 'Leads + Conversión + Ticket',
      destination: 'Proyecciones Financieras',
      description: 'Pipeline revenue, CAC calculado, LTV y runway se proyectan desde estos KPIs',
      status: 'active',
    },
  ];

  const getStatusIcon = (status: DataFlowItem['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'syncing':
        return <Zap className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }
  };

  const getDestinationIcon = (destination: string) => {
    if (destination.includes('Finanzas')) return <DollarSign className="h-4 w-4" />;
    if (destination.includes('CRM')) return <Users className="h-4 w-4" />;
    if (destination.includes('Alerts')) return <Bell className="h-4 w-4" />;
    if (destination.includes('IA')) return <Brain className="h-4 w-4" />;
    if (destination.includes('Proyecciones')) return <Target className="h-4 w-4" />;
    return <Database className="h-4 w-4" />;
  };

  return (
    <Card className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-5 w-5 text-primary" />
                Flujo de Datos KPIs
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {flowStats.kpisRegistered} KPIs registrados
                </Badge>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            {/* Info Banner */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 mb-4">
              <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Los KPIs que registras se sincronizan <strong>automáticamente</strong> con otros módulos. 
                No necesitas duplicar datos - el sistema los propaga en tiempo real.
              </p>
            </div>

            {/* Flow Diagram */}
            <div className="space-y-3">
              {dataFlows.map((flow) => (
                <div 
                  key={flow.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  {/* Source */}
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{flow.source}</span>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <ArrowRight className="h-4 w-4" />
                  </div>

                  {/* Destination */}
                  <div className="flex items-center gap-2 min-w-[160px]">
                    {getDestinationIcon(flow.destination)}
                    <span className="text-sm font-medium">{flow.destination}</span>
                  </div>

                  {/* Status & Count */}
                  <div className="flex items-center gap-2 ml-auto">
                    {flow.count !== undefined && flow.count > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {flow.count} sincronizados
                      </Badge>
                    )}
                    {getStatusIcon(flow.status)}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t">
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <div className="text-lg font-bold text-primary">{flowStats.kpisRegistered}</div>
                <div className="text-xs text-muted-foreground">KPIs Totales</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <div className="text-lg font-bold text-green-500">{flowStats.revenuesSynced}</div>
                <div className="text-xs text-muted-foreground">→ Ingresos</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <div className="text-lg font-bold text-blue-500">{flowStats.leadsCreated}</div>
                <div className="text-xs text-muted-foreground">→ Leads CRM</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <div className="text-lg font-bold text-yellow-500">{flowStats.alertsGenerated}</div>
                <div className="text-xs text-muted-foreground">→ Alertas</div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
