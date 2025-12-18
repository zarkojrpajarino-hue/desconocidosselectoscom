import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Search,
  Bell,
  Menu,
  ChevronRight,
  Moon,
  Sun,
  Settings,
  LogOut,
  User,
  HelpCircle,
  Crown,
  Zap,
  ArrowUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LanguageSelector } from '@/components/LanguageSelector';
import { OrganizationSwitcher } from '@/components/OrganizationSwitcher';

interface HeaderProps {
  onMenuClick?: () => void;
}

// Breadcrumb mapping adaptado a tus rutas
const breadcrumbMap: Record<string, string> = {
  home: 'Inicio',
  dashboard: 'Dashboard',
  agenda: 'Agenda Semanal',
  gamification: 'Gamificación',
  notifications: 'Notificaciones',
  'business-metrics': 'KPIs',
  okrs: 'OKRs',
  crm: 'CRM',
  financial: 'Finanzas',
  'ai-analysis': 'Análisis IA',
  'herramientas-hub': 'Herramientas',
  herramientas: 'Herramientas',
  practicar: 'Practicar',
  
  profile: 'Perfil',
  alerts: 'Alertas',
  scalability: 'Escalabilidad',
  admin: 'Administración',
};

export function Header({ onMenuClick }: HeaderProps) {
  const { t } = useTranslation();
  const { userProfile, signOut, user } = useAuth();
  const planAccess = usePlanAccess();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  // Nombre y email con fallbacks
  const displayName = userProfile?.full_name || user?.email?.split('@')[0] || 'Usuario';
  const displayEmail = userProfile?.email || user?.email || '';

  // Generate breadcrumbs
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => ({
    label: breadcrumbMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
    path: '/' + pathSegments.slice(0, index + 1).join('/'),
    isLast: index === pathSegments.length - 1,
  }));

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="header sticky top-0 z-30 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left: Menu button (mobile) + Breadcrumbs */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Breadcrumbs */}
          <nav className="hidden sm:flex items-center gap-1.5 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.path} className="flex items-center gap-1.5">
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <button
                  onClick={() => !crumb.isLast && navigate(crumb.path)}
                  className={cn(
                    'transition-colors',
                    crumb.isLast
                      ? 'font-medium text-foreground cursor-default'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {crumb.label}
                </button>
              </div>
            ))}
          </nav>
        </div>

        {/* Right: Search, Notifications, User */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar... (⌘K)"
              className={cn(
                'pl-9 pr-4 h-9 w-64 bg-muted/50 border-0',
                'focus:bg-background focus:ring-1 focus:ring-primary/20',
                'placeholder:text-muted-foreground/60'
              )}
            />
          </div>

          {/* Organization Switcher */}
          <OrganizationSwitcher />

          {/* Language Selector */}
          <LanguageSelector />

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground"
          >
            {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => navigate('/alerts')}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 pl-2 pr-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden lg:block text-sm font-medium">
                  {displayName.split(' ')[0]}
                </span>
                {/* Plan Badge en header */}
                <Badge 
                  variant="outline" 
                  className={cn(
                    "hidden lg:flex text-[10px] px-1.5 py-0 h-5",
                    planAccess.isEnterprise && "border-violet-500/50 text-violet-500 bg-violet-500/10",
                    planAccess.isProfessional && "border-primary/50 text-primary bg-primary/10",
                    planAccess.isStarter && "border-emerald-500/50 text-emerald-500 bg-emerald-500/10",
                    planAccess.isFree && "border-muted-foreground/50 text-muted-foreground"
                  )}
                >
                  {planAccess.isEnterprise && <Crown className="h-3 w-3 mr-0.5" />}
                  {planAccess.isProfessional && <Zap className="h-3 w-3 mr-0.5" />}
                  {planAccess.planName}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold">{displayName}</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    {displayEmail}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* Plan Info */}
              <div className="px-2 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Plan actual:</span>
                  <Badge 
                    className={cn(
                      "text-xs",
                      planAccess.isEnterprise && "bg-violet-500/20 text-violet-600 border-violet-500/30",
                      planAccess.isProfessional && "bg-primary/20 text-primary border-primary/30",
                      planAccess.isStarter && "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",
                      planAccess.isFree && "bg-muted text-muted-foreground"
                    )}
                  >
                    {planAccess.isEnterprise && <Crown className="h-3 w-3 mr-1" />}
                    {planAccess.isProfessional && <Zap className="h-3 w-3 mr-1" />}
                    {planAccess.planName}
                  </Badge>
                </div>
                {!planAccess.isEnterprise && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-2 text-xs h-8"
                    onClick={() => navigate('/select-plan')}
                  >
                    <ArrowUp className="h-3 w-3 mr-1" />
                    Subir Plan
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                {t('nav.profile')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <Settings className="mr-2 h-4 w-4" />
                {t('nav.settings')}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                {t('common.help', 'Centro de Ayuda')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                {t('nav.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export default Header;
