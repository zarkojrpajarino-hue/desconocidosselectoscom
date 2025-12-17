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
}
const TeamProgress = ({
  currentPhase,
  currentUserId
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
    fetchTeamProgress();
  }, [currentPhase]);
  const fetchTeamProgress = async () => {
    setLoading(true);
    try {
      // Obtener todos los usuarios (incluido el actual si no está en la lista)
      const {
        data: users,
        error: usersError
      } = await supabase.from('users').select('id, username, full_name').neq('role', 'admin').order('username');
      if (usersError) throw usersError;
      if (!users) return;

      // Asegurarse de que el usuario actual está en la lista
      const userIds = users.map(u => u.id);
      if (currentUserId && !userIds.includes(currentUserId)) {
        const {
          data: currentUser
        } = await supabase.from('users').select('id, username, full_name').eq('id', currentUserId).single();
        if (currentUser) {
          users.push(currentUser);
        }
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
        const total = totalCount || 12;
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
    return <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>;
  }
  return;
};
export default TeamProgress;