import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, TrendingUp, Users, DollarSign, Target, Flame, 
  BarChart3, AlertTriangle, Zap, Plus, Sparkles, ArrowUpRight,
  Clock, Phone, Mail, Calendar, CheckCircle2, Eye, ChevronRight,
  PieChart, Activity, RefreshCw
} from 'lucide-react';
import { useLeads } from '@/hooks/useLeads';
import { SectionTourButton } from '@/components/SectionTourButton';
import { formatCurrency } from '@/lib/currencyUtils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

// Demo data for empty states
const DEMO_PIPELINE_DATA = [
  { stage: 'Descubrimiento', value: 45000, count: 12, probability: 10 },
  { stage: 'Calificación', value: 78000, count: 8, probability: 25 },
  { stage: 'Propuesta', value: 125000, count: 5, probability: 50 },
  { stage: 'Negociación', value: 89000, count: 4, probability: 75 },
  { stage: 'Cierre', value: 45000, count: 2, probability: 90 },
];

const DEMO_VELOCITY_DATA = [
  { stage: 'Descubrimiento', days: 3, target: 3 },
  { stage: 'Calificación', days: 8, target: 7 },
  { stage: 'Propuesta', days: 12, target: 10 },
  { stage: 'Negociación', days: 18, target: 14 },
  { stage: 'Cierre', days: 5, target: 6 },
];

const DEMO_LOST_REASONS = [
  { name: 'Precio', value: 35, color: 'hsl(346, 87%, 43%)' },
  { name: 'Competencia', value: 25, color: 'hsl(25, 95%, 53%)' },
  { name: 'Timing', value: 20, color: 'hsl(48, 96%, 53%)' },
  { name: 'Sin respuesta', value: 15, color: 'hsl(262, 83%, 58%)' },
  { name: 'Otros', value: 5, color: 'hsl(221, 83%, 53%)' },
];

const DEMO_LEAD_SCORES = [
  { name: 'Tech Solutions', company: 'TechCorp', score: 92, status: 'hot' as const, probability: 85 },
  { name: 'Marketing Pro', company: 'MarketingCo', score: 78, status: 'warm' as const, probability: 65 },
  { name: 'Sales Force', company: 'SalesCorp', score: 65, status: 'warm' as const, probability: 50 },
  { name: 'Startup ABC', company: 'ABC Inc', score: 45, status: 'cold' as const, probability: 30 },
];

const DEMO_TASKS = [
  { type: 'call', title: 'Llamar a Tech Solutions', priority: 'high' as const, dueIn: 'Hoy' },
  { type: 'email', title: 'Enviar propuesta MarketingCo', priority: 'medium' as const, dueIn: 'Mañana' },
  { type: 'meeting', title: 'Demo con SalesCorp', priority: 'high' as const, dueIn: 'En 2 días' },
  { type: 'follow_up', title: 'Seguimiento ABC Inc', priority: 'low' as const, dueIn: 'Esta semana' },
];

const CRMHub = () => {
  const { user, userProfile, currentOrganizationId, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showDemoData, setShowDemoData] = useState(true);

  const { leads, globalStats, loading } = useLeads(user?.id, currentOrganizationId);
  const hasRealData = leads && leads.length > 0;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Cargando CRM Hub...</p>
        </div>
      </div>
    );
  }

  const stats = globalStats || {
    total_leads: 0,
    total_pipeline_value: 0,
    hot_leads: 0,
    won_leads: 0,
    lost_leads: 0,
    new_leads: 0,
    total_won_value: 0,
    avg_deal_size: 0,
  };

  const conversionRate = stats.total_leads > 0 
    ? ((stats.won_leads / stats.total_leads) * 100).toFixed(1) 
    : '0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background pb-20 md:pb-0">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-3 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg md:text-2xl font-bold text-foreground truncate">
                  CRM Hub
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                  Centro de inteligencia comercial
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              {!hasRealData && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="demo-toggle" className="text-xs text-muted-foreground hidden md:inline">
                    Datos demo
                  </Label>
                  <Switch
                    id="demo-toggle"
                    checked={showDemoData}
                    onCheckedChange={setShowDemoData}
                  />
                </div>
              )}
              <SectionTourButton sectionId="crm-hub" className="hidden md:flex" />
              <Button onClick={() => navigate('/crm')} size="sm" className="gap-2 bg-gradient-to-r from-primary to-primary/80">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Ver Leads</span>
              </Button>
              <Button onClick={() => navigate('/crm/pipeline')} variant="secondary" size="sm" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Pipeline</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/metrics')} className="gap-2 hidden sm:flex">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 md:px-6 py-4 md:py-8 max-w-7xl space-y-6">
        {/* Empty State Banner */}
        {!hasRealData && (
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-background to-primary/5">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">¡Empieza a vender!</h3>
                    <p className="text-sm text-muted-foreground">
                      {showDemoData 
                        ? 'Estás viendo datos de demostración. Crea tu primer lead para ver datos reales.' 
                        : 'Crea tu primer lead para activar el CRM Hub'}
                    </p>
                  </div>
                </div>
                <Button onClick={() => navigate('/crm')} className="gap-2 whitespace-nowrap">
                  <Plus className="h-4 w-4" />
                  Crear Primer Lead
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPIs Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="bg-gradient-to-br from-card to-muted/20 hover:shadow-lg transition-shadow overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs md:text-sm font-medium text-muted-foreground truncate">Total Leads</span>
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="text-xl md:text-2xl lg:text-3xl font-bold truncate">
                {hasRealData ? stats.total_leads : (showDemoData ? 31 : 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                +{hasRealData ? stats.new_leads : (showDemoData ? 8 : 0)} este mes
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-success/5 hover:shadow-lg transition-shadow overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs md:text-sm font-medium text-muted-foreground truncate">Pipeline</span>
                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-4 w-4 text-success" />
                </div>
              </div>
              <p className="text-xl md:text-2xl lg:text-3xl font-bold text-success truncate">
                {formatCurrency(hasRealData ? stats.total_pipeline_value : (showDemoData ? 382000 : 0))}
              </p>
              <p className="text-xs text-muted-foreground mt-1 truncate">Valor total activo</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-rose-500/5 hover:shadow-lg transition-shadow overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs md:text-sm font-medium text-muted-foreground truncate">Leads Calientes</span>
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                  <Flame className="h-4 w-4 text-rose-500" />
                </div>
              </div>
              <p className="text-xl md:text-2xl lg:text-3xl font-bold text-rose-600 truncate">
                {hasRealData ? stats.hot_leads : (showDemoData ? 6 : 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1 truncate">Alta probabilidad</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-emerald-500/5 hover:shadow-lg transition-shadow overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs md:text-sm font-medium text-muted-foreground truncate">Conversión</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Target className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
              <p className="text-xl md:text-2xl lg:text-3xl font-bold text-emerald-600 truncate">
                {hasRealData ? conversionRate : (showDemoData ? '18.5' : '0')}%
              </p>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {hasRealData ? stats.won_leads : (showDemoData ? 5 : 0)} ganados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full flex overflow-x-auto md:grid md:grid-cols-5 h-auto gap-1 p-1 bg-muted/50">
            <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-background">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden md:inline">Forecast</span>
            </TabsTrigger>
            <TabsTrigger value="scoring" className="gap-2 data-[state=active]:bg-background">
              <Flame className="h-4 w-4" />
              <span className="hidden md:inline">Lead Scoring</span>
            </TabsTrigger>
            <TabsTrigger value="velocity" className="gap-2 data-[state=active]:bg-background">
              <Activity className="h-4 w-4" />
              <span className="hidden md:inline">Velocidad</span>
            </TabsTrigger>
            <TabsTrigger value="lost" className="gap-2 data-[state=active]:bg-background">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden md:inline">Perdidos</span>
            </TabsTrigger>
            <TabsTrigger value="automation" className="gap-2 data-[state=active]:bg-background">
              <Zap className="h-4 w-4" />
              <span className="hidden md:inline">Tareas</span>
            </TabsTrigger>
          </TabsList>

          {/* Forecast Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-bold">Pipeline Forecast</h2>
                <p className="text-sm text-muted-foreground">Proyección de ingresos por etapa</p>
              </div>
              {!hasRealData && showDemoData && (
                <Badge variant="secondary" className="gap-1">
                  <Eye className="h-3 w-3" />
                  Demo
                </Badge>
              )}
            </div>

            {(hasRealData || showDemoData) ? (
              <>
                {/* Scenarios */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-amber-500/30 bg-amber-500/5">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-amber-600 border-amber-500">Conservador</Badge>
                      </div>
                      <p className="text-2xl md:text-3xl font-bold text-amber-600">
                        {formatCurrency(showDemoData ? 189000 : stats.total_pipeline_value * 0.5)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">70% probabilidad</p>
                    </CardContent>
                  </Card>
                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge>Realista</Badge>
                      </div>
                      <p className="text-2xl md:text-3xl font-bold text-primary">
                        {formatCurrency(showDemoData ? 267000 : stats.total_pipeline_value * 0.7)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">50% probabilidad</p>
                    </CardContent>
                  </Card>
                  <Card className="border-emerald-500/30 bg-emerald-500/5">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-emerald-600 border-emerald-500">Optimista</Badge>
                      </div>
                      <p className="text-2xl md:text-3xl font-bold text-emerald-600">
                        {formatCurrency(showDemoData ? 382000 : stats.total_pipeline_value)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">30% probabilidad</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Pipeline Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Valor por Etapa
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={DEMO_PIPELINE_DATA} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis type="number" tickFormatter={(v) => `€${(v/1000).toFixed(0)}k`} />
                          <YAxis dataKey="stage" type="category" width={100} className="text-xs" />
                          <Tooltip 
                            formatter={(value: number) => [formatCurrency(value), 'Valor']}
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                          />
                          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Stage Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  {DEMO_PIPELINE_DATA.map((stage, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{stage.stage}</span>
                          <Badge variant="outline" className="text-xs">{stage.count} deals</Badge>
                        </div>
                        <p className="text-lg font-bold">{formatCurrency(stage.value)}</p>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Probabilidad</span>
                            <span>{stage.probability}%</span>
                          </div>
                          <Progress value={stage.probability} className="h-1.5" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <EmptyStateCard
                icon={BarChart3}
                title="Sin datos de pipeline"
                description="Crea leads y asígnalos a etapas para ver proyecciones de ingresos"
                actionLabel="Crear Lead"
                onAction={() => navigate('/crm')}
              />
            )}
          </TabsContent>

          {/* Lead Scoring Tab */}
          <TabsContent value="scoring" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-bold">Lead Scoring</h2>
                <p className="text-sm text-muted-foreground">Puntuación inteligente de leads</p>
              </div>
              <div className="flex gap-3 text-center">
                <div>
                  <p className="text-xl font-bold text-rose-600">{showDemoData ? 2 : 0}</p>
                  <p className="text-xs text-muted-foreground">Calientes</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-amber-600">{showDemoData ? 2 : 0}</p>
                  <p className="text-xs text-muted-foreground">Tibios</p>
                </div>
              </div>
            </div>

            {(hasRealData || showDemoData) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DEMO_LEAD_SCORES.map((lead, index) => (
                  <Card key={index} className={`
                    ${lead.status === 'hot' ? 'border-rose-500/30 bg-rose-500/5' : ''}
                    ${lead.status === 'warm' ? 'border-amber-500/30 bg-amber-500/5' : ''}
                    ${lead.status === 'cold' ? 'border-blue-500/30 bg-blue-500/5' : ''}
                    hover:shadow-md transition-all
                  `}>
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-semibold">{lead.name}</h4>
                          <p className="text-sm text-muted-foreground">{lead.company}</p>
                        </div>
                        <Badge variant={lead.status === 'hot' ? 'destructive' : lead.status === 'warm' ? 'secondary' : 'outline'}>
                          <Flame className="h-3 w-3 mr-1" />
                          {lead.status === 'hot' ? 'Caliente' : lead.status === 'warm' ? 'Tibio' : 'Frío'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-4xl font-bold ${
                          lead.status === 'hot' ? 'text-rose-600' : 
                          lead.status === 'warm' ? 'text-amber-600' : 'text-blue-600'
                        }`}>
                          {lead.score}
                        </span>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Prob. cierre</p>
                          <p className="text-lg font-semibold">{lead.probability}%</p>
                        </div>
                      </div>
                      <Progress value={lead.score} className="h-2" />
                      <div className="mt-4 p-2 rounded-md bg-background/50 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        <span className="text-sm">
                          {lead.status === 'hot' ? 'Llamar HOY' : lead.status === 'warm' ? 'Enviar follow-up' : 'Nutrir con contenido'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyStateCard
                icon={Flame}
                title="Sin puntuaciones calculadas"
                description="El scoring se calcula automáticamente cuando tienes leads activos"
                actionLabel="Añadir Lead"
                onAction={() => navigate('/crm')}
              />
            )}
          </TabsContent>

          {/* Velocity Tab */}
          <TabsContent value="velocity" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-bold">Velocidad de Deals</h2>
                <p className="text-sm text-muted-foreground">Tiempo promedio por etapa</p>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Actualizar
              </Button>
            </div>

            {(hasRealData || showDemoData) ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Ciclo Total</span>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-3xl font-bold">{showDemoData ? 46 : 0} días</p>
                      <p className="text-xs text-muted-foreground mt-1">Target: 40 días</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Variación</span>
                        <TrendingUp className="h-4 w-4 text-rose-500" />
                      </div>
                      <p className="text-3xl font-bold text-rose-600">+6 días</p>
                      <Badge variant="destructive" className="mt-2">Sobre objetivo</Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Alertas</span>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline" className="text-amber-600">1 cuello botella</Badge>
                        <Badge variant="outline" className="text-rose-600">2 estancados</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Días Promedio por Etapa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={DEMO_VELOCITY_DATA} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis type="number" unit=" días" />
                          <YAxis dataKey="stage" type="category" width={100} className="text-xs" />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                          <Bar dataKey="target" fill="hsl(var(--muted))" name="Target" radius={[0, 4, 4, 0]} />
                          <Bar dataKey="days" fill="hsl(var(--primary))" name="Actual" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <EmptyStateCard
                icon={Activity}
                title="Sin datos de velocidad"
                description="Necesitas deals moviéndose entre etapas para medir velocidad"
                actionLabel="Ver Pipeline"
                onAction={() => navigate('/crm/pipeline')}
              />
            )}
          </TabsContent>

          {/* Lost Reasons Tab */}
          <TabsContent value="lost" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-bold">Análisis de Deals Perdidos</h2>
                <p className="text-sm text-muted-foreground">Últimos 90 días</p>
              </div>
              {showDemoData && <Badge variant="destructive">Principal: Precio</Badge>}
            </div>

            {(hasRealData || showDemoData) ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Total Perdidos</span>
                        <TrendingUp className="h-4 w-4 text-rose-500 rotate-180" />
                      </div>
                      <p className="text-3xl font-bold text-rose-600">{showDemoData ? 12 : 0}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Valor Perdido</span>
                        <DollarSign className="h-4 w-4 text-rose-500" />
                      </div>
                      <p className="text-3xl font-bold text-rose-600">{formatCurrency(showDemoData ? 145000 : 0)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Razón Principal</span>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      </div>
                      <p className="text-xl font-bold">{showDemoData ? 'Precio' : '-'}</p>
                      <p className="text-sm text-muted-foreground">{showDemoData ? '35% de los casos' : ''}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Distribución por Razón</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={DEMO_LOST_REASONS}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {DEMO_LOST_REASONS.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Detalle por Razón</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {DEMO_LOST_REASONS.map((reason, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: reason.color }} />
                              <span className="font-medium">{reason.name}</span>
                            </div>
                            <span className="text-sm font-semibold">{reason.value}%</span>
                          </div>
                          <Progress value={reason.value} className="h-2" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <EmptyStateCard
                icon={PieChart}
                title="Sin deals perdidos registrados"
                description="Cuando pierdas deals, analiza las razones para mejorar"
                actionLabel="Ver Leads"
                onAction={() => navigate('/crm')}
              />
            )}
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                  <Zap className="h-6 w-6 text-primary" />
                  Inbox de Acciones
                </h2>
                <p className="text-sm text-muted-foreground">Tareas automatizadas basadas en tu pipeline</p>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Actualizar
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pendientes</p>
                      <p className="text-3xl font-bold">{showDemoData ? 4 : 0}</p>
                    </div>
                    <Clock className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card className={showDemoData ? 'border-rose-500/30' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Alta Prioridad</p>
                      <p className="text-3xl font-bold text-rose-600">{showDemoData ? 2 : 0}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-rose-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className={showDemoData ? 'border-amber-500/30' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Para Hoy</p>
                      <p className="text-3xl font-bold text-amber-600">{showDemoData ? 2 : 0}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-amber-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {(hasRealData || showDemoData) ? (
              <div className="space-y-3">
                {DEMO_TASKS.map((task, index) => {
                  const TaskIcon = task.type === 'call' ? Phone : task.type === 'email' ? Mail : task.type === 'meeting' ? Calendar : ArrowUpRight;
                  return (
                    <Card key={index} className={`
                      ${task.priority === 'high' ? 'border-rose-500/30 bg-rose-500/5' : ''}
                      ${task.priority === 'medium' ? 'border-amber-500/30 bg-amber-500/5' : ''}
                      hover:shadow-md transition-all
                    `}>
                      <CardContent className="py-4 px-4 md:px-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            task.priority === 'high' ? 'bg-rose-500/20' : 
                            task.priority === 'medium' ? 'bg-amber-500/20' : 'bg-muted'
                          }`}>
                            <TaskIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{task.title}</span>
                              <Badge variant={
                                task.priority === 'high' ? 'destructive' : 
                                task.priority === 'medium' ? 'secondary' : 'outline'
                              }>
                                {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{task.dueIn}</p>
                          </div>
                          <Button variant="outline" size="sm">
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <EmptyStateCard
                icon={CheckCircle2}
                title="¡Todo al día!"
                description="No tienes tareas pendientes. Las tareas se generan automáticamente basadas en tu actividad de CRM."
                actionLabel="Ver CRM"
                onAction={() => navigate('/crm')}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

// Empty State Component
interface EmptyStateCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

function EmptyStateCard({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateCardProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
        <Button onClick={onAction} className="gap-2">
          <Plus className="h-4 w-4" />
          {actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

export default CRMHub;
