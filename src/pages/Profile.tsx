import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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

  const isAdmin = userOrganizations.find(
    org => org.organization_id === currentOrganizationId
  )?.role === 'admin';

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

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
            <User className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Mi Perfil
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={restartTour}
              className="gap-2"
            >
              <MapPin className="h-4 w-4" />
              Ver Tour Nuevamente
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className={`grid w-full max-w-xl ${isMobile ? 'grid-cols-2' : isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
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
                Equipo
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