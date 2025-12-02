import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Target, History, Building2, ChevronDown, Calendar, CheckSquare, Link2, RotateCcw } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import OKRsDashboard from '@/components/OKRsDashboard';
import { LoadingSpinner } from '@/components/ui/loading-skeleton';
import { SectionTourButton } from '@/components/SectionTourButton';
import {
  OKRQuarterlyView,
  OKRCheckInForm,
  OKRDependencyMap,
  OKRRetrospective,
} from '@/components/enterprise';

const OKRsPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isOkrInfoOpen, setIsOkrInfoOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('weekly');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <LoadingSpinner size="lg" />
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
                Gestión de OKRs
              </h1>
              <p className="text-sm text-muted-foreground">
                Objetivos y Resultados Clave
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SectionTourButton sectionId="okrs" />
            <Button variant="secondary" onClick={() => navigate('/okrs/organization')} className="gap-2">
              <Building2 className="h-4 w-4" />
              OKRs Empresa
            </Button>
            <Button variant="secondary" onClick={() => navigate('/okrs/history')} className="gap-2">
              <History className="h-4 w-4" />
              Historial
            </Button>
            <Button variant="outline" onClick={() => navigate('/metrics-hub')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Explicación */}
        <Collapsible open={isOkrInfoOpen} onOpenChange={setIsOkrInfoOpen} className="mb-6">
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    🎯 ¿Qué son los OKRs?
                  </CardTitle>
                  <ChevronDown className={`h-5 w-5 transition-transform ${isOkrInfoOpen ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="bg-gradient-to-br from-primary/10 via-background to-background border border-primary/20 rounded-xl p-6 text-sm text-muted-foreground space-y-2">
                  <p><strong className="text-foreground">OKR = Objectives and Key Results</strong> - Marcos para metas ambiciosas y medición de progreso.</p>
                  <p><strong className="text-foreground">🎯 Semanales vs Empresa:</strong> Los semanales son tácticos, los de empresa estratégicos.</p>
                  <p><strong className="text-foreground">📊 Estructura:</strong> 1 Objetivo + 3-5 Key Results medibles.</p>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto mb-6">
            <TabsTrigger value="weekly" className="gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden md:inline">Semanales</span>
            </TabsTrigger>
            <TabsTrigger value="quarterly" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden md:inline">Trimestral</span>
            </TabsTrigger>
            <TabsTrigger value="checkin" className="gap-2">
              <CheckSquare className="h-4 w-4" />
              <span className="hidden md:inline">Check-in</span>
            </TabsTrigger>
            <TabsTrigger value="dependencies" className="gap-2">
              <Link2 className="h-4 w-4" />
              <span className="hidden md:inline">Dependencias</span>
            </TabsTrigger>
            <TabsTrigger value="retro" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              <span className="hidden md:inline">Retrospectiva</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="weekly">
            <OKRsDashboard />
          </TabsContent>

          <TabsContent value="quarterly">
            <OKRQuarterlyView />
          </TabsContent>

          <TabsContent value="checkin">
            <OKRCheckInForm />
          </TabsContent>

          <TabsContent value="dependencies">
            <OKRDependencyMap />
          </TabsContent>

          <TabsContent value="retro">
            <OKRRetrospective />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default OKRsPage;
