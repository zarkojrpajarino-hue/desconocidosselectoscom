import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Crown, Shield, User as UserIcon, Trash2, Mail, Calendar, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface OrganizationUser {
  user_id: string;
  role: string;
  created_at: string;
  user: {
    id: string;
    email: string;
    full_name: string;
  };
  tasks_completed: number;
}

export default function OrganizationUsers() {
  const { user, currentOrganizationId, userOrganizations } = useAuth();
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const isAdmin = userOrganizations.find(
    org => org.organization_id === currentOrganizationId
  )?.role === 'admin';

  useEffect(() => {
    if (currentOrganizationId) {
      fetchOrganizationUsers();
    }
  }, [currentOrganizationId]);

  const fetchOrganizationUsers = async () => {
    if (!currentOrganizationId) return;

    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          role,
          created_at,
          users!inner(id, email, full_name)
        `)
        .eq('organization_id', currentOrganizationId);

      if (rolesError) throw rolesError;

      interface UserRoleData {
        user_id: string;
        role: string;
        created_at: string;
        users: { id: string; email: string; full_name: string };
      }

      const usersWithTasks = await Promise.all(
        ((rolesData || []) as unknown as UserRoleData[]).map(async (roleData) => {
          const { count } = await supabase
            .from('task_completions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', roleData.user_id)
            .eq('validated_by_leader', true);

          return {
            user_id: roleData.user_id,
            role: roleData.role,
            created_at: roleData.created_at,
            user: {
              id: roleData.users.id,
              email: roleData.users.email,
              full_name: roleData.users.full_name
            },
            tasks_completed: count || 0
          };
        })
      );

      setUsers(usersWithTasks);
    } catch (error) {
      console.error('Error fetching organization users:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!currentOrganizationId) return;
    if (userId === user?.id) {
      toast.error('No puedes eliminarte a ti mismo');
      return;
    }

    setDeletingUserId(userId);
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('organization_id', currentOrganizationId);

      if (error) throw error;

      toast.success('Usuario eliminado de la organización');
      fetchOrganizationUsers();
    } catch (error) {
      console.error('Error removing user:', error);
      toast.error('Error al eliminar usuario');
    } finally {
      setDeletingUserId(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4 text-destructive" />;
      case 'leader': return <Shield className="w-4 h-4 text-purple-500" />;
      default: return <UserIcon className="w-4 h-4 text-primary" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-destructive/10 text-destructive';
      case 'leader': return 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300';
      default: return 'bg-primary/10 text-primary';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'leader': return 'Líder';
      default: return 'Miembro';
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acceso Restringido</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Solo los administradores pueden gestionar usuarios.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando usuarios...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const adminCount = users.filter(u => u.role === 'admin').length;
  const leaderCount = users.filter(u => u.role === 'leader').length;
  const memberCount = users.filter(u => u.role !== 'admin' && u.role !== 'leader').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{adminCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Líderes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{leaderCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Miembros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{memberCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Usuarios de la Organización
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.map((orgUser) => {
            const isCurrentUser = orgUser.user_id === user?.id;
            const canDelete = isAdmin && !isCurrentUser && orgUser.role !== 'admin';

            return (
              <Card key={orgUser.user_id} className="hover:border-primary/50 transition-all">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    {/* Left: User Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{orgUser.user.full_name}</h3>
                        {isCurrentUser && (
                          <Badge variant="outline" className="gap-1">
                            Tú
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          {getRoleIcon(orgUser.role)}
                          <Badge className={getRoleBadgeColor(orgUser.role)}>
                            {getRoleLabel(orgUser.role)}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          <span>{orgUser.user.email}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {format(new Date(orgUser.created_at), 'dd MMM yyyy', { locale: es })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          <span>{orgUser.tasks_completed} tareas completadas</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Action Button */}
                    {canDelete && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={deletingUserId === orgUser.user_id}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esto eliminará a <strong>{orgUser.user.full_name}</strong> de la organización.
                              Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveUser(orgUser.user_id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}