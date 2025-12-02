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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                CRM Hub
              </h1>
              <p className="text-sm text-muted-foreground">
                Centro de inteligencia comercial
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SectionTourButton sectionId="crm-hub" />
            <Button onClick={() => navigate('/crm')} className="gap-2 bg-gradient-primary">
              <Users className="h-4 w-4" />
              Ver Leads
            </Button>
            <Button onClick={() => navigate('/crm/pipeline')} variant="secondary" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Pipeline
            </Button>
            <Button variant="outline" onClick={() => navigate('/metrics')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
        {/* KPIs Globales */}
        {globalStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">{globalStats.total_leads}</span>
                  <Users className="h-8 w-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pipeline Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">{globalStats.total_pipeline_value.toFixed(0)}€</span>
                  <DollarSign className="h-8 w-8 text-emerald-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Leads Calientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">{globalStats.hot_leads}</span>
                  <Flame className="h-8 w-8 text-rose-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ganados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">{globalStats.won_leads}</span>
                  <Target className="h-8 w-8 text-success opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs de módulos CRM */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
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
