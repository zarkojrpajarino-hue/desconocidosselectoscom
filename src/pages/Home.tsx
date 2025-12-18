import { useAuth } from '@/contexts/AuthContext';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Palette, Brain, TrendingUp, Building2, Lock, Zap, Link2, PieChart } from 'lucide-react';
import { RoleInvitationCard } from '@/components/RoleInvitationCard';
import { TrialStatusWidget } from '@/components/TrialStatusWidget';
import { PlanUsageWidget, UpgradePrompt } from '@/components/plan';
import { PlanType, PlanLimits } from '@/constants/subscriptionLimits';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Section {
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  gradient: string;
  requiredPlan?: PlanType;
  featureKey?: keyof PlanLimits;
}

const Home = () => {
  const { userProfile, currentOrganizationId, userOrganizations, user, switchOrganization } = useAuth();
  const planAccess = usePlanAccess();
  const navigate = useNavigate();
  
  const currentOrganization = userOrganizations.find(org => org.organization_id === currentOrganizationId);
  
  // Nombre y email con fallbacks
  const displayName = userProfile?.full_name || user?.email?.split('@')[0] || 'Usuario';
  const displayEmail = userProfile?.email || user?.email || '';

  const sections: Section[] = [
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
      description: 'Dashboard inteligente con insights profundos, proyecciones y recomendaciones',
      icon: Brain,
      path: '/ai-analysis',
      gradient: 'from-violet-500 to-purple-600',
      requiredPlan: 'professional',
      featureKey: 'ai_competitive_analysis'
    },
    {
      title: 'BI Avanzado',
      description: 'Dashboards ejecutivos, análisis de cohortes y reportes avanzados',
      icon: PieChart,
      path: '/bi',
      gradient: 'from-indigo-500 to-blue-600',
      requiredPlan: 'professional',
      featureKey: 'advanced_reports'
    },
    {
      title: 'Herramientas',
      description: 'Herramientas Visuales y Módulos de Práctica',
      icon: Palette,
      path: '/herramientas-hub',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Integraciones',
      description: 'Conecta con Slack, HubSpot, Google Calendar y más',
      icon: Link2,
      path: '/integraciones',
      gradient: 'from-orange-500 to-red-500',
      requiredPlan: 'professional',
      featureKey: 'google_calendar'
    }
  ];

  const checkAccess = (section: Section): boolean => {
    if (!section.featureKey) return true;
    return planAccess.hasFeature(section.featureKey);
  };

  const handleSectionClick = (section: Section) => {
    if (checkAccess(section)) {
      navigate(section.path);
    } else {
      navigate('/#pricing');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Trial Status Widget */}
        <TrialStatusWidget />
        
        {/* Plan Usage Widget for paid users */}
        {planAccess.isPaid && (
          <div className="mb-4">
            <PlanUsageWidget 
              label={`Leads (${planAccess.planName})`}
              current={0}
              limit={planAccess.limits.max_leads_per_month}
              variant="compact"
              className="bg-gradient-to-br from-primary/5 to-accent/5"
            />
          </div>
        )}
        
        {/* Profile Card with Welcome Message */}
        <div id="user-profile-section" className="mb-4 md:mb-8">
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 shadow-card">
            <CardContent className="pt-4 md:pt-6 pb-4 md:pb-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 md:gap-6">
                <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-primary flex items-center justify-center text-xl md:text-2xl font-bold text-white shadow-lg flex-shrink-0">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-xl md:text-3xl font-bold text-foreground truncate">
                        Bienvenido {displayName}
                      </h1>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[10px] px-1.5 py-0 h-5 shrink-0",
                          planAccess.isEnterprise && "border-violet-500/50 text-violet-500 bg-violet-500/10",
                          planAccess.isProfessional && "border-primary/50 text-primary bg-primary/10",
                          planAccess.isStarter && "border-emerald-500/50 text-emerald-500 bg-emerald-500/10",
                          planAccess.isFree && "border-muted-foreground/50 text-muted-foreground"
                        )}
                      >
                        {planAccess.planName}
                      </Badge>
                    </div>
                    {displayEmail && (
                      <p className="text-xs md:text-sm text-muted-foreground mb-1 truncate">
                        📧 {displayEmail}
                      </p>
                    )}
                    {currentOrganization && (
                      <div className="flex items-center gap-1 text-xs md:text-sm mt-1">
                        <Building2 className="h-3 w-3 flex-shrink-0" />
                        <span className="font-medium truncate">{currentOrganization.organization_name}</span>
                      </div>
                    )}
                    <p className="text-xs md:text-base text-muted-foreground mt-2 hidden sm:block">
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

        {/* Section Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {sections.map((section) => {
            const Icon = section.icon;
            const hasAccess = checkAccess(section);
            const isLocked = !hasAccess && section.requiredPlan;
            
            return (
              <Card
                key={section.path}
                className={cn(
                  "cursor-pointer transition-all duration-300 active:scale-95 border-2 relative overflow-hidden",
                  hasAccess 
                    ? "hover:shadow-lg md:hover:scale-105" 
                    : "opacity-75 hover:opacity-90"
                )}
                onClick={() => handleSectionClick(section)}
              >
                {/* Locked overlay */}
                {isLocked && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                    <div className="text-center p-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                        <Lock className="w-6 h-6 text-primary" />
                      </div>
                      <Badge 
                        variant="outline" 
                        className="border-primary/50 text-primary bg-primary/10"
                      >
                        Requiere {section.requiredPlan?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                )}
                
                <CardHeader className="p-4 md:p-6">
                  <div className="flex items-start justify-between">
                    <div className={cn(
                      "w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br flex items-center justify-center mb-3 md:mb-4",
                      section.gradient
                    )}>
                      <Icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    </div>
                    {isLocked && (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                    {section.title}
                    {section.requiredPlan && hasAccess && (
                      <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">
                        {section.requiredPlan.toUpperCase()}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    {section.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Upgrade CTA for non-paid users */}
        {!planAccess.isPaid && (
          <div className="mt-8">
            <UpgradePrompt
              variant="banner"
              targetPlan="starter"
              features={[
                '10 usuarios en tu equipo',
                '1,000 leads/mes',
                'Exportación CSV',
                'Soporte por email'
              ]}
              className="bg-gradient-to-r from-primary/10 to-violet-500/10 border-primary/20"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
