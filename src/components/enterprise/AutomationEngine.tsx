import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Zap, Clock, Phone, Mail, Calendar, 
  CheckCircle2, AlertTriangle, ArrowRight,
  Filter, RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface AutomationTask {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'follow_up' | 'update';
  title: string;
  description: string;
  lead_id?: string;
  lead_name?: string;
  priority: 'high' | 'medium' | 'low';
  due_date: string;
  completed: boolean;
  created_at: string;
}

const TASK_ICONS = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  follow_up: ArrowRight,
  update: RefreshCw,
};

const PRIORITY_STYLES = {
  high: 'border-rose-500/50 bg-rose-500/5',
  medium: 'border-amber-500/50 bg-amber-500/5',
  low: 'border-muted',
};

export function AutomationEngine() {
  const { organizationId } = useCurrentOrganization();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<AutomationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

  useEffect(() => {
    fetchAutomationTasks();
  }, [organizationId]);

  async function fetchAutomationTasks() {
    if (!organizationId) return;
    
    try {
      setLoading(true);
      
      // Obtener leads con acciones pendientes
      const { data: leadsWithActions, error } = await supabase
        .from('leads')
        .select('id, name, company, next_action, next_action_type, next_action_date, priority, pipeline_stage')
        .eq('organization_id', organizationId)
        .not('next_action_date', 'is', null)
        .order('next_action_date', { ascending: true });

      if (error) throw error;

      // Convertir a formato de tareas
      const automationTasks: AutomationTask[] = (leadsWithActions || []).map(lead => ({
        id: lead.id,
        type: mapActionType(lead.next_action_type),
        title: lead.next_action || `Acción pendiente con ${lead.name}`,
        description: `${lead.company || 'Sin empresa'} - Etapa: ${lead.pipeline_stage}`,
        lead_id: lead.id,
        lead_name: lead.name,
        priority: lead.priority as 'high' | 'medium' | 'low',
        due_date: lead.next_action_date,
        completed: false,
        created_at: new Date().toISOString(),
      }));

      // Agregar tareas de leads sin contacto reciente
      const { data: staleLead } = await supabase
        .from('leads')
        .select('id, name, company, last_contact_date, pipeline_stage')
        .eq('organization_id', organizationId)
        .lt('last_contact_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .not('pipeline_stage', 'in', '("won","lost")')
        .limit(10);

      const staleTasks: AutomationTask[] = (staleLead || []).map(lead => ({
        id: `stale-${lead.id}`,
        type: 'follow_up' as const,
        title: `Reactivar contacto con ${lead.name}`,
        description: `Sin contacto hace más de 7 días - ${lead.company || 'Sin empresa'}`,
        lead_id: lead.id,
        lead_name: lead.name,
        priority: 'medium' as const,
        due_date: new Date().toISOString().split('T')[0],
        completed: false,
        created_at: new Date().toISOString(),
      }));

      setTasks([...automationTasks, ...staleTasks]);
    } catch (err) {
      console.error('Error fetching automation tasks:', err);
      toast.error('Error cargando tareas automatizadas');
    } finally {
      setLoading(false);
    }
  }

  function mapActionType(type: string | null): AutomationTask['type'] {
    const mapping: Record<string, AutomationTask['type']> = {
      call: 'call',
      llamada: 'call',
      email: 'email',
      correo: 'email',
      meeting: 'meeting',
      reunion: 'meeting',
      reunión: 'meeting',
      follow_up: 'follow_up',
      seguimiento: 'follow_up',
    };
    return mapping[type?.toLowerCase() || ''] || 'follow_up';
  }

  async function markTaskComplete(taskId: string, leadId?: string) {
    if (!leadId) return;

    try {
      // Actualizar el lead para limpiar la acción
      await supabase
        .from('leads')
        .update({
          next_action: null,
          next_action_type: null,
          next_action_date: null,
          last_contact_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', leadId);

      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, completed: true } : t
      ));

      toast.success('Tarea completada');
    } catch (err) {
      console.error('Error completing task:', err);
      toast.error('Error al completar tarea');
    }
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'pending') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const pendingCount = tasks.filter(t => !t.completed).length;
  const highPriorityCount = tasks.filter(t => !t.completed && t.priority === 'high').length;
  const dueTodayCount = tasks.filter(t => 
    !t.completed && new Date(t.due_date).toDateString() === new Date().toDateString()
  ).length;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Inbox de Acciones
          </h2>
          <p className="text-muted-foreground">Tareas automatizadas basadas en tu pipeline</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAutomationTasks}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tareas Pendientes</p>
                <p className="text-3xl font-bold">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card className={highPriorityCount > 0 ? 'border-rose-500/50' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alta Prioridad</p>
                <p className={`text-3xl font-bold ${highPriorityCount > 0 ? 'text-rose-600' : ''}`}>
                  {highPriorityCount}
                </p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${highPriorityCount > 0 ? 'text-rose-500' : 'text-muted-foreground'}`} />
            </div>
          </CardContent>
        </Card>
        
        <Card className={dueTodayCount > 0 ? 'border-amber-500/50' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Para Hoy</p>
                <p className={`text-3xl font-bold ${dueTodayCount > 0 ? 'text-amber-600' : ''}`}>
                  {dueTodayCount}
                </p>
              </div>
              <Calendar className={`h-8 w-8 ${dueTodayCount > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button 
          variant={filter === 'pending' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('pending')}
        >
          Pendientes
        </Button>
        <Button 
          variant={filter === 'completed' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('completed')}
        >
          Completadas
        </Button>
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('all')}
        >
          Todas
        </Button>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
            <p className="text-lg font-medium">¡Todo al día!</p>
            <p className="text-sm text-muted-foreground mt-2">
              No tienes tareas pendientes en este momento
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(task => {
            const TaskIcon = TASK_ICONS[task.type];
            const isOverdue = new Date(task.due_date) < new Date() && !task.completed;
            
            return (
              <Card 
                key={task.id} 
                className={`${PRIORITY_STYLES[task.priority]} ${
                  task.completed ? 'opacity-60' : ''
                } ${isOverdue ? 'border-rose-500' : ''}`}
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => markTaskComplete(task.id, task.lead_id)}
                      disabled={task.completed}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <TaskIcon className="h-4 w-4 text-muted-foreground" />
                        <span className={`font-medium ${task.completed ? 'line-through' : ''}`}>
                          {task.title}
                        </span>
                        <Badge variant={
                          task.priority === 'high' ? 'destructive' : 
                          task.priority === 'medium' ? 'secondary' : 'outline'
                        }>
                          {task.priority === 'high' ? 'Alta' : 
                           task.priority === 'medium' ? 'Media' : 'Baja'}
                        </Badge>
                        {isOverdue && (
                          <Badge variant="destructive">Vencida</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isOverdue ? 'Vencía' : 'Vence'}{' '}
                        {formatDistanceToNow(new Date(task.due_date), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </p>
                    </div>
                    
                    {task.lead_id && !task.completed && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/crm?lead=${task.lead_id}`}>Ver Lead</a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
