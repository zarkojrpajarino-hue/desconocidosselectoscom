import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, History, User, ChevronRight } from 'lucide-react';

interface UserWithRole {
  id: string;
  full_name: string;
  strategic_objectives: string | null;
  role: string;
  okr_count: number;
}

const OKRsHistory = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAllUsers();
    }
  }, [user]);

  const fetchAllUsers = async () => {
    setLoadingData(true);
    try {
      // Obtener todos los usuarios
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, strategic_objectives, role')
        .order('full_name', { ascending: true });

      if (usersError) throw usersError;

      // Para cada usuario, contar sus OKRs
      const usersWithOKRCount = await Promise.all(
        (usersData || []).map(async (userData) => {
          const { count } = await supabase
            .from('objectives')
            .select('id', { count: 'exact', head: true })
            .eq('owner_user_id', userData.id)
            .ilike('quarter', 'Semana%');

          return {
            ...userData,
            okr_count: count || 0
          };
        })
      );

      setUsers(usersWithOKRCount);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'leader':
        return 'bg-primary/10 text-primary border-primary/20';
      default:
        return 'bg-secondary/10 text-secondary-foreground border-secondary/20';
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background pb-20 md:pb-0">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-card">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <History className="w-6 h-6 md:w-8 md:h-8 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg md:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent truncate">
                Historial OKRs
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground truncate">
                Selecciona usuario para ver historial
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/okrs')}
            className="gap-1 md:gap-2 h-8 md:h-9 px-2 md:px-3 flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden md:inline">Volver</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-7xl">
        <div className="space-y-6">
          {/* Información introductoria */}
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <History className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Explora el historial del equipo</h3>
                  <p className="text-sm text-muted-foreground">
                    Haz clic en cualquier miembro del equipo para ver su historial completo de OKRs semanales, 
                    incluyendo progreso, comentarios y evidencias de cada Key Result.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grid de usuarios */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((userData) => (
              <Card 
                key={userData.id}
                className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50"
                onClick={() => navigate(`/okrs/history/${userData.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{userData.full_name}</CardTitle>
                        <CardDescription className="text-sm font-medium">
                          {userData.strategic_objectives || 'Sin área definida'}
                        </CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={getRoleColor(userData.role)}>
                      {userData.role === 'admin' ? 'Administrador' :
                       userData.role === 'leader' ? 'Líder' : 'Miembro'}
                    </Badge>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{userData.okr_count}</div>
                      <div className="text-xs text-muted-foreground">
                        OKRs {userData.okr_count === 1 ? 'generado' : 'generados'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {users.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <User className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No hay usuarios</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  No se encontraron usuarios en el sistema
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default OKRsHistory;
