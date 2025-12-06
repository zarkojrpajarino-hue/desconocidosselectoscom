import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';
import { useTrialExpiration } from '@/hooks/useTrialExpiration';
import { BottomNav, PWAInstallBanner } from '@/components/mobile';
import { useIsMobile } from '@/hooks/use-mobile';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // Verificar expiración del trial
  useTrialExpiration();

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden animate-fade-in-up"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile (using bottom nav instead) */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 transform transition-all duration-300',
          'hidden lg:block lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          sidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-64'
        )}
      >
        <Sidebar 
          isCollapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
      </div>

      {/* Main Content */}
      <div 
        className={cn(
          'min-h-screen flex flex-col transition-all duration-300',
          sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64',
          // Add padding for bottom nav on mobile
          isMobile && 'has-bottom-nav'
        )}
      >
        {/* Header - Only show hamburger on tablet, hide on mobile */}
        <div className="hidden md:block">
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        </div>

        {/* Page Content */}
        <main className="flex-1">
          <div className="page-container animate-fade-in-up">
            <Outlet />
          </div>
        </main>

        {/* Footer - Hidden on mobile */}
        <footer className="hidden md:block py-4 px-6 border-t border-border text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Experiencia Selecta. Todos los derechos reservados.
        </footer>
      </div>

      {/* Bottom Navigation - Mobile only */}
      {isMobile && <BottomNav />}
      
      {/* PWA Install Banner - Mobile only */}
      <PWAInstallBanner />
    </div>
  );
}

export default AppLayout;
