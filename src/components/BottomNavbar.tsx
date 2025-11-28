import { NavLink } from '@/components/NavLink';
import { BarChart3, Palette, Target, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

const BottomNavbar = () => {
  const links = [
    { path: '/dashboard', icon: BarChart3, label: 'Dashboard' },
    { path: '/herramientas', icon: Palette, label: 'Herramientas' },
    { path: '/practicar', icon: Target, label: 'Practicar' },
    { path: '/calculadora', icon: Calculator, label: 'Calculadora' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="container max-w-4xl mx-auto px-2">
        <div className="flex items-center justify-around py-2">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-accent"
                activeClassName="text-primary bg-accent font-medium"
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs">{link.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavbar;
