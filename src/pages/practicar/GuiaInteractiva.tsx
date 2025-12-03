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
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            Guía de Emprendimiento
          </h1>
          <p className="text-muted-foreground mt-1">
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
