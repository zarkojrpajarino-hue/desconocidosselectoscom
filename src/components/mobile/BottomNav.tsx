import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Home,
  Users,
  CheckSquare,
  TrendingUp,
  MoreHorizontal,
} from 'lucide-react';

const navItems = [
  {
    id: 'home',
    label: 'Inicio',
    icon: Home,
    path: '/home',
  },
  {
    id: 'metrics',
    label: 'Métricas',
    icon: TrendingUp,
    path: '/business-metrics',
  },
  {
    id: 'crm',
    label: 'CRM',
    icon: Users,
    path: '/crm',
  },
  {
    id: 'tasks',
    label: 'Tareas',
    icon: CheckSquare,
    path: '/agenda',
  },
  {
    id: 'more',
    label: 'Más',
    icon: MoreHorizontal,
    path: '/profile',
  },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/home') {
      return location.pathname === '/home' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border pb-safe md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 flex-1 transition-all duration-200 relative',
                'active:scale-95 touch-manipulation',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 transition-transform',
                  active && 'scale-110'
                )}
              />
              <span
                className={cn(
                  'text-[10px] font-medium transition-all',
                  active ? 'opacity-100' : 'opacity-70'
                )}
              >
                {item.label}
              </span>
              
              {/* Active indicator */}
              {active && (
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
