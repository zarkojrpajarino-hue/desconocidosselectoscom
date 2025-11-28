import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, ChevronUp, Users, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

const TeamProgress = ({ currentPhase, currentUserId }: TeamProgressProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [teamData, setTeamData] = useState<TeamMemberProgress[]>([]);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentPhase) {
      fetchTeamProgress();
    }
  }, [currentPhase]);

  const fetchTeamProgress = async () => {
    setLoading(true);
    try {
      // Obtener todos los usuarios (incluido el actual si no está en la lista)
      const { data: users } = await supabase
        .from('users')
        .select('id, username, full_name')
        .neq('role', 'admin')
        .order('username');

      if (!users) return;

      // Asegurarse de que el usuario actual está en la lista
      const userIds = users.map(u => u.id);
      if (currentUserId && !userIds.includes(currentUserId)) {
        const { data: currentUser } = await supabase
          .from('users')
          .select('id, username, full_name')
          .eq('id', currentUserId)
          .single();
        
        if (currentUser) {
          users.push(currentUser);
        }
      }

      // Para cada usuario, obtener sus tareas y completaciones
      const progressData = await Promise.all(
        users.map(async (user) => {
          // Contar tareas totales del usuario en esta fase
          const { count: totalCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('phase', currentPhase);

          // Contar tareas completadas (validated_by_leader = true)
          const { data: completions } = await supabase
            .from('task_completions')
            .select('task_id')
            .eq('user_id', user.id)
            .eq('validated_by_leader', true);

          // Verificar que las completaciones pertenecen a tareas de esta fase
          let completedCount = 0;
          if (completions && completions.length > 0) {
            const taskIds = completions.map(c => c.task_id);
            const { count } = await supabase
              .from('tasks')
              .select('*', { count: 'exact', head: true })
              .in('id', taskIds)
              .eq('phase', currentPhase);
            completedCount = count || 0;
          }

          const total = totalCount || 12;
          const completed = completedCount || 0;
          const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

          return {
            id: user.id,
            username: user.username,
            full_name: user.full_name || user.username,
            completed,
            total,
            percentage
          };
        })
      );

      setTeamData(progressData);

      // Calcular totales
      const totalTasksCount = progressData.reduce((sum, member) => sum + member.total, 0);
      const totalCompletedCount = progressData.reduce((sum, member) => sum + member.completed, 0);
      
      setTotalTasks(totalTasksCount);
      setTotalCompleted(totalCompletedCount);
    } catch (error) {
      console.error('Error fetching team progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const remainingTasks = totalTasks - totalCompleted;
  const teamPercentage = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  // Calcular rango de cestas según la fase (cada fase tiene un rango específico)
  const getBasketRange = (phase: number) => {
    switch (phase) {
      case 1: return '0 a 25';
      case 2: return '25 a 50';
      case 3: return '50 a 75';
      case 4: return '75 a 100';
      default: return '0 a 25';
    }
  };
  
  const basketsRange = getBasketRange(currentPhase);

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
    <Card className="shadow-card border-2 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Users className="h-5 w-5 text-primary" />
          📊 Progreso del Equipo - Fase {currentPhase}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumen general */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-primary">
                {totalCompleted}/{totalTasks} tareas completadas
              </p>
              <p className="text-sm text-muted-foreground">
                De {basketsRange} cestas
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{teamPercentage}%</p>
              <p className="text-xs text-muted-foreground">completado</p>
            </div>
          </div>

          <Progress value={teamPercentage} className="h-3" />

          <div className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-amber-500" />
            <span className="text-muted-foreground">
              Quedan <span className="font-bold text-foreground">{remainingTasks} tareas</span> para completar la fase
            </span>
          </div>
        </div>

        {/* Botón expandir/colapsar */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Ocultar progreso por miembro
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Ver progreso por miembro
            </>
          )}
        </Button>

        {/* Lista de miembros expandible */}
        {isExpanded && (
          <div className="space-y-3 pt-2 border-t">
            {teamData
              .sort((a, b) => b.completed - a.completed) // Ordenar por completadas
              .map((member) => (
                 <div 
                  key={member.id} 
                  className={`space-y-2 p-3 rounded-lg ${
                    member.id === currentUserId 
                      ? 'bg-primary/10 border-2 border-primary/30' 
                      : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{member.full_name}</p>
                      <p className="text-xs text-muted-foreground">@{member.username}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {member.completed}/{member.total}
                      </p>
                      <p className="text-xs text-muted-foreground">{member.percentage}%</p>
                    </div>
                  </div>
                  
                  <Progress value={member.percentage} className="h-2" />
                  
                  {/* Visualización con emojis */}
                  <div className="flex flex-wrap gap-1">
                    {Array.from({ length: member.total }).map((_, index) => (
                      <span key={index} className="text-lg">
                        {index < member.completed ? '✅' : '⬜'}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamProgress;
