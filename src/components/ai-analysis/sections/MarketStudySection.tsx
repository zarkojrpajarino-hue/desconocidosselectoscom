// ============================================
// MARKET STUDY SECTION - NEW COMPONENT
// Country-based analysis, competitors, market opportunities
// ============================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Globe,
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Shield,
  MapPin,
  Building2,
  ShoppingCart,
  Smartphone,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ExternalLink,
  Star,
  Lightbulb,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

interface MarketStudyData {
  country_data?: {
    country_name: string;
    country_code: string;
    currency: string;
    vat_rate: number;
    corporate_tax_rate: number;
    population: number;
    gdp_per_capita: number;
    internet_penetration: number;
    ecommerce_penetration: number;
    median_age: number;
    unemployment_rate: number;
    top_social_platforms: string[];
    top_ecommerce_platforms: string[];
    data_privacy_law: string;
  };
  market_analysis?: {
    market_size: string;
    market_growth_rate: string;
    competition_level: string;
    entry_barriers: string[];
    key_trends: string[];
    opportunities: string[];
    threats: string[];
  };
  competitive_analysis?: {
    positioning: string;
    threats: string[];
    opportunities: string[];
    differentiation: string[];
  };
  competitors?: Array<{
    name: string;
    description?: string;
    strengths?: string[];
    weaknesses?: string[];
    market_position?: string;
  }>;
}

interface MarketStudySectionProps {
  data: MarketStudyData;
}

export function MarketStudySection({ data }: MarketStudySectionProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const countryData = data.country_data;
  const marketAnalysis = data.market_analysis;
  const competitiveAnalysis = data.competitive_analysis;
  const competitors = data.competitors || [];

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (value: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Market metrics radar data
  const marketRadarData = [
    { subject: 'Internet', value: countryData?.internet_penetration || 0, fullMark: 100 },
    { subject: 'E-commerce', value: countryData?.ecommerce_penetration || 0, fullMark: 100 },
    { subject: 'PIB/capita', value: Math.min(100, ((countryData?.gdp_per_capita || 0) / 60000) * 100), fullMark: 100 },
    { subject: 'Empleo', value: 100 - (countryData?.unemployment_rate || 0), fullMark: 100 },
    { subject: 'Edad Media', value: Math.min(100, ((countryData?.median_age || 0) / 50) * 100), fullMark: 100 },
  ];

  // Competition strength comparison
  const competitorStrengthData = competitors.slice(0, 5).map((comp, idx) => ({
    name: comp.name.length > 15 ? comp.name.slice(0, 15) + '...' : comp.name,
    strengths: (comp.strengths || []).length * 20,
    weaknesses: (comp.weaknesses || []).length * 15,
  }));

  // Market opportunity pie
  const opportunityPieData = [
    { name: 'Oportunidades', value: (marketAnalysis?.opportunities || []).length, fill: 'hsl(var(--success))' },
    { name: 'Amenazas', value: (marketAnalysis?.threats || []).length, fill: 'hsl(var(--destructive))' },
    { name: 'Tendencias', value: (marketAnalysis?.key_trends || []).length, fill: 'hsl(var(--primary))' },
  ];

  if (!countryData && !marketAnalysis && competitors.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Globe className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">Estudio de Mercado No Disponible</h3>
        <p className="text-muted-foreground mb-4">
          Para generar un estudio de mercado completo, configura tu país de operación en el perfil y añade competidores.
        </p>
        <Button variant="outline">
          <MapPin className="w-4 h-4 mr-2" />
          Configurar País
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-teal-500/10 via-background to-background border-2 border-teal-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl flex items-center gap-3">
                  Estudio de Mercado
                  {countryData && (
                    <Badge variant="outline" className="gap-1">
                      <MapPin className="w-3 h-3" />
                      {countryData.country_name}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-base">
                  Análisis detallado de tu mercado objetivo y competencia
                </CardDescription>
              </div>
            </div>
            {countryData && (
              <div className="text-right hidden md:block">
                <div className="text-4xl font-bold text-teal-500">{countryData.currency}</div>
                <div className="text-sm text-muted-foreground">Moneda local</div>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden md:inline">Panorama</span>
          </TabsTrigger>
          <TabsTrigger value="country" className="gap-2">
            <MapPin className="w-4 h-4" />
            <span className="hidden md:inline">País</span>
          </TabsTrigger>
          <TabsTrigger value="competitors" className="gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden md:inline">Competencia</span>
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="gap-2">
            <Lightbulb className="w-4 h-4" />
            <span className="hidden md:inline">Oportunidades</span>
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {countryData && (
              <>
                <StatCard
                  icon={<Users className="w-5 h-5" />}
                  label="Población"
                  value={formatNumber(countryData.population)}
                  color="primary"
                />
                <StatCard
                  icon={<DollarSign className="w-5 h-5" />}
                  label="PIB per cápita"
                  value={formatCurrency(countryData.gdp_per_capita, countryData.currency)}
                  color="success"
                />
                <StatCard
                  icon={<ShoppingCart className="w-5 h-5" />}
                  label="E-commerce"
                  value={`${countryData.ecommerce_penetration}%`}
                  color="info"
                />
                <StatCard
                  icon={<Building2 className="w-5 h-5" />}
                  label="Competidores"
                  value={competitors.length.toString()}
                  color="warning"
                />
              </>
            )}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Market Metrics Radar */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Radar del Mercado</CardTitle>
                <CardDescription>Indicadores clave del mercado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={marketRadarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" className="text-xs" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar
                        name="Tu mercado"
                        dataKey="value"
                        stroke="hsl(var(--success))"
                        fill="hsl(var(--success))"
                        fillOpacity={0.5}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Opportunities vs Threats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Balance de Oportunidades</CardTitle>
                <CardDescription>Oportunidades vs Amenazas identificadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={opportunityPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {opportunityPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Market Summary */}
          {marketAnalysis && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Resumen del Mercado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Tamaño del Mercado</p>
                    <p className="text-xl font-bold">{marketAnalysis.market_size || 'Por determinar'}</p>
                  </div>
                  <div className="p-4 bg-success/5 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Tasa de Crecimiento</p>
                    <p className="text-xl font-bold text-success">{marketAnalysis.market_growth_rate || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-warning/5 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Nivel de Competencia</p>
                    <p className="text-xl font-bold text-warning">{marketAnalysis.competition_level || 'Medio'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* COUNTRY TAB */}
        <TabsContent value="country" className="space-y-6">
          {countryData ? (
            <>
              {/* Country Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Demographics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Demografía
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <DataRow label="Población" value={formatNumber(countryData.population)} />
                    <DataRow label="Edad Media" value={`${countryData.median_age} años`} />
                    <DataRow label="Tasa de Desempleo" value={`${countryData.unemployment_rate}%`} />
                    <DataRow label="PIB per cápita" value={formatCurrency(countryData.gdp_per_capita, countryData.currency)} />
                  </CardContent>
                </Card>

                {/* Digital Economy */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-primary" />
                      Economía Digital
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Penetración Internet</span>
                        <span className="font-bold">{countryData.internet_penetration}%</span>
                      </div>
                      <Progress value={countryData.internet_penetration} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Penetración E-commerce</span>
                        <span className="font-bold">{countryData.ecommerce_penetration}%</span>
                      </div>
                      <Progress value={countryData.ecommerce_penetration} className="h-2" />
                    </div>
                    <DataRow label="Ley de Privacidad" value={countryData.data_privacy_law || 'N/A'} />
                  </CardContent>
                </Card>

                {/* Tax & Legal */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-primary" />
                      Fiscal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <DataRow label="IVA" value={`${countryData.vat_rate}%`} />
                    <DataRow label="Impuesto Corporativo" value={`${countryData.corporate_tax_rate}%`} />
                    <DataRow label="Moneda" value={countryData.currency} />
                  </CardContent>
                </Card>

                {/* Platforms */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Globe className="w-5 h-5 text-primary" />
                      Plataformas Populares
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {countryData.top_social_platforms && countryData.top_social_platforms.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Redes Sociales:</p>
                        <div className="flex flex-wrap gap-2">
                          {countryData.top_social_platforms.map((platform, idx) => (
                            <Badge key={idx} variant="outline">{platform}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {countryData.top_ecommerce_platforms && countryData.top_ecommerce_platforms.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">E-commerce:</p>
                        <div className="flex flex-wrap gap-2">
                          {countryData.top_ecommerce_platforms.map((platform, idx) => (
                            <Badge key={idx} variant="secondary">{platform}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card className="p-8 text-center">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Configura tu país de operación para ver datos demográficos y de mercado.
              </p>
            </Card>
          )}
        </TabsContent>

        {/* COMPETITORS TAB */}
        <TabsContent value="competitors" className="space-y-6">
          {/* Competitive Analysis Summary */}
          {competitiveAnalysis && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Tu Posicionamiento Recomendado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg mb-4">{competitiveAnalysis.positioning}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2 text-success">✅ Oportunidades vs Competencia:</p>
                    <ul className="space-y-1">
                      {(competitiveAnalysis.opportunities || []).map((opp, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <ArrowUpRight className="w-3 h-3 text-success mt-1 flex-shrink-0" />
                          {opp}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2 text-primary">💡 Diferenciación:</p>
                    <ul className="space-y-1">
                      {(competitiveAnalysis.differentiation || []).map((diff, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Star className="w-3 h-3 text-primary mt-1 flex-shrink-0" />
                          {diff}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Competitors Chart */}
          {competitorStrengthData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Análisis de Fortalezas</CardTitle>
                <CardDescription>Comparación de fortalezas vs debilidades</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={competitorStrengthData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" className="text-xs" width={120} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="strengths" name="Fortalezas" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="weaknesses" name="Debilidades" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Competitor Cards */}
          {competitors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {competitors.map((competitor, idx) => (
                <CompetitorCard key={idx} competitor={competitor} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                No tienes competidores registrados. Añádelos para análisis competitivo.
              </p>
            </Card>
          )}
        </TabsContent>

        {/* OPPORTUNITIES TAB */}
        <TabsContent value="opportunities" className="space-y-6">
          {marketAnalysis ? (
            <>
              {/* Key Trends */}
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Tendencias Clave del Mercado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {(marketAnalysis.key_trends || []).map((trend, idx) => (
                      <li key={idx} className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{trend}</span>
                      </li>
                    ))}
                    {(marketAnalysis.key_trends || []).length === 0 && (
                      <p className="text-muted-foreground text-center py-4">
                        No se identificaron tendencias específicas
                      </p>
                    )}
                  </ul>
                </CardContent>
              </Card>

              {/* Opportunities */}
              <Card className="border-success/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-success">
                    <Lightbulb className="w-5 h-5" />
                    Oportunidades de Mercado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {(marketAnalysis.opportunities || []).map((opp, idx) => (
                      <li key={idx} className="flex items-start gap-3 p-3 bg-success/5 rounded-lg border-l-4 border-success">
                        <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{opp}</span>
                      </li>
                    ))}
                    {(marketAnalysis.opportunities || []).length === 0 && (
                      <p className="text-muted-foreground text-center py-4">
                        No se identificaron oportunidades específicas
                      </p>
                    )}
                  </ul>
                </CardContent>
              </Card>

              {/* Threats */}
              <Card className="border-destructive/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-5 h-5" />
                    Amenazas y Riesgos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {(marketAnalysis.threats || []).map((threat, idx) => (
                      <li key={idx} className="flex items-start gap-3 p-3 bg-destructive/5 rounded-lg border-l-4 border-destructive">
                        <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{threat}</span>
                      </li>
                    ))}
                    {(marketAnalysis.threats || []).length === 0 && (
                      <p className="text-muted-foreground text-center py-4">
                        No se identificaron amenazas específicas
                      </p>
                    )}
                  </ul>
                </CardContent>
              </Card>

              {/* Entry Barriers */}
              {marketAnalysis.entry_barriers && marketAnalysis.entry_barriers.length > 0 && (
                <Card className="border-warning/30">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-warning">
                      <Shield className="w-5 h-5" />
                      Barreras de Entrada
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {marketAnalysis.entry_barriers.map((barrier, idx) => (
                        <li key={idx} className="flex items-start gap-3 p-3 bg-warning/5 rounded-lg">
                          <Shield className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{barrier}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="p-8 text-center">
              <Lightbulb className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Genera un análisis para identificar oportunidades de mercado.
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper Components
function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'primary' | 'success' | 'info' | 'warning';
}) {
  const colorClasses = {
    primary: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    info: 'text-info bg-info/10',
    warning: 'text-warning bg-warning/10',
  };

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function CompetitorCard({ competitor }: { competitor: { name: string; description?: string; strengths?: string[]; weaknesses?: string[]; market_position?: string; } }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold">{competitor.name}</h4>
          {competitor.market_position && (
            <Badge variant="outline" className="mt-1">{competitor.market_position}</Badge>
          )}
        </div>
        <Building2 className="w-5 h-5 text-muted-foreground" />
      </div>
      
      {competitor.description && (
        <p className="text-sm text-muted-foreground mb-3">{competitor.description}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {competitor.strengths && competitor.strengths.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-1 text-destructive">Sus Fortalezas:</p>
            <ul className="space-y-1">
              {competitor.strengths.slice(0, 3).map((s, i) => (
                <li key={i} className="text-xs text-muted-foreground">• {s}</li>
              ))}
            </ul>
          </div>
        )}
        {competitor.weaknesses && competitor.weaknesses.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-1 text-success">Sus Debilidades:</p>
            <ul className="space-y-1">
              {competitor.weaknesses.slice(0, 3).map((w, i) => (
                <li key={i} className="text-xs text-muted-foreground">• {w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}

export default MarketStudySection;
