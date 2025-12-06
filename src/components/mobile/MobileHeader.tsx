import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bell, Search, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import NotificationCenter from '@/components/NotificationCenter';

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  showBack?: boolean;
  actions?: React.ReactNode;
}

export function MobileHeader({
  title,
  subtitle,
  showSearch = false,
  showBack = false,
  actions,
}: MobileHeaderProps) {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [notificationCount] = useState(3);

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border pt-safe md:hidden">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left: Back/Avatar */}
        <div className="flex items-center gap-3">
          {showBack ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          ) : (
            <Avatar className="w-9 h-9">
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                {userProfile?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          )}
          
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold leading-none">{title}</h1>
            {subtitle && (
              <span className="text-xs text-muted-foreground mt-0.5">{subtitle}</span>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {showSearch && (
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <Search className="w-5 h-5" />
            </Button>
          )}
          
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 relative"
              >
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-4 min-w-4 p-0 flex items-center justify-center text-[10px]"
                  >
                    {notificationCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Notificaciones</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <NotificationCenter />
              </div>
            </SheetContent>
          </Sheet>

          {actions}
        </div>
      </div>
    </header>
  );
}
