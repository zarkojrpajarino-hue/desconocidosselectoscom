import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, User, Zap, Shield, TrendingUp, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const WORK_MODES = [
  { id: 'conservador', label: 'Conservador', tasks: 5, hours: '2-3h', icon: Shield },
  { id: 'moderado', label: 'Moderado', tasks: 8, hours: '4-5h', icon: TrendingUp },
  { id: 'agresivo', label: 'Agresivo', tasks: 12, hours: '6-8h', icon: Zap },
];

export function WorkConfigReadOnly() {
  const { user } = useAuth();

  // Fetch work preferences
  const { data: preferences, isLoading: preferencesLoading } = useQuery({
    queryKey: ['work-preferences-readonly', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_global_agenda_settings')
        .select('has_team, collaborative_percentage')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch current work mode
  const { data: weeklyData, isLoading: modeLoading } = useQuery({
    queryKey: ['work-mode-readonly', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_weekly_data')
        .select('mode, task_limit')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const handleAttemptChange = () => {
    toast.info('Para hacer cambios dirígete al Dashboard. Esta es una vista oficial de tu agenda.', {
      duration: 4000,
    });
  };

  const hasTeam = preferences?.has_team ?? false;
  const collaborativePercentage = preferences?.collaborative_percentage ?? 70;
  const individualPercentage = 100 - collaborativePercentage;
  const currentMode = weeklyData?.mode || 'moderado';
  const currentModeData = WORK_MODES.find(m => m.id === currentMode) || WORK_MODES[1];

  if (preferencesLoading || modeLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
        <Info className="h-4 w-4 text-muted-foreground shrink-0" />
        <p className="text-sm text-muted-foreground">
          Vista de solo lectura. Para modificar tu configuración, dirígete al Dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Work Preferences Card */}
        <Card 
          className="cursor-pointer hover:bg-muted/20 transition-colors"
          onClick={handleAttemptChange}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {hasTeam ? <Users className="h-4 w-4 text-primary" /> : <User className="h-4 w-4 text-primary" />}
              Preferencias de Trabajo
            </CardTitle>
            <CardDescription className="text-xs">Tu configuración actual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">¿Tienes equipo?</span>
              <Badge variant={hasTeam ? 'default' : 'secondary'}>
                {hasTeam ? 'Sí' : 'No'}
              </Badge>
            </div>
            
            {hasTeam && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Distribución:</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-primary/20 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-primary">{collaborativePercentage}%</div>
                    <div className="text-xs text-muted-foreground">Colaborativo</div>
                  </div>
                  <div className="flex-1 bg-secondary/50 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-secondary-foreground">{individualPercentage}%</div>
                    <div className="text-xs text-muted-foreground">Individual</div>
                  </div>
                </div>
              </div>
            )}

            {!hasTeam && (
              <p className="text-xs text-muted-foreground">
                Todas tus tareas son individuales (100%)
              </p>
            )}
          </CardContent>
        </Card>

        {/* Work Mode Card */}
        <Card 
          className="cursor-pointer hover:bg-muted/20 transition-colors"
          onClick={handleAttemptChange}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <currentModeData.icon className="h-4 w-4 text-primary" />
              Modo de Trabajo
            </CardTitle>
            <CardDescription className="text-xs">Intensidad seleccionada</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <currentModeData.icon className="h-6 w-6 text-primary" />
              <div className="flex-1">
                <div className="font-semibold text-foreground">{currentModeData.label}</div>
                <div className="text-xs text-muted-foreground">
                  {currentModeData.tasks} tareas/semana • {currentModeData.hours}
                </div>
              </div>
              <Badge variant="outline" className="bg-primary/10">
                Activo
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              {WORK_MODES.map((mode) => (
                <div 
                  key={mode.id}
                  className={`text-center p-2 rounded ${
                    mode.id === currentMode 
                      ? 'bg-primary/20 text-primary font-medium' 
                      : 'bg-muted/30 text-muted-foreground'
                  }`}
                >
                  <div>{mode.label}</div>
                  <div className="text-[10px]">{mode.tasks} tareas</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
