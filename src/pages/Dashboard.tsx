import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Trophy } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useEffect } from 'react';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Redirigir a dashboard home si estamos en /dashboard exacto
  useEffect(() => {
    if (location.pathname === '/dashboard') {
      navigate('/dashboard/home', { replace: true });
    }
  }, [location.pathname, navigate]);

  const tabs = [
    { path: '/dashboard/home', label: 'Panel Principal', icon: LayoutDashboard },
    { path: '/dashboard/agenda', label: 'Agenda Semanal', icon: Calendar },
    { path: '/dashboard/gamification', label: 'Gamificación', icon: Trophy }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container max-w-7xl mx-auto px-4 py-6">
        {/* Tabs superiores */}
        <div className="border-b border-border mb-6 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent whitespace-nowrap flex items-center gap-2"
                  activeClassName="text-primary border-primary"
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Contenido de la sub-ruta */}
        <Outlet />
      </div>
    </div>
  );
};

export default Dashboard;