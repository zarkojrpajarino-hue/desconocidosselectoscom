import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import WeeklyAgenda from '@/components/WeeklyAgenda';
import AvailabilityQuestionnaire from '@/components/AvailabilityQuestionnaire';
import { toast } from 'sonner';

const Agenda = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isWeekLocked, setIsWeekLocked] = useState(false);
  const [nextWeekStart, setNextWeekStart] = useState<string>('');
  const [hasAvailability, setHasAvailability] = useState<boolean | null>(null);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      calculateNextWeekStart();
      checkAvailability();
    }
  }, [user]);

  const checkAvailability = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_weekly_availability')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      setHasAvailability(!!data);
    } catch (error) {
      console.error('Error checking availability:', error);
      setHasAvailability(false);
    }
  };

  const calculateNextWeekStart = () => {
    // Calcular próximo miércoles
    const today = new Date();
    const dayOfWeek = today.getDay();
    let daysUntilWednesday = (3 - dayOfWeek + 7) % 7;
    
    // Si hoy es miércoles y ya pasó la 13:30, siguiente miércoles
    if (dayOfWeek === 3 && today.getHours() >= 13 && today.getMinutes() >= 30) {
      daysUntilWednesday = 7;
    }
    
    const nextWed = new Date(today);
    nextWed.setDate(today.getDate() + daysUntilWednesday);
    nextWed.setHours(13, 30, 0, 0);
    
    setNextWeekStart(nextWed.toISOString().split('T')[0]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Mi Agenda Coordinada
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/home')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Menú
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Card className="shadow-card bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/10 dark:to-blue-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              📅 Agenda Semanal
            </CardTitle>
            <CardDescription>
              Agenda generada automáticamente según tu disponibilidad y coordinada con tu equipo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasAvailability === null ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Cargando agenda...</p>
              </div>
            ) : !hasAvailability && !showQuestionnaire ? (
              <div className="text-center py-12 space-y-4">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-warning" />
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-foreground">
                    Configura tu disponibilidad
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Para generar tu agenda semanal, primero necesitas configurar tus horarios disponibles.
                    Esto permitirá al sistema coordinar tus tareas con el resto del equipo.
                  </p>
                </div>
                <Button
                  onClick={() => setShowQuestionnaire(true)}
                  className="bg-gradient-primary"
                  size="lg"
                >
                  📅 Configurar Disponibilidad
                </Button>
              </div>
            ) : showQuestionnaire ? (
              <AvailabilityQuestionnaire
                userId={user!.id}
                weekStart={nextWeekStart}
                onComplete={() => {
                  setShowQuestionnaire(false);
                  setHasAvailability(true);
                  toast.success('✅ Disponibilidad guardada', {
                    description: 'Tu agenda se generará automáticamente el próximo lunes'
                  });
                }}
              />
            ) : nextWeekStart ? (
              <WeeklyAgenda
                userId={user!.id}
                weekStart={nextWeekStart}
                isLocked={isWeekLocked}
              />
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Cargando agenda...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Agenda;
