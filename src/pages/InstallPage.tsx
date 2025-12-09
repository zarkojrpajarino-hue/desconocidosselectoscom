import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, Check, Wifi, Bell, Zap } from 'lucide-react';

export default function InstallPage() {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  const handleInstall = async () => {
    await promptInstall();
  };

  const features = [
    {
      icon: Zap,
      title: 'Acceso Rápido',
      description: 'Abre la app desde tu pantalla de inicio'
    },
    {
      icon: Wifi,
      title: 'Funciona Offline',
      description: 'Consulta datos incluso sin conexión'
    },
    {
      icon: Bell,
      title: 'Notificaciones',
      description: 'Recibe alertas de tareas y métricas'
    }
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-3 md:p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center p-4 md:p-6">
          <div className="w-14 h-14 md:w-20 md:h-20 mx-auto mb-3 md:mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Smartphone className="w-7 h-7 md:w-10 md:h-10 text-primary" />
          </div>
          <CardTitle className="text-xl md:text-2xl">Instalar App</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Instala la app para una mejor experiencia
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Features */}
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Install Button */}
          {isInstalled ? (
            <div className="flex items-center justify-center gap-2 py-4 text-primary">
              <Check className="w-5 h-5" />
              <span className="font-medium">App instalada</span>
            </div>
          ) : isInstallable ? (
            <Button onClick={handleInstall} className="w-full gap-2" size="lg">
              <Download className="w-5 h-5" />
              Instalar Ahora
            </Button>
          ) : (
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Para instalar la app manualmente:
              </p>
              <div className="text-xs text-muted-foreground bg-muted rounded-lg p-4 space-y-2">
                <p><strong>iOS:</strong> Pulsa el botón compartir → "Añadir a pantalla de inicio"</p>
                <p><strong>Android:</strong> Menú del navegador → "Instalar app" o "Añadir a inicio"</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
