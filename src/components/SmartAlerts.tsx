import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, AlertTriangle, Lightbulb, Filter, PartyPopper, Info, BellRing } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import AlertCard from './AlertCard';
import type { Json } from '@/integrations/supabase/types';
import { DEMO_ALERTS } from '@/data/demo-gamification-alerts-data';
import { usePushNotifications } from '@/hooks/usePushNotifications';

type AlertSeverity = 'urgent' | 'important' | 'opportunity' | 'celebration' | 'info';

interface SmartAlertData {
  id: string;
  alert_type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  context?: Record<string, string | number | boolean | null>;
  source: string;
  actionable: boolean;
  action_label?: string;
  action_url?: string;
  created_at: string;
  dismissed: boolean;
}

const parseContext = (context: Json | null | undefined): Record<string, string | number | boolean | null> | undefined => {
  if (!context) return undefined;
  if (typeof context === 'object' && !Array.isArray(context) && context !== null) {
    const result: Record<string, string | number | boolean | null> = {};
    const entries = Object.entries(context as Record<string, unknown>);
    for (const [key, value] of entries) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
        result[key] = value as string | number | boolean | null;
      }
    }
    return result;
  }
  return undefined;
};

const parseSeverity = (severity: string): AlertSeverity => {
  const validSeverities: AlertSeverity[] = ['urgent', 'important', 'opportunity', 'celebration', 'info'];
  return validSeverities.includes(severity as AlertSeverity) ? (severity as AlertSeverity) : 'info';
};

const SmartAlerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<SmartAlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showDemo, setShowDemo] = useState(false);
  
  const { permission, isSubscribed, subscribe } = usePushNotifications();

  useEffect(() => {
    if (!user) return;
    
    fetchAlerts();

    const subscription = supabase
      .channel('smart_alerts_channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'smart_alerts'
        },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('smart_alerts')
        .select('*')
        .eq('dismissed', false)
        .or(`target_user_id.eq.${user?.id},target_user_id.is.null`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedAlerts: SmartAlertData[] = (data || []).map(alert => ({
        id: alert.id,
        alert_type: alert.alert_type,
        severity: parseSeverity(alert.severity),
        title: alert.title,
        message: alert.message,
        context: parseContext(alert.context),
        source: alert.source,
        actionable: alert.actionable,
        action_label: alert.action_label ?? undefined,
        action_url: alert.action_url ?? undefined,
        created_at: alert.created_at,
        dismissed: alert.dismissed,
      }));
      
      setAlerts(transformedAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Error al cargar alertas');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (alertId: string) => {
    if (showDemo) {
      toast.success('Alerta demo descartada');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('smart_alerts')
        .update({ 
          dismissed: true, 
          dismissed_at: new Date().toISOString(),
          dismissed_by: user?.id 
        })
        .eq('id', alertId);

      if (error) throw error;

      await supabase.from('alert_actions').insert({
        alert_id: alertId,
        action_type: 'dismissed',
        user_id: user?.id
      });

      toast.success('Alerta descartada');
      fetchAlerts();
    } catch (error) {
      console.error('Error dismissing alert:', error);
      toast.error('Error al descartar alerta');
    }
  };

  const handleEnablePushNotifications = async () => {
    try {
      const success = await subscribe();
      if (success) {
        toast.success('Notificaciones push activadas', {
          description: 'Recibirás alertas importantes en tiempo real'
        });
      }
    } catch (error) {
      toast.error('Error al activar notificaciones');
    }
  };

  // Use demo or real data
  const displayAlerts = showDemo ? DEMO_ALERTS : alerts;

  const filterByTab = (alert: SmartAlertData) => {
    switch (activeTab) {
      case 'urgent':
        return alert.severity === 'urgent';
      case 'important':
        return alert.severity === 'important';
      case 'opportunity':
        return alert.severity === 'opportunity';
      case 'celebration':
        return alert.severity === 'celebration';
      default:
        return true;
    }
  };

  const filteredAlerts = displayAlerts.filter(filterByTab);

  const urgentCount = displayAlerts.filter(a => a.severity === 'urgent').length;
  const importantCount = displayAlerts.filter(a => a.severity === 'important').length;
  const opportunityCount = displayAlerts.filter(a => a.severity === 'opportunity').length;
  const celebrationCount = displayAlerts.filter(a => a.severity === 'celebration').length;

  if (loading && !showDemo) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Cargando alertas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Demo Toggle & Push Notification Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Modo Demo</span>
          <Switch checked={showDemo} onCheckedChange={setShowDemo} />
        </div>
        
        {!isSubscribed && permission !== 'denied' && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleEnablePushNotifications}
            className="gap-2"
          >
            <BellRing className="w-4 h-4" />
            Activar Push Notifications
          </Button>
        )}
        
        {isSubscribed && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <BellRing className="w-4 h-4" />
            Notificaciones push activas
          </div>
        )}
      </div>

      {/* How it works */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">¿Cómo funcionan las alertas?</p>
              <p>Las alertas inteligentes se generan automáticamente cuando el sistema detecta cambios importantes en tus métricas, tareas pendientes, oportunidades de venta, o logros alcanzados. Activa las push notifications para recibir alertas urgentes en tiempo real.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Filter className="w-5 h-5 text-primary" />
            Filtrar Alertas
          </CardTitle>
          <CardDescription>
            {displayAlerts.length} alertas activas • {urgentCount} urgentes • {importantCount} importantes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5 h-auto">
              <TabsTrigger value="all" className="gap-1 text-xs md:text-sm py-2">
                Todas
                {displayAlerts.length > 0 && (
                  <span className="hidden md:inline text-xs">({displayAlerts.length})</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="urgent" className="gap-1 text-xs md:text-sm py-2">
                <AlertCircle className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden md:inline">Urgentes</span>
                {urgentCount > 0 && (
                  <span className="text-xs">({urgentCount})</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="important" className="gap-1 text-xs md:text-sm py-2">
                <AlertTriangle className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden md:inline">Importantes</span>
                {importantCount > 0 && (
                  <span className="text-xs">({importantCount})</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="opportunity" className="gap-1 text-xs md:text-sm py-2">
                <Lightbulb className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden md:inline">Oportunidades</span>
                {opportunityCount > 0 && (
                  <span className="text-xs">({opportunityCount})</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="celebration" className="gap-1 text-xs md:text-sm py-2">
                <PartyPopper className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden md:inline">Logros</span>
                {celebrationCount > 0 && (
                  <span className="text-xs">({celebrationCount})</span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6 space-y-4">
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {activeTab === 'all' 
                      ? '¡Sin alertas! Todo en orden 🎉' 
                      : `Sin alertas de tipo "${activeTab}"`}
                  </p>
                </div>
              ) : (
                filteredAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    id={alert.id}
                    alert_type={alert.alert_type}
                    severity={alert.severity}
                    title={alert.title}
                    message={alert.message}
                    context={alert.context}
                    source={alert.source}
                    actionable={alert.actionable}
                    action_label={alert.action_label}
                    action_url={alert.action_url}
                    created_at={alert.created_at}
                    onDismiss={handleDismiss}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {displayAlerts.length > 5 && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            ↑ Volver arriba
          </Button>
        </div>
      )}
    </div>
  );
};

export default SmartAlerts;
