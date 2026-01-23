import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, ChevronUp, Users, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserRoles, formatUserWithRole } from '@/hooks/useUserRoles';
interface TeamMemberProgress {
  id: string;
  username: string;
  full_name: string;
  completed: number;
  total: number;
  percentage: number;
}
interface TeamProgressProps {
  currentPhase: number;
  currentUserId?: string;
  organizationId?: string;
}
const TeamProgress = ({
  currentPhase,
  currentUserId,
  organizationId
}: TeamProgressProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [teamData, setTeamData] = useState<TeamMemberProgress[]>([]);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [loading, setLoading] = useState(true);
  const {
    data: rolesMap
  } = useUserRoles();
  useEffect(() => {
    if (organizationId) {
      fetchTeamProgress();
    }
  }, [currentPhase, organizationId]);
  const fetchTeamProgress = async () => {
    if (!organizationId) return;
    
    setLoading(true);
    try {
      // Obtener usuarios DE ESTA ORGANIZACIÓN solamente
      const { data: orgUsers, error: orgUsersError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('organization_id', organizationId);
      
      if (orgUsersError) throw orgUsersError;
      
      const userIds = orgUsers?.map(u => u.user_id) || [];
      
      if (userIds.length === 0) {
        setTeamData([]);
        setTotalTasks(0);
        setTotalCompleted(0);
        setLoading(false);
        return;
      }
      
      // Obtener info de usuarios
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, username, full_name')
        .in('id', userIds)
        .order('username');
      
      if (usersError) throw usersError;
      if (!users || users.length === 0) {
        setTeamData([]);
        setTotalTasks(0);
        setTotalCompleted(0);
        setLoading(false);
        return;
      }

      // Para cada usuario, obtener sus tareas y completaciones
      const progressData = await Promise.all(users.map(async user => {
        // Contar tareas totales del usuario en esta fase
        const {
          count: totalCount
        } = await supabase.from('tasks').select('*', {
          count: 'exact',
          head: true
        }).eq('user_id', user.id).eq('phase', currentPhase);

        // Contar tareas completadas (validated_by_leader = true)
        const {
          data: completions
        } = await supabase.from('task_completions').select('task_id').eq('user_id', user.id).eq('validated_by_leader', true);

        // Verificar que las completaciones pertenecen a tareas de esta fase
        let completedCount = 0;
        if (completions && completions.length > 0) {
          const taskIds = completions.map(c => c.task_id);
          const {
            count
          } = await supabase.from('tasks').select('*', {
            count: 'exact',
            head: true
          }).in('id', taskIds).eq('phase', currentPhase);
          completedCount = count || 0;
        }
        // NO usar fallback hardcodeado - usar el total real de tareas
        const total = totalCount || 0;
        const completed = completedCount || 0;
        const percentage = total > 0 ? Math.round(completed / total * 100) : 0;
        return {
          id: user.id,
          username: user.username,
          full_name: user.full_name || user.username,
          completed,
          total,
          percentage
        };
      }));
      setTeamData(progressData);

      // Calcular totales
      const totalTasksCount = progressData.reduce((sum, member) => sum + member.total, 0);
      const totalCompletedCount = progressData.reduce((sum, member) => sum + member.completed, 0);
      setTotalTasks(totalTasksCount);
      setTotalCompleted(totalCompletedCount);
    } catch (error) {
      console.error('Error fetching team progress:', error);
      toast.error('Error al cargar progreso del equipo');
    } finally {
      setLoading(false);
    }
  };
  const remainingTasks = totalTasks - totalCompleted;
  const teamPercentage = totalTasks > 0 ? Math.round(totalCompleted / totalTasks * 100) : 0;

  // Descripción de la fase actual
  const getPhaseDescription = (phase: number) => {
    switch (phase) {
      case 1:
        return 'Validación';
      case 2:
        return 'Optimización';
      case 3:
        return 'Crecimiento';
      case 4:
        return 'Escalado';
      default:
        return 'Validación';
    }
  };
  const phaseDescription = getPhaseDescription(currentPhase);
  if (loading) {
    return (
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-base md:text-lg">Progreso del Equipo</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-1"
          >
            {isExpanded ? (
              <>
                <span className="text-xs">Ocultar</span>
                <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                <span className="text-xs">Ver todos</span>
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Team Summary */}
        <div className="p-4 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Fase {currentPhase}: {phaseDescription}</span>
            </div>
            <span className="text-lg font-bold text-primary">{teamPercentage}%</span>
          </div>
          <Progress value={teamPercentage} className="h-2 mb-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{totalCompleted} completadas</span>
            <span>{remainingTasks > 0 ? `${remainingTasks} pendientes` : 'Sin tareas asignadas'}</span>
          </div>
        </div>

        {/* Individual Progress */}
        {isExpanded && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Progreso individual</p>
            {teamData.map((member) => {
              const isCurrentUser = member.id === currentUserId;
              const userRole = rolesMap?.get(member.id);
              const formattedName = formatUserWithRole(member.full_name, userRole?.role_name || null);
              
              return (
                <div
                  key={member.id}
                  className={`p-3 rounded-lg border ${
                    isCurrentUser 
                      ? 'bg-primary/5 border-primary/20' 
                      : 'bg-background border-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium truncate ${isCurrentUser ? 'text-primary' : ''}`}>
                      {isCurrentUser ? '👤 ' : ''}{formattedName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {member.completed}/{member.total}
                    </span>
                  </div>
                  <Progress value={member.percentage} className="h-1.5" />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamProgress;