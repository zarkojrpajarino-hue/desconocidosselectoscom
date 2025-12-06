import { useState, useEffect } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, X, Smartphone } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export function PWAInstallBanner() {
  const { isInstallable, promptInstall, isInstalled } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const isMobile = useIsMobile();

  // Check if user has previously dismissed
  useEffect(() => {
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      const dismissedTime = parseInt(wasDismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
      }
    }
  }, []);

  if (!isInstallable || dismissed || isInstalled || !isMobile) return null;

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (!accepted) {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  return (
    <Card className="fixed bottom-20 left-4 right-4 z-50 md:hidden border-primary/30 shadow-lg bg-card/95 backdrop-blur-sm">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-6 h-6 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">
              Instalar App
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Acceso rápido desde tu pantalla de inicio
            </p>
            
            <div className="flex gap-2">
              <Button
                onClick={handleInstall}
                size="sm"
                className="flex-1 gap-2"
              >
                <Download className="w-4 h-4" />
                Instalar
              </Button>
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="ghost"
              >
                Ahora no
              </Button>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 -mt-1 -mr-1"
            onClick={handleDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
