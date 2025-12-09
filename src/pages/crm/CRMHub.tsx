import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, TrendingUp, Users, DollarSign, Target, Flame, BarChart3, AlertTriangle, Zap } from 'lucide-react';
import { useLeads } from '@/hooks/useLeads';
import { SectionTourButton } from '@/components/SectionTourButton';
import {
  DealVelocity,
  LeadScoringCard,
  PipelineForecast,
  LostReasonsAnalysis,
  AutomationEngine,
} from '@/components/enterprise';

const CRMHub = () => {
  const { user, userProfile, currentOrganizationId, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { leads, globalStats, loading } = useLeads(user?.id, currentOrganizationId);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando CRM...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background pb-20 md:pb-0">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-card">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg md:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent truncate">
                CRM Hub
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                Centro de inteligencia comercial
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-3 flex-shrink-0">
            <SectionTourButton sectionId="crm-hub" className="hidden md:flex" />
            <Button onClick={() => navigate('/crm')} size="sm" className="gap-1 md:gap-2 bg-gradient-primary">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Ver Leads</span>
            </Button>
            <Button onClick={() => navigate('/crm/pipeline')} variant="secondary" size="sm" className="gap-1 md:gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Pipeline</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/metrics')} className="gap-1 md:gap-2 hidden sm:flex">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-7xl space-y-4 md:space-y-6">
        {/* KPIs Globales */}
        {globalStats && (
          <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:pb-0">
            <Card className="min-w-[140px] flex-shrink-0 md:min-w-0 md:flex-shrink">
              <CardHeader className="pb-2 md:pb-3">
                <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl md:text-3xl font-bold">{globalStats.total_leads}</span>
                  <Users className="h-6 w-6 md:h-8 md:w-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="min-w-[140px] flex-shrink-0 md:min-w-0 md:flex-shrink">
              <CardHeader className="pb-2 md:pb-3">
                <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Pipeline Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl md:text-3xl font-bold">{globalStats.total_pipeline_value.toFixed(0)}€</span>
                  <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-emerald-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="min-w-[140px] flex-shrink-0 md:min-w-0 md:flex-shrink">
              <CardHeader className="pb-2 md:pb-3">
                <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Leads Calientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl md:text-3xl font-bold">{globalStats.hot_leads}</span>
                  <Flame className="h-6 w-6 md:h-8 md:w-8 text-rose-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="min-w-[140px] flex-shrink-0 md:min-w-0 md:flex-shrink">
              <CardHeader className="pb-2 md:pb-3">
                <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Ganados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl md:text-3xl font-bold">{globalStats.won_leads}</span>
                  <Target className="h-6 w-6 md:h-8 md:w-8 text-success opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs de módulos CRM */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex overflow-x-auto w-full md:grid md:grid-cols-5 h-auto gap-1">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden md:inline">Forecast</span>
            </TabsTrigger>
            <TabsTrigger value="scoring" className="gap-2">
              <Flame className="h-4 w-4" />
              <span className="hidden md:inline">Lead Scoring</span>
            </TabsTrigger>
            <TabsTrigger value="velocity" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden md:inline">Velocidad</span>
            </TabsTrigger>
            <TabsTrigger value="lost" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden md:inline">Perdidos</span>
            </TabsTrigger>
            <TabsTrigger value="automation" className="gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden md:inline">Tareas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <PipelineForecast />
          </TabsContent>

          <TabsContent value="scoring" className="mt-6">
            <LeadScoringCard />
          </TabsContent>

          <TabsContent value="velocity" className="mt-6">
            <DealVelocity />
          </TabsContent>

          <TabsContent value="lost" className="mt-6">
            <LostReasonsAnalysis />
          </TabsContent>

          <TabsContent value="automation" className="mt-6">
            <AutomationEngine />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CRMHub;
