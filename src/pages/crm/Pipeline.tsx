import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Info } from 'lucide-react';
import PipelineBoard from '@/components/PipelineBoard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Pipeline = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">
                Pipeline de Ventas
              </h1>
              <p className="text-sm text-muted-foreground">
                Visualiza y gestiona el embudo completo de conversión
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/crm')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-[1800px]">
        {/* Explicación del Pipeline */}
        <Alert className="mb-6 border-primary/20 bg-primary/5">
          <Info className="h-4 w-4" />
          <AlertTitle className="font-semibold">¿Qué es el Pipeline de Ventas?</AlertTitle>
          <AlertDescription className="mt-2 space-y-2 text-sm">
            <p>
              El <strong>Pipeline de Ventas</strong> es tu embudo de conversión visualizado en etapas. Cada columna representa una fase del proceso comercial, desde que un contacto entra como "Lead" hasta que se convierte en cliente ("Won") o se pierde ("Lost").
            </p>
            <p className="font-medium mt-2">Las 5 etapas del pipeline:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Lead:</strong> Contacto inicial sin calificar. Aún no sabes si es un cliente potencial real.</li>
              <li><strong>Qualified:</strong> Lead calificado. Has validado que tiene necesidad, presupuesto y autoridad de compra.</li>
              <li><strong>Proposal:</strong> Has enviado una propuesta comercial o cotización formal.</li>
              <li><strong>Negotiation:</strong> Están negociando términos, precios, plazos o condiciones.</li>
              <li><strong>Won/Lost:</strong> Ganado (cliente nuevo) o Perdido (oportunidad cerrada sin éxito).</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Tarjetas explicativas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📊 Valor Estimado</CardTitle>
              <CardDescription>
                Cada lead tiene un valor potencial que suma al total del pipeline
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              El <strong>valor del pipeline</strong> es la suma de todos los deals en proceso. Te ayuda a proyectar ingresos futuros.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🎯 Probabilidad</CardTitle>
              <CardDescription>
                Cada etapa tiene una probabilidad de cierre diferente
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Los leads en <strong>Negotiation</strong> tienen mayor probabilidad de cerrar que los que están en <strong>Lead</strong>.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">⚡ Velocidad</CardTitle>
              <CardDescription>
                Mide cuánto tardan los leads en avanzar entre etapas
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Si los leads se estancan en una etapa, puede indicar un <strong>cuello de botella</strong> en tu proceso.
            </CardContent>
          </Card>
        </div>

        {/* Cómo usar el Pipeline */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>💡 Cómo usar este Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>✅ <strong>Arrastra</strong> las tarjetas entre columnas para mover leads de una etapa a otra</p>
            <p>✅ <strong>Haz clic</strong> en una tarjeta para ver detalles completos y editar información</p>
            <p>✅ <strong>Prioriza</strong> leads con alta prioridad (rojo) y alto valor estimado</p>
            <p>✅ <strong>Revisa</strong> las métricas del encabezado para ver el estado general de tu pipeline</p>
            <p>✅ <strong>Actualiza</strong> regularmente para mantener tu pipeline limpio y realista</p>
          </CardContent>
        </Card>

        {/* Pipeline Board */}
        <PipelineBoard />
      </main>
    </div>
  );
};

export default Pipeline;
