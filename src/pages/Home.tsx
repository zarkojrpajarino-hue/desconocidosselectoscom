import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Palette, Brain, TrendingUp, Building2 } from 'lucide-react';
import { RoleInvitationCard } from '@/components/RoleInvitationCard';
import { TrialStatusWidget } from '@/components/TrialStatusWidget';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Home = () => {
  const { userProfile, currentOrganizationId, userOrganizations, switchOrganization } = useAuth();
  const navigate = useNavigate();
  
  const currentOrganization = userOrganizations.find(org => org.organization_id === currentOrganizationId);

  const sections = [
    {
      title: 'Dashboard de Trabajo',
      description: 'Gestiona tus tareas semanales, agenda, gamificación y notificaciones',
      icon: BarChart3,
      path: '/dashboard',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Métricas',
      description: 'KPI\'s, OKR, CRM y Panel Financiero del negocio',
      icon: TrendingUp,
      path: '/metrics',
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      title: 'Análisis con IA',
      description: 'Dashboard inteligente con insights profundos, proyecciones y recomendaciones accionables',
      icon: Brain,
      path: '/ai-analysis',
      gradient: 'from-violet-500 to-purple-600'
    },
    {
      title: 'Herramientas',
      description: 'Herramientas Visuales, Practicar y Calculadora',
      icon: Palette,
      path: '/herramientas-hub',
      gradient: 'from-purple-500 to-pink-500'
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Trial Status Widget */}
        <TrialStatusWidget />
        
        {/* Profile Card with Welcome Message */}
        <div id="user-profile-section" className="mb-8">
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 shadow-card">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-start justify-between flex-wrap gap-6">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-2xl font-bold text-white shadow-lg flex-shrink-0">
                    {userProfile?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                      Bienvenido {userProfile?.full_name || 'Usuario'}
                    </h1>
                    <p className="text-sm text-muted-foreground mb-1">@{userProfile?.username}</p>
                    {currentOrganization && (
                      <div className="flex items-center gap-1 text-sm mt-1">
                        <Building2 className="h-3 w-3" />
                        <span className="font-medium">{currentOrganization.organization_name}</span>
                      </div>
                    )}
                    <p className="text-muted-foreground mt-2">
                      Selecciona una sección para comenzar
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  {userOrganizations.length > 1 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Building2 className="h-4 w-4" />
                          Cambiar Organización
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuLabel>Tus Organizaciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {userOrganizations.map((org) => (
                          <DropdownMenuItem
                            key={org.organization_id}
                            onClick={() => switchOrganization(org.organization_id)}
                            className={currentOrganizationId === org.organization_id ? 'bg-primary/10' : ''}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{org.organization_name}</span>
                              <span className="text-xs text-muted-foreground">{org.role}</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tarjeta de invitación (solo para admins) */}
        <RoleInvitationCard />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Card
                key={section.path}
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 border-2"
                onClick={() => navigate(section.path)}
              >
                <CardHeader>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${section.gradient} flex items-center justify-center mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{section.title}</CardTitle>
                  <CardDescription className="text-base">
                    {section.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Home;
