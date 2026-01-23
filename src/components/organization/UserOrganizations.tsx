import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Users, Check, Bell, Crown, Shield, User as UserIcon, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DEMO_ORGANIZATIONS } from '@/data/demo-profile-data';

interface OrganizationWithNotifications {
  organization_id: string;
  organization_name: string;
  role: string;
  unreadNotifications: number;
}

export default function UserOrganizations() {
  const { userOrganizations, currentOrganizationId, switchOrganization } = useAuth();
  const [orgsWithNotifications, setOrgsWithNotifications] = useState<OrganizationWithNotifications[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const displayOrgs = showDemo ? DEMO_ORGANIZATIONS : orgsWithNotifications;

  useEffect(() => {
    fetchNotificationsPerOrg();
  }, [userOrganizations]);

  const fetchNotificationsPerOrg = async () => {
    if (!userOrganizations || userOrganizations.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      const orgsData = await Promise.all(
        userOrganizations.map(async (org) => {
          const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.organization_id)
            .eq('read', false);

          return {
            organization_id: org.organization_id,
            organization_name: org.organization_name,
            role: org.role,
            unreadNotifications: count || 0
          };
        })
      );

      setOrgsWithNotifications(orgsData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Error al cargar notificaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchOrganization = (orgId: string) => {
    if (orgId === currentOrganizationId) return;
    setIsSwitching(true);
    switchOrganization(orgId);
    setIsSwitching(false);
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

  const totalNotifications = displayOrgs.reduce((sum, org) => sum + org.unreadNotifications, 0);
  const adminOrgsCount = displayOrgs.filter(org => org.role === 'admin').length;

  if (isLoading && !showDemo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando organizaciones...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (displayOrgs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mis Organizaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No perteneces a ninguna organización.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Demo Toggle */}
      <div className="flex items-center justify-end gap-2 p-2 bg-muted/30 rounded-lg">
        <Eye className="w-4 h-4 text-muted-foreground" />
        <Label htmlFor="org-demo-toggle" className="text-sm text-muted-foreground">
          Ver datos demo
        </Label>
        <Switch
          id="org-demo-toggle"
          checked={showDemo}
          onCheckedChange={setShowDemo}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Organizaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayOrgs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Como Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{adminOrgsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Notificaciones Sin Leer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalNotifications}</div>
          </CardContent>
        </Card>
      </div>

      {/* Organizations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Mis Organizaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {displayOrgs.map((org) => {
            const isCurrent = !showDemo && org.organization_id === currentOrganizationId;
            
            return (
              <Card key={org.organization_id} className={`transition-all ${isCurrent ? 'border-2 border-primary' : 'hover:border-primary/50'}`}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    {/* Left: Org Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{org.organization_name}</h3>
                        {isCurrent && (
                          <Badge variant="outline" className="gap-1">
                            <Check className="w-3 h-3" />
                            Actual
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          {getRoleIcon(org.role)}
                          <Badge className={getRoleBadgeColor(org.role)}>
                            {getRoleLabel(org.role)}
                          </Badge>
                        </div>

                        {org.unreadNotifications > 0 && (
                          <div className="flex items-center gap-1">
                            <Bell className="w-4 h-4 text-primary" />
                            <Badge variant="secondary">
                              {org.unreadNotifications} sin leer
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Action Button */}
                    {!isCurrent && !showDemo && (
                      <Button
                        onClick={() => handleSwitchOrganization(org.organization_id)}
                        disabled={isSwitching}
                        variant="outline"
                      >
                        Cambiar
                      </Button>
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