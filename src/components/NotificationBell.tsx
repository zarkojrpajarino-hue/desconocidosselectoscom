import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [urgentAlerts, setUrgentAlerts] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    fetchUrgentAlerts();

    // FASE 1: Fix memory leak - cleanup subscription
    const channel = supabase
      .channel('urgent_alerts')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'smart_alerts',
          filter: `severity=eq.urgent`
        },
        () => {
          fetchUrgentAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchUrgentAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('smart_alerts')
        .select('*')
        .eq('severity', 'urgent')
        .eq('dismissed', false)
        .or(`target_user_id.eq.${user?.id},target_user_id.is.null`)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      setUrgentAlerts(data || []);
      setUnreadCount((data || []).filter(a => !a.viewed).length);
    } catch (error) {
      // FASE 1: Error handling mejorado
      console.error('Error fetching urgent alerts:', error);
      toast.error('Error al cargar alertas');
    }
  };

  const handleDismiss = async (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await supabase
        .from('smart_alerts')
        .update({ dismissed: true, dismissed_at: new Date().toISOString() })
        .eq('id', alertId);

      toast.success('Alerta descartada');
      fetchUrgentAlerts();
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  const handleViewAll = () => {
    navigate('/alerts');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 z-50 bg-card">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>🚨 Alertas Urgentes</span>
          {urgentAlerts.length > 0 && (
            <Badge variant="destructive">{urgentAlerts.length}</Badge>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {urgentAlerts.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Sin alertas urgentes
          </div>
        ) : (
          <>
            {urgentAlerts.map((alert: any) => (
              <DropdownMenuItem 
                key={alert.id}
                className="flex-col items-start py-3 cursor-pointer"
                onClick={() => {
                  if (alert.action_url) {
                    navigate(alert.action_url);
                  }
                }}
              >
                <div className="flex items-start justify-between w-full gap-2">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{alert.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {alert.message}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => handleDismiss(alert.id, e)}
                  >
                    ✕
                  </Button>
                </div>
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            <DropdownMenuItem 
              className="justify-center font-semibold cursor-pointer"
              onClick={handleViewAll}
            >
              Ver Todas las Alertas →
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
