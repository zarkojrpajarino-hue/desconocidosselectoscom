import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Loader2, BarChart3, Users, Zap, Target } from 'lucide-react';
import { toast } from 'sonner';

const ScalabilityStart = () => {
  const navigate = useNavigate();
  const { currentOrganizationId } = useAuth();
  const [loading, setLoading] = useState(false);

  const startAnalysis = async () => {
    if (!currentOrganizationId) {
      toast.error('No se encontró la organización');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-scalability', {
        body: { organizationId: currentOrganizationId }
      });

      if (error) throw error;

      toast.success('Análisis completado');
      navigate(`/scalability/${data.analysis_id}`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al generar análisis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-3 md:p-6 max-w-4xl pb-24 md:pb-6">
      <div className="text-center mb-4 md:mb-8">
        <TrendingUp className="w-10 h-10 md:w-16 md:h-16 text-primary mx-auto mb-2 md:mb-4" />
        <h1 className="text-xl md:text-3xl font-bold mb-1 md:mb-2">Análisis de Escalabilidad</h1>
        <p className="text-xs md:text-base text-muted-foreground max-w-2xl mx-auto">
          Descubre cuellos de botella y oportunidades de automatización.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
        <Card>
          <CardHeader className="pb-3">
            <BarChart3 className="w-8 h-8 text-primary mb-2" />
            <CardTitle className="text-lg">Scores de Escalabilidad</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Análisis de tu preparación para escalar en 4 dimensiones: Equipo, Procesos, Producto y Finanzas.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <Target className="w-8 h-8 text-primary mb-2" />
            <CardTitle className="text-lg">Cuellos de Botella</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Identificación de los principales obstáculos que impiden el crecimiento con recomendaciones priorizadas.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <Users className="w-8 h-8 text-primary mb-2" />
            <CardTitle className="text-lg">Dependencias Críticas</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Detecta personas indispensables y procesos que dependen de un solo individuo (puntos únicos de fallo).
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <Zap className="w-8 h-8 text-primary mb-2" />
            <CardTitle className="text-lg">Automatización</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Oportunidades concretas de automatización con ROI estimado, herramientas y pasos de implementación.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button 
          size="lg" 
          onClick={startAnalysis} 
          disabled={loading}
          className="px-8"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Analizando...
            </>
          ) : (
            <>
              <TrendingUp className="w-5 h-5 mr-2" />
              Iniciar Análisis
            </>
          )}
        </Button>
        <p className="text-sm text-muted-foreground mt-3">
          El análisis toma aproximadamente 30 segundos
        </p>
      </div>
    </div>
  );
};

export default ScalabilityStart;
