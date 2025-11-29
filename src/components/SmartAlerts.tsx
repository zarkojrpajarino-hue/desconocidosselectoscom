import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle, Lightbulb, Filter, PartyPopper } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import AlertCard from './AlertCard';

const SmartAlerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

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
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Error al cargar alertas');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (alertId: string) => {
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

  const filterByTab = (alert: any) => {
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

  const filteredAlerts = alerts.filter(filterByTab);

  const urgentCount = alerts.filter(a => a.severity === 'urgent').length;
  const importantCount = alerts.filter(a => a.severity === 'important').length;
  const opportunityCount = alerts.filter(a => a.severity === 'opportunity').length;
  const celebrationCount = alerts.filter(a => a.severity === 'celebration').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Cargando alertas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Filtrar Alertas
          </CardTitle>
          <CardDescription>
            {alerts.length} alertas activas • {urgentCount} urgentes • {importantCount} importantes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all" className="gap-2">
                Todas
                {alerts.length > 0 && (
                  <span className="text-xs">({alerts.length})</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="urgent" className="gap-2">
                <AlertCircle className="w-4 h-4" />
                Urgentes
                {urgentCount > 0 && (
                  <span className="text-xs">({urgentCount})</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="important" className="gap-2">
                <AlertTriangle className="w-4 h-4" />
                Importantes
                {importantCount > 0 && (
                  <span className="text-xs">({importantCount})</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="opportunity" className="gap-2">
                <Lightbulb className="w-4 h-4" />
                Oportunidades
                {opportunityCount > 0 && (
                  <span className="text-xs">({opportunityCount})</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="celebration" className="gap-2">
                <PartyPopper className="w-4 h-4" />
                Logros
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
                    {...alert}
                    onDismiss={handleDismiss}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {alerts.length > 5 && (
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