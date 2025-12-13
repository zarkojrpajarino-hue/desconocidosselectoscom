import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ToolContentViewer from '@/components/ToolContentViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, TrendingDown, Target, DollarSign, 
  AlertTriangle, CheckCircle, BarChart3, PieChart,
  ArrowUpRight, ArrowDownRight, Shield, Zap
} from 'lucide-react';

// Types for Calculadora content
interface MarketValue { value?: string; calculation?: string }
interface MarketAnalysis {
  tam?: MarketValue; sam?: MarketValue; som?: MarketValue;
  trends?: string[]; growth_rate?: string;
}
interface FinancialScenario {
  year1_revenue?: string; year2_revenue?: string; year3_revenue?: string;
  assumptions?: string[];
}
interface FinancialProjections {
  scenario_conservative?: FinancialScenario;
  scenario_realistic?: FinancialScenario;
  scenario_optimistic?: FinancialScenario;
}
interface UnitEconomics {
  cac?: { value?: string }; ltv?: { value?: string };
  ltv_cac_ratio?: string; payback_period?: string; gross_margin?: string;
}
interface CompetitivePosition {
  strengths?: string[]; weaknesses?: string[]; opportunities?: string[]; threats?: string[];
}
interface GrowthLever {
  lever?: string; potential_impact?: string; timeline?: string;
  recommendation?: string; effort_required?: string;
}
interface RiskItem { risk?: string; mitigation?: string; probability?: string; impact?: string }
interface ActionPlan { immediate?: string[]; short_term?: string[]; long_term?: string[] }
interface OpportunityScore {
  overall?: number;
  breakdown?: {
    market_attractiveness?: string; competitive_position?: string;
    team_capability?: string; financial_viability?: string;
    execution_capability?: string;
  };
  recommendation?: string;
  verdict?: string;
}
interface CalculadoraData {
  market_analysis?: MarketAnalysis;
  financial_projections?: FinancialProjections;
  unit_economics?: UnitEconomics;
  competitive_position?: CompetitivePosition;
  growth_levers?: GrowthLever[];
  action_plan?: ActionPlan;
  risk_assessment?: RiskItem[];
  opportunity_score?: OpportunityScore;
}

const Calculadora = () => {
  const navigate = useNavigate();

  const getImpactColor = (impact: string | undefined) => {
    switch (impact?.toLowerCase()) {
      case 'alto': return 'text-green-600 bg-green-500/10';
      case 'medio': return 'text-yellow-600 bg-yellow-500/10';
      case 'bajo': return 'text-gray-600 bg-gray-500/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const renderContent = (calc: CalculadoraData) => {
    if (!calc) return null;

    return (
      <div className="space-y-6 md:space-y-8">
        {/* Market Analysis */}
        {calc.market_analysis && (
          <div>
            <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 flex items-center gap-2">
              <PieChart className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              Análisis de Mercado
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">TAM</p>
                    <p className="text-2xl font-bold text-primary">{calc.market_analysis.tam?.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{calc.market_analysis.tam?.calculation}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">SAM</p>
                    <p className="text-2xl font-bold text-primary">{calc.market_analysis.sam?.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{calc.market_analysis.sam?.calculation}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">SOM</p>
                    <p className="text-2xl font-bold text-primary">{calc.market_analysis.som?.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{calc.market_analysis.som?.calculation}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {calc.market_analysis.trends && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tendencias de Mercado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Crecimiento: {calc.market_analysis.growth_rate}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {calc.market_analysis.trends.map((trend: string, idx: number) => (
                      <Badge key={idx} variant="secondary">{trend}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Financial Projections */}
        {calc.financial_projections && (
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Proyecciones Financieras
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {['conservative', 'realistic', 'optimistic'].map((scenario) => {
                const data = calc.financial_projections[`scenario_${scenario}`];
                if (!data) return null;
                
                const scenarioLabels: Record<string, { label: string; color: string }> = {
                  conservative: { label: 'Conservador', color: 'border-blue-500' },
                  realistic: { label: 'Realista', color: 'border-green-500' },
                  optimistic: { label: 'Optimista', color: 'border-yellow-500' }
                };
                
                return (
                  <Card key={scenario} className={`border-t-4 ${scenarioLabels[scenario].color}`}>
                    <CardHeader>
                      <CardTitle className="text-lg">{scenarioLabels[scenario].label}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Año 1</span>
                          <span className="font-semibold">{data.year1_revenue}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Año 2</span>
                          <span className="font-semibold">{data.year2_revenue}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Año 3</span>
                          <span className="font-semibold">{data.year3_revenue}</span>
                        </div>
                      </div>
                      {data.assumptions && data.assumptions.length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground mb-1">Supuestos:</p>
                          <ul className="text-xs space-y-1">
                            {data.assumptions.map((a: string, idx: number) => (
                              <li key={idx}>• {a}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Unit Economics */}
        {calc.unit_economics && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Unit Economics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">CAC</p>
                  <p className="text-xl font-bold">{calc.unit_economics.cac?.value}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">LTV</p>
                  <p className="text-xl font-bold">{calc.unit_economics.ltv?.value}</p>
                </div>
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">LTV/CAC</p>
                  <p className="text-xl font-bold text-primary">{calc.unit_economics.ltv_cac_ratio}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Payback</p>
                  <p className="text-xl font-bold">{calc.unit_economics.payback_period}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Margen Bruto</p>
                  <p className="text-xl font-bold">{calc.unit_economics.gross_margin}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Competitive Position (SWOT) */}
        {calc.competitive_position && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Análisis FODA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-500/10 rounded-lg p-4">
                  <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4" />
                    Fortalezas
                  </h4>
                  <ul className="space-y-1">
                    {calc.competitive_position.strengths?.map((s: string, idx: number) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-red-500/10 rounded-lg p-4">
                  <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                    <ArrowDownRight className="h-4 w-4" />
                    Debilidades
                  </h4>
                  <ul className="space-y-1">
                    {calc.competitive_position.weaknesses?.map((w: string, idx: number) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Oportunidades
                  </h4>
                  <ul className="space-y-1">
                    {calc.competitive_position.opportunities?.map((o: string, idx: number) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <Zap className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                        <span>{o}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-orange-500/10 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-700 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Amenazas
                  </h4>
                  <ul className="space-y-1">
                    {calc.competitive_position.threats?.map((t: string, idx: number) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <TrendingDown className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Growth Levers */}
        {calc.growth_levers && calc.growth_levers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Palancas de Crecimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {calc.growth_levers.map((lever: GrowthLever, idx: number) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold">{lever.lever}</h4>
                      <div className="flex gap-2">
                        <Badge className={getImpactColor(lever.potential_impact)}>
                          Impacto: {lever.potential_impact}
                        </Badge>
                        <Badge variant="outline">{lever.timeline}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{lever.recommendation}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>Esfuerzo: {lever.effort_required}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Plan */}
        {calc.action_plan && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Plan de Acción
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-semibold mb-2 text-red-600">Inmediato</h4>
                  <ul className="space-y-2">
                    {calc.action_plan.immediate?.map((action: string, idx: number) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h4 className="font-semibold mb-2 text-yellow-600">Corto Plazo</h4>
                  <ul className="space-y-2">
                    {calc.action_plan.short_term?.map((action: string, idx: number) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold mb-2 text-green-600">Largo Plazo</h4>
                  <ul className="space-y-2">
                    {calc.action_plan.long_term?.map((action: string, idx: number) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Risk Assessment */}
        {calc.risk_assessment && calc.risk_assessment.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Evaluación de Riesgos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {calc.risk_assessment.map((risk: RiskItem, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{risk.risk}</h4>
                      <p className="text-sm text-muted-foreground">{risk.mitigation}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">Prob: {risk.probability}</Badge>
                      <Badge variant="outline">Impacto: {risk.impact}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Opportunity Score */}
        {calc.opportunity_score && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-center text-2xl">Puntuación de Oportunidad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="text-6xl font-bold text-primary mb-2">
                  {calc.opportunity_score.overall}
                </div>
                <p className="text-lg">/100</p>
              </div>
              
              {calc.opportunity_score.breakdown && (
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Atractivo de Mercado</p>
                    <Progress value={(parseInt(calc.opportunity_score.breakdown.market_attractiveness) / 25) * 100} className="h-2 mb-1" />
                    <p className="text-sm font-medium">{calc.opportunity_score.breakdown.market_attractiveness}/25</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Posición Competitiva</p>
                    <Progress value={(parseInt(calc.opportunity_score.breakdown.competitive_position) / 25) * 100} className="h-2 mb-1" />
                    <p className="text-sm font-medium">{calc.opportunity_score.breakdown.competitive_position}/25</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Viabilidad Financiera</p>
                    <Progress value={(parseInt(calc.opportunity_score.breakdown.financial_viability) / 25) * 100} className="h-2 mb-1" />
                    <p className="text-sm font-medium">{calc.opportunity_score.breakdown.financial_viability}/25</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Capacidad de Ejecución</p>
                    <Progress value={(parseInt(calc.opportunity_score.breakdown.execution_capability) / 25) * 100} className="h-2 mb-1" />
                    <p className="text-sm font-medium">{calc.opportunity_score.breakdown.execution_capability}/25</p>
                  </div>
                </div>
              )}
              
              {calc.opportunity_score.verdict && (
                <div className="text-center bg-primary/10 rounded-lg p-4">
                  <p className="text-lg font-semibold">{calc.opportunity_score.verdict}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Botón Volver al Menú */}
      <Button
        variant="outline"
        onClick={() => navigate('/home')}
        className="fixed top-4 right-4 z-50 gap-2 shadow-lg"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Volver al Menú</span>
      </Button>

      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">💰 Calculadora de Oportunidad</h1>
          <p className="text-muted-foreground mt-2">
            Análisis completo del potencial de tu negocio con proyecciones financieras y recomendaciones estratégicas.
          </p>
        </div>
        
        <div className="bg-card rounded-lg border p-6">
          <ToolContentViewer
            toolType="opportunity_calculator"
            title="Calculadora de Oportunidad de Negocio"
            description="Análisis de mercado, proyecciones financieras, unit economics y plan de acción personalizado"
            renderContent={renderContent}
          />
        </div>
      </div>
    </div>
  );
};

export default Calculadora;
