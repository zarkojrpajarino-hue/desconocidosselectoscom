import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Target,
  Wallet,
  Brain,
  Palette,
  GraduationCap,
  Calculator,
  Trophy,
  Bell,
  Settings,
  ChevronDown,
  ChevronRight,
  Building2,
  LogOut,
  Sparkles,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: string | number;
  children?: NavItemProps[];
}

// RUTAS ADAPTADAS a tu proyecto actual
const navigation: NavItemProps[] = [
  {
    to: '/home',
    icon: LayoutDashboard,
    label: 'Inicio',
  },
  {
    to: '/dashboard/home',
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
  {
    to: '/metrics',
    icon: BarChart3,
    label: 'Métricas',
    children: [
      { to: '/business-metrics', icon: BarChart3, label: 'KPIs' },
      { to: '/okrs', icon: Target, label: 'OKRs' },
      { to: '/crm', icon: Users, label: 'CRM' },
      { to: '/financial', icon: Wallet, label: 'Finanzas' },
    ],
  },
  {
    to: '/ai-analysis',
    icon: Brain,
    label: 'Análisis IA',
    badge: 'PRO',
  },
  {
    to: '/herramientas-hub',
    icon: Palette,
    label: 'Herramientas',
    children: [
      { to: '/herramientas/lead-scoring', icon: Palette, label: 'Lead Scoring' },
      { to: '/herramientas/buyer-persona', icon: Palette, label: 'Buyer Persona' },
      { to: '/herramientas/customer-journey', icon: Palette, label: 'Customer Journey' },
      { to: '/herramientas/brand-kit', icon: Palette, label: 'Brand Kit' },
      { to: '/practicar/simulador', icon: GraduationCap, label: 'Simulador' },
      { to: '/calculadora', icon: Calculator, label: 'Calculadora' },
    ],
  },
  {
    to: '/gamification',
    icon: Trophy,
    label: 'Gamificación',
  },
];

const bottomNavigation: NavItemProps[] = [
  { to: '/alerts', icon: Bell, label: 'Alertas' },
  { to: '/profile', icon: Settings, label: 'Configuración' },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

function NavItem({ item, isCollapsed }: { item: NavItemProps; isCollapsed: boolean }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = location.pathname === item.to || 
    (hasChildren && item.children?.some(child => location.pathname.startsWith(child.to)));

  const Icon = item.icon;

  if (hasChildren) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              'sidebar-nav-item w-full justify-between',
              isActive && 'bg-sidebar-accent/10 text-sidebar-accent'
            )}
          >
            <span className="flex items-center gap-3">
              <Icon className="sidebar-nav-item-icon" />
              {!isCollapsed && <span>{item.label}</span>}
            </span>
            {!isCollapsed && (
              <span className="transition-transform duration-200">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </span>
            )}
          </button>
        </CollapsibleTrigger>
        {!isCollapsed && (
          <CollapsibleContent className="pl-4 space-y-1 mt-1">
            {item.children?.map((child) => (
              <NavLink
                key={child.to}
                to={child.to}
                className={({ isActive }) =>
                  cn(
                    'sidebar-nav-item text-sm',
                    isActive && 'active'
                  )
                }
              >
                <child.icon className="sidebar-nav-item-icon" />
                <span>{child.label}</span>
              </NavLink>
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    );
  }

  const navLinkContent = (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn('sidebar-nav-item', isActive && 'active')
      }
    >
      <Icon className="sidebar-nav-item-icon" />
      {!isCollapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          {item.badge && (
            <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-5 bg-primary/20 text-primary-foreground">
              {item.badge}
            </Badge>
          )}
        </>
      )}
    </NavLink>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{navLinkContent}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {item.label}
          {item.badge && <Badge variant="secondary">{item.badge}</Badge>}
        </TooltipContent>
      </Tooltip>
    );
  }

  return navLinkContent;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const { userProfile, currentOrganizationId, userOrganizations, signOut } = useAuth();
  
  const currentOrganization = userOrganizations.find(
    (org) => org.organization_id === currentOrganizationId
  );

  return (
    <aside
      className={cn(
        'sidebar h-full flex flex-col transition-all duration-300',
        isCollapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Logo & Brand */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sidebar-foreground text-sm leading-tight">
                Experiencia
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">
                Selecta
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-sidebar-accent/10 text-muted-foreground hover:text-sidebar-foreground transition-colors"
        >
          {isCollapsed ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Organization Switcher */}
      {currentOrganization && !isCollapsed && (
        <div className="px-3 py-4 border-b border-sidebar-border">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent/10 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-sidebar-accent/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-sidebar-accent" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {currentOrganization.organization_name}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {currentOrganization.role}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavItem key={item.to} item={item} isCollapsed={isCollapsed} />
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 py-2 border-t border-sidebar-border">
        {bottomNavigation.map((item) => (
          <NavItem key={item.to} item={item} isCollapsed={isCollapsed} />
        ))}
      </div>

      {/* User Profile */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className={cn(
          'flex items-center gap-3',
          isCollapsed ? 'justify-center' : 'px-3'
        )}>
          <Avatar className="h-9 w-9 border-2 border-sidebar-accent/20">
            <AvatarFallback className="bg-gradient-primary text-white text-sm font-semibold">
              {userProfile?.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {userProfile?.full_name || 'Usuario'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                @{userProfile?.username}
              </p>
            </div>
          )}
          {!isCollapsed && (
            <button
              onClick={() => signOut()}
              className="p-2 rounded-lg hover:bg-sidebar-accent/10 text-muted-foreground hover:text-sidebar-foreground transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
