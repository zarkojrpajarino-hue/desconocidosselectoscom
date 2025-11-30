import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Target, History, Building2, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import OKRsDashboard from '@/components/OKRsDashboard';

const OKRsPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isOkrInfoOpen, setIsOkrInfoOpen] = useState(false);

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
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                OKRs Semanales Personalizados
              </h1>
              <p className="text-sm text-muted-foreground">
                Objetivos generados con IA basados en tus tareas de la semana
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => navigate('/okrs/organization')}
              className="gap-2"
            >
              <Building2 className="h-4 w-4" />
              OKRs Empresa
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/okrs/history')}
              className="gap-2"
            >
              <History className="h-4 w-4" />
              Historial de OKRs
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/metrics-hub')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a Métricas
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Explicación de OKRs Semanales */}
        <Collapsible
          open={isOkrInfoOpen}
          onOpenChange={setIsOkrInfoOpen}
          className="mb-6"
        >
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    🎯 ¿Qué son los OKRs Semanales Personalizados?
                  </CardTitle>
                  <ChevronDown 
                    className={`h-5 w-5 text-muted-foreground transition-transform ${
                      isOkrInfoOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="bg-gradient-to-br from-primary/10 via-background to-background border border-primary/20 rounded-xl p-6">
                  <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
                    <p>
                      <strong className="text-foreground">OKR = Objectives and Key Results</strong> (Objetivos y Resultados Clave). Son marcos de trabajo para establecer metas ambiciosas y medir el progreso hacia ellas.
                    </p>
                    <p>
                      <strong className="text-foreground">🎯 OKRs Semanales vs Empresa:</strong> Los OKRs semanales son <strong>personalizados y tácticos</strong>, generados automáticamente por IA basándose en tus tareas de la semana. Los OKRs de empresa son <strong>estratégicos y de largo plazo</strong>, definidos al inicio del trimestre.
                    </p>
                    <p>
                      <strong className="text-foreground">🤖 Generación con IA:</strong> Puedes generar hasta <strong>1 OKR por semana</strong> (plan free, máx 2 semanas). La IA analiza tus tareas pendientes y crea objetivos alcanzables con resultados clave medibles.
                    </p>
                    <p>
                      <strong className="text-foreground">📊 Cómo funcionan:</strong> Cada OKR tiene 1 Objetivo (qué quieres lograr) y 3-5 Key Results (cómo medirás el éxito). Los KRs tienen valores inicial, actual y objetivo. Actualiza el progreso semanalmente.
                    </p>
                    <p>
                      <strong className="text-foreground">💡 Diferencia con KPIs:</strong> Los KPIs miden lo que ya haces (operación actual). Los OKRs definen hacia dónde quieres ir (objetivos ambiciosos futuros). Se complementan.
                    </p>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <OKRsDashboard />
      </main>
    </div>
  );
};

export default OKRsPage;
