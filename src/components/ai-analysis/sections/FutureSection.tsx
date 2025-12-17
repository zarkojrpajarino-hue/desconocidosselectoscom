// ============================================
// SECCIÓN FUTURO Y PROYECCIONES
// ============================================

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  AlertCircle,
  Zap,
  Target,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { FutureRoadmap, Projections, PriorityLevel } from '@/types/ai-analysis.types';

interface FutureSectionProps {
  roadmap: FutureRoadmap;
  projections: Projections;
}

export function FutureSection({ roadmap, projections }: FutureSectionProps) {
  const [activeTimeline, setActiveTimeline] = useState<'30' | '90' | 'year'>('30');
  
  const getPriorityColor = (priority: PriorityLevel) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  const getTimelineData = () => {
    switch (activeTimeline) {
      case '30': return roadmap?.next_30_days || [];
      case '90': return roadmap?.next_90_days || [];
      case 'year': return roadmap?.next_year || [];
      default: return [];
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header con tabs de timeline */}
      <Card className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-indigo-500/10 border-2 border-violet-500/30">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
                🔮 Roadmap Estratégico
              </CardTitle>
              <CardDescription>
                Tu plan de crecimiento personalizado generado con IA
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={activeTimeline === '30' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTimeline('30')}
              >
                30 días
              </Button>
              <Button
                variant={activeTimeline === '90' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTimeline('90')}
              >
                90 días
              </Button>
              <Button
                variant={activeTimeline === 'year' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTimeline('year')}
              >
                12 meses
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Timeline Visual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Decisiones Clave - Próximos {activeTimeline === '30' ? '30 días' : activeTimeline === '90' ? '90 días' : '12 meses'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getTimelineData().length > 0 ? (
            <div className="relative">
              {/* Línea vertical del timeline */}
              <div className="absolute left-4 md:left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary/20" />
              
              <div className="space-y-4 md:space-y-6">
                {getTimelineData().map((decision, index) => (
                  <div key={decision.id || index} className="relative pl-10 md:pl-14">
                    {/* Punto del timeline */}
                    <div className={`absolute left-2 md:left-4 w-4 h-4 md:w-5 md:h-5 rounded-full border-2 border-primary ${
                      index === 0 ? 'bg-primary' : 'bg-background'
                    }`} />
                    
                    <Card className={`${index === 0 ? 'border-primary shadow-md' : ''}`}>
                      <CardHeader className="pb-2">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                          <div className="flex-1">
                            <CardTitle className="text-sm md:text-base flex items-center gap-2 flex-wrap">
                              {decision.title}
                              <Badge className={getPriorityColor(decision.priority)} variant="outline">
                                {decision.priority}
                              </Badge>
                            </CardTitle>
                            <CardDescription className="mt-1 text-xs md:text-sm">
                              {decision.description}
                            </CardDescription>
                          </div>
                          {decision.estimated_impact && (
                            <Badge variant="secondary" className="shrink-0 text-xs">
                              Impacto: {decision.estimated_impact}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {decision.action_items && decision.action_items.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Acciones:</p>
                            <div className="flex flex-wrap gap-1.5 md:gap-2">
                              {decision.action_items.map((action, idx) => (
                                <span 
                                  key={idx}
                                  className="text-xs bg-muted px-2 py-1 rounded-full"
                                >
                                  {action}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {decision.dependencies && decision.dependencies.length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            <span className="font-medium">Dependencias:</span> {decision.dependencies.join(', ')}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No hay decisiones planificadas para este período
            </p>
          )}
        </CardContent>
      </Card>

      {/* Proyecciones Financieras */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {projections?.next_month && (
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                📅 Próximo Mes
                <Badge variant="outline">{projections.next_month.confidence}% confianza</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ingresos</span>
                  <span className="font-semibold text-green-500">{formatCurrency(projections.next_month.revenue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gastos</span>
                  <span className="font-semibold text-red-500">{formatCurrency(projections.next_month.expenses)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium">Beneficio Neto</span>
                  <span className={`font-bold ${projections.next_month.net_profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(projections.next_month.net_profit)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground pt-1">
                  <span>👥 {projections.next_month.team_size} personas</span>
                  <span>🎯 {projections.next_month.customers} clientes</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {projections?.next_quarter && (
          <Card className="border-purple-500/30 bg-purple-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                📊 Próximo Trimestre
                <Badge variant="outline">{projections.next_quarter.confidence}% confianza</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ingresos</span>
                  <span className="font-semibold text-green-500">{formatCurrency(projections.next_quarter.revenue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gastos</span>
                  <span className="font-semibold text-red-500">{formatCurrency(projections.next_quarter.expenses)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium">Beneficio Neto</span>
                  <span className={`font-bold ${projections.next_quarter.net_profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(projections.next_quarter.net_profit)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground pt-1">
                  <span>👥 {projections.next_quarter.team_size} personas</span>
                  <span>🎯 {projections.next_quarter.customers} clientes</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {projections?.next_year && (
          <Card className="border-indigo-500/30 bg-indigo-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                🎯 Próximo Año
                <Badge variant="outline">{projections.next_year.confidence}% confianza</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ingresos</span>
                  <span className="font-semibold text-green-500">{formatCurrency(projections.next_year.revenue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gastos</span>
                  <span className="font-semibold text-red-500">{formatCurrency(projections.next_year.expenses)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium">Beneficio Neto</span>
                  <span className={`font-bold ${projections.next_year.net_profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(projections.next_year.net_profit)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground pt-1">
                  <span>👥 {projections.next_year.team_size} personas</span>
                  <span>🎯 {projections.next_year.customers} clientes</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Gráfico de Proyecciones */}
      {projections?.charts?.revenue_projection && projections.charts.revenue_projection.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📈 Proyección de Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projections.charts.revenue_projection}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis tickFormatter={(v) => `€${(v/1000).toFixed(0)}k`} className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Ingresos']}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan de Escalamiento */}
      {roadmap?.scaling_plan && (
        <Card className="border-2 border-emerald-500/30">
          <CardHeader className="bg-emerald-500/5">
            <CardTitle className="text-lg md:text-xl flex items-center gap-2">
              🚀 Plan de Escalamiento
            </CardTitle>
            <CardDescription>
              De {roadmap.scaling_plan.current_capacity} → {roadmap.scaling_plan.target_capacity}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Cuellos de Botella */}
              {roadmap.scaling_plan.bottlenecks_for_scale && roadmap.scaling_plan.bottlenecks_for_scale.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm md:text-base">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    Cuellos de Botella a Resolver
                  </h4>
                  <ul className="space-y-2">
                    {roadmap.scaling_plan.bottlenecks_for_scale.map((bottleneck, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs md:text-sm">
                        <span className="text-orange-500 mt-0.5">⚠️</span>
                        {bottleneck}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Infraestructura */}
              {roadmap.scaling_plan.infrastructure_needs && roadmap.scaling_plan.infrastructure_needs.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm md:text-base">
                    <Zap className="w-4 h-4 text-blue-500" />
                    Necesidades de Infraestructura
                  </h4>
                  <ul className="space-y-2">
                    {roadmap.scaling_plan.infrastructure_needs.map((need, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs md:text-sm">
                        <span className="text-blue-500 mt-0.5">🔧</span>
                        {need}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Inversiones Requeridas */}
            {roadmap.scaling_plan.required_investments && roadmap.scaling_plan.required_investments.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm md:text-base">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  Inversiones Requeridas
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {roadmap.scaling_plan.required_investments.map((investment, idx) => (
                    <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                      <div className="font-medium text-sm">{investment.area}</div>
                      <div className="text-lg font-bold text-primary">{investment.amount}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        ROI: {investment.roi_percentage}% • {investment.timeline}
                      </div>
                      <div className={`text-xs mt-1 ${getRiskColor(investment.risk_level)}`}>
                        Riesgo: {investment.risk_level}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Plan de Contratación */}
            {roadmap.scaling_plan.hiring_plan && roadmap.scaling_plan.hiring_plan.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm md:text-base">
                  <Users className="w-4 h-4 text-purple-500" />
                  Plan de Contratación
                </h4>
                <div className="space-y-3">
                  {roadmap.scaling_plan.hiring_plan.map((hire, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{hire.role}</div>
                        <div className="text-xs text-muted-foreground">{hire.why}</div>
                      </div>
                      <Badge className={getPriorityColor(hire.priority)} variant="outline">
                        {hire.priority}
                      </Badge>
                      <div className="text-right">
                        <div className="text-sm font-medium">{hire.when}</div>
                        <div className="text-xs text-muted-foreground">{hire.estimated_cost}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline de escalado */}
            {roadmap.scaling_plan.timeline_to_scale && (
              <div className="mt-6 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-500" />
                  <span className="font-medium text-sm md:text-base">Tiempo estimado para escalar:</span>
                  <span className="text-base md:text-lg font-bold text-emerald-600">{roadmap.scaling_plan.timeline_to_scale}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Escenarios */}
      {projections?.scenarios && projections.scenarios.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🎲 Análisis de Escenarios</CardTitle>
            <CardDescription>Proyecciones bajo diferentes condiciones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projections.scenarios.map((scenario, idx) => (
                <Card key={idx} className={`${
                  scenario.name.toLowerCase().includes('optimista') ? 'border-green-500/30 bg-green-500/5' :
                  scenario.name.toLowerCase().includes('pesimista') ? 'border-red-500/30 bg-red-500/5' :
                  'border-yellow-500/30 bg-yellow-500/5'
                }`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm md:text-base flex items-center justify-between">
                      {scenario.name}
                      <Badge variant="outline">{scenario.probability}% prob.</Badge>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {scenario.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ingresos</span>
                        <span className="font-medium">{formatCurrency(scenario.projected_revenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Equipo</span>
                        <span className="font-medium">{scenario.projected_team_size} personas</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Clientes</span>
                        <span className="font-medium">{scenario.projected_customers}</span>
                      </div>
                    </div>
                    {scenario.assumptions && scenario.assumptions.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Supuestos:</p>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          {scenario.assumptions.slice(0, 2).map((assumption, aIdx) => (
                            <li key={aIdx}>• {assumption}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}