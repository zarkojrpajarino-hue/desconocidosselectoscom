import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Trophy, Bell } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useEffect } from 'react';
import { useTrialExpiration } from '@/hooks/useTrialExpiration';
import { SubscriptionBanner } from '@/components/SubscriptionBanner';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Verificar expiración del trial
  useTrialExpiration();

  // Redirigir a dashboard home si estamos en /dashboard exacto
  useEffect(() => {
    if (location.pathname === '/dashboard') {
      navigate('/dashboard/home', { replace: true });
    }
  }, [location.pathname, navigate]);

  const tabs = [
    { path: '/dashboard/home', label: t('dashboard.mainPanel'), icon: LayoutDashboard },
    { path: '/dashboard/gamification', label: t('dashboard.gamification'), icon: Trophy },
    { path: '/dashboard/notifications', label: t('dashboard.notifications'), icon: Bell }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container max-w-7xl mx-auto px-4 py-6">
        {/* Banner de subscripción - Esquina superior derecha */}
        <div className="flex justify-end mb-4">
          <SubscriptionBanner />
        </div>

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