import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, TrendingUp, Info, ChevronDown, Eye } from 'lucide-react';
import PipelineBoard from '@/components/crm/PipelineBoard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SectionTourButton } from '@/components/guide/SectionTourButton';

const Pipeline = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isPipelineInfoOpen, setIsPipelineInfoOpen] = useState(false);
  const [isHowToUseOpen, setIsHowToUseOpen] = useState(false);
  const [showDemoData, setShowDemoData] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background pb-20 md:pb-0">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg md:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent truncate">
                Pipeline de Ventas
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                Visualiza y gestiona el embudo de conversión
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-2 mr-2 bg-muted/50 rounded-lg px-3 py-1.5">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="demo-toggle" className="text-xs text-muted-foreground cursor-pointer">
                Demo
              </Label>
              <Switch
                id="demo-toggle"
                checked={showDemoData}
                onCheckedChange={setShowDemoData}
              />
            </div>
            <SectionTourButton sectionId="crm-pipeline" className="hidden sm:flex" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/crm')}
              className="gap-1 md:gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Volver a CRM</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-2 md:px-4 py-4 md:py-8 max-w-[1800px] overflow-x-auto">
        {/* ¿Qué es Pipeline? + Tarjetas explicativas */}
        <Collapsible
          open={isPipelineInfoOpen}
          onOpenChange={setIsPipelineInfoOpen}
          className="mb-6"
        >
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    ¿Qué es el Pipeline de Ventas?
                  </CardTitle>
                  <ChevronDown 
                    className={`h-5 w-5 text-muted-foreground transition-transform ${
                      isPipelineInfoOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-0">
                <Alert className="border-primary/20 bg-primary/5">
                  <AlertDescription className="space-y-2 text-sm">
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Cómo usar el Pipeline */}
        <Collapsible
          open={isHowToUseOpen}
          onOpenChange={setIsHowToUseOpen}
          className="mb-6"
        >
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">💡 Cómo usar este Pipeline</CardTitle>
                  <ChevronDown 
                    className={`h-5 w-5 text-muted-foreground transition-transform ${
                      isHowToUseOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-0">
                <div className="space-y-2 text-sm">
                  <p>✅ <strong>Arrastra</strong> las tarjetas entre columnas para mover leads de una etapa a otra</p>
                  <p>✅ <strong>Haz clic</strong> en una tarjeta para ver detalles completos y editar información</p>
                  <p>✅ <strong>Prioriza</strong> leads con alta prioridad (rojo) y alto valor estimado</p>
                  <p>✅ <strong>Revisa</strong> las métricas del encabezado para ver el estado general de tu pipeline</p>
                  <p>✅ <strong>Actualiza</strong> regularmente para mantener tu pipeline limpio y realista</p>
                </div>

                <Alert className="border-info/30 bg-info/5">
                  <AlertTitle className="flex items-center gap-2 text-sm">
                    🔗 Relación CRM ↔ Pipeline
                  </AlertTitle>
                  <AlertDescription className="text-sm space-y-2">
                    <p>
                      <strong>CRM y Pipeline comparten los mismos leads</strong> - son dos vistas del mismo dato.
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                      <li>Los leads que creas en CRM aparecen <strong>automáticamente</strong> en el Pipeline</li>
                      <li>Al mover un lead aquí, se actualiza su etapa en todo el sistema</li>
                      <li>Mover a "Ganado" o "Perdido" actualiza automáticamente el estado del lead</li>
                      <li>Los KPIs de marketing también pueden generar leads automáticamente</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Pipeline Board */}
        <PipelineBoard showDemoData={showDemoData} />
      </main>
    </div>
  );
};

export default Pipeline;
