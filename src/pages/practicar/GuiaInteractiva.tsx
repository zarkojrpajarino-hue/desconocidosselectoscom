import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { StartupGuideInteractive } from '@/components/guide/StartupGuideInteractive';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Loader2 } from 'lucide-react';

const GuiaInteractiva = () => {
  const { organizationId } = useCurrentOrganization();

  if (!organizationId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 space-y-4 md:space-y-6 pb-20 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl md:text-3xl font-bold flex items-center gap-2 md:gap-3">
            <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-primary flex-shrink-0" />
            <span className="truncate">Guía de Emprendimiento</span>
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            15 pasos para lanzar tu negocio validado
          </p>
        </div>
      </div>

      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">¿Cómo funciona?</CardTitle>
          <CardDescription>
            Sigue los pasos en orden. Cada paso desbloqueado te da puntos y acerca a tu próximo logro.
            Completa las categorías para desbloquear achievements especiales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center text-sm">
            <div className="p-3 rounded-lg bg-primary/10">
              <p className="font-semibold">Validación</p>
              <p className="text-xs text-muted-foreground">5 pasos</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10">
              <p className="font-semibold">Producto</p>
              <p className="text-xs text-muted-foreground">4 pasos</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10">
              <p className="font-semibold">Mercado</p>
              <p className="text-xs text-muted-foreground">3 pasos</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10">
              <p className="font-semibold">Crecimiento</p>
              <p className="text-xs text-muted-foreground">2 pasos</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10">
              <p className="font-semibold">Operaciones</p>
              <p className="text-xs text-muted-foreground">1 paso</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <StartupGuideInteractive organizationId={organizationId} />
    </div>
  );
};

export default GuiaInteractiva;
