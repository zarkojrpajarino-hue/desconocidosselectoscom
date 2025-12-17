import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, User, MapPin, Building2, Users, Bell } from 'lucide-react';
import UserProfile from '@/components/UserProfile';
import UserOrganizations from '@/components/UserOrganizations';
import OrganizationUsers from '@/components/OrganizationUsers';
import { NotificationSettings } from '@/components/mobile/NotificationSettings';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';
import { useIsMobileDevice } from '@/hooks/useDeviceType';

const Profile = () => {
  const { user, loading, userOrganizations, currentOrganizationId } = useAuth();
  const navigate = useNavigate();
  const { restartTour } = useOnboardingTour();
  const isMobile = useIsMobileDevice();
  const [hasTeam, setHasTeam] = useState<boolean | null>(null);

  const isAdmin = userOrganizations.find(
    org => org.organization_id === currentOrganizationId
  )?.role === 'admin';

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchOrgSettings = async () => {
      if (!currentOrganizationId) return;
      const { data } = await supabase
        .from('organizations')
        .select('has_team')
        .eq('id', currentOrganizationId)
        .single();
      if (data) setHasTeam(data.has_team ?? true);
    };
    fetchOrgSettings();
  }, [currentOrganizationId]);

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
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <User className="w-6 h-6 md:w-8 md:h-8 text-primary flex-shrink-0" />
            <h1 className="text-lg md:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent truncate">
              Mi Perfil
            </h1>
          </div>
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            <Button
              variant="outline"
              onClick={restartTour}
              size={isMobile ? "sm" : "default"}
              className="gap-1 md:gap-2"
            >
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Ver Tour Nuevamente</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              size={isMobile ? "sm" : "default"}
              className="gap-1 md:gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-7xl">
        <Tabs defaultValue="profile" className="space-y-4 md:space-y-6">
          <TabsList className={`flex overflow-x-auto w-full max-w-xl gap-1 ${isMobile ? '' : isAdmin ? 'grid grid-cols-4' : 'grid grid-cols-3'}`}>
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Mi Perfil</span>
              <span className="sm:hidden">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="organizations" className="gap-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Organizaciones</span>
              <span className="sm:hidden">Orgs</span>
            </TabsTrigger>
            {isAdmin && !isMobile && (
              <TabsTrigger value="team" className="gap-2">
                <Users className="w-4 h-4" />
                {hasTeam ? 'Equipo' : 'Tu Trabajo'}
              </TabsTrigger>
            )}
            {isMobile && (
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="w-4 h-4" />
                Notif.
              </TabsTrigger>
            )}
            {!isMobile && (
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="w-4 h-4" />
                Notificaciones
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="profile">
            <UserProfile />
          </TabsContent>

          <TabsContent value="organizations">
            <UserOrganizations />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="team">
              <OrganizationUsers />
            </TabsContent>
          )}

          <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;