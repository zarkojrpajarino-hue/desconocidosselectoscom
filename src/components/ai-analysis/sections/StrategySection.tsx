// ============================================
// STRATEGY SECTION - COMPLETE
// Impact/effort matrix, priorities, quick wins
// ============================================

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Target,
  Zap,
  AlertTriangle,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Lightbulb,
  DollarSign,
  Users,
  Package,
  BarChart3,
  HelpCircle,
  Flame,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ZAxis,
} from 'recharts';
import { 
  StrategicPriorities, 
  StrategicQuestions, 
  Priority, 
  Question,
  ImpactLevel,
  Deadline,
  Category,
} from '@/types/ai-analysis.types';

interface StrategySectionProps {
  priorities: StrategicPriorities;
  questions: StrategicQuestions;
}

export function StrategySection({ priorities, questions }: StrategySectionProps) {
  const [activeTab, setActiveTab] = useState('matrix');

  const getImpactValue = (impact: ImpactLevel): number => {
    const values = { high: 90, medium: 50, low: 20 };
    return values[impact] || 50;
  };

  const getEffortValue = (effort: ImpactLevel): number => {
    const values = { high: 90, medium: 50, low: 20 };
    return values[effort] || 50;
  };

  // Prepare scatter chart data for impact/effort matrix
  const allPriorities = [
    ...(priorities.high_impact_low_effort || []).map(p => ({ ...p, quadrant: 'quick_wins' })),
    ...(priorities.high_impact_high_effort || []).map(p => ({ ...p, quadrant: 'major_projects' })),
    ...(priorities.low_impact_low_effort || []).map(p => ({ ...p, quadrant: 'fill_ins' })),
    ...(priorities.low_impact_high_effort || []).map(p => ({ ...p, quadrant: 'time_wasters' })),
  ];

  const scatterData = allPriorities.map(p => ({
    x: getEffortValue(p.effort),
    y: getImpactValue(p.impact),
    z: p.priority_score,
    name: p.title,
    quadrant: p.quadrant,
  }));

  const getQuadrantColor = (quadrant: string) => {
    const colors: Record<string, string> = {
      quick_wins: 'hsl(var(--success))',
      major_projects: 'hsl(var(--primary))',
      fill_ins: 'hsl(var(--warning))',
      time_wasters: 'hsl(var(--destructive))',
    };
    return colors[quadrant] || 'hsl(var(--muted))';
  };

  const getCategoryIcon = (category: Category) => {
    const icons = {
      financial: <DollarSign className="w-4 h-4" />,
      team: <Users className="w-4 h-4" />,
      operations: <BarChart3 className="w-4 h-4" />,
      market: <Target className="w-4 h-4" />,
      strategy: <Lightbulb className="w-4 h-4" />,
      product: <Package className="w-4 h-4" />,
    };
    return icons[category] || <HelpCircle className="w-4 h-4" />;
  };

  const getDeadlineBadge = (deadline: Deadline) => {
    const configs = {
      urgent: { label: '🔥 Urgente', color: 'bg-destructive text-destructive-foreground' },
      this_week: { label: 'Esta semana', color: 'bg-warning text-warning-foreground' },
      this_month: { label: 'Este mes', color: 'bg-primary text-primary-foreground' },
      this_quarter: { label: 'Este trimestre', color: 'bg-muted text-muted-foreground' },
    };
    return configs[deadline] || configs.this_quarter;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-blue-500/10 via-background to-background border-2 border-blue-500/30">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Target className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl">Estrategia y Prioridades</CardTitle>
              <CardDescription className="text-base">
                {allPriorities.length} iniciativas identificadas • {(questions.focus_questions || []).length + 
                (questions.money_questions || []).length + (questions.team_questions || []).length +
                (questions.market_questions || []).length + (questions.product_questions || []).length} preguntas estratégicas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="matrix" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Matriz
          </TabsTrigger>
          <TabsTrigger value="priorities" className="gap-2">
            <Target className="w-4 h-4" />
            Prioridades
          </TabsTrigger>
          <TabsTrigger value="questions" className="gap-2">
            <HelpCircle className="w-4 h-4" />
            Preguntas
          </TabsTrigger>
          <TabsTrigger value="focus" className="gap-2">
            <Zap className="w-4 h-4" />
            Enfoque
          </TabsTrigger>
        </TabsList>

        {/* MATRIX TAB */}
        <TabsContent value="matrix" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Matriz Impacto / Esfuerzo</CardTitle>
              <CardDescription>
                Visualiza dónde invertir tu tiempo y recursos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] relative">
                {/* Quadrant Labels */}
                <div className="absolute top-0 left-1/4 transform -translate-x-1/2 text-xs font-medium text-success z-10 bg-background/80 px-2 py-1 rounded">
                  ⚡ Quick Wins
                </div>
                <div className="absolute top-0 right-1/4 transform translate-x-1/2 text-xs font-medium text-primary z-10 bg-background/80 px-2 py-1 rounded">
                  🚀 Proyectos Mayores
                </div>
                <div className="absolute bottom-8 left-1/4 transform -translate-x-1/2 text-xs font-medium text-warning z-10 bg-background/80 px-2 py-1 rounded">
                  📝 Fill-ins
                </div>
                <div className="absolute bottom-8 right-1/4 transform translate-x-1/2 text-xs font-medium text-destructive z-10 bg-background/80 px-2 py-1 rounded">
                  ⏰ Time Wasters
                </div>

                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      name="Esfuerzo" 
                      domain={[0, 100]}
                      label={{ value: 'Esfuerzo →', position: 'bottom', offset: 0 }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name="Impacto" 
                      domain={[0, 100]}
                      label={{ value: '← Impacto', angle: -90, position: 'left', offset: 0 }}
                    />
                    <ZAxis type="number" dataKey="z" range={[100, 400]} />
                    <Tooltip
                      content={({ payload }) => {
                        if (payload && payload.length > 0) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-card p-3 rounded-lg border shadow-lg">
                              <p className="font-semibold">{data.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Impacto: {data.y}% | Esfuerzo: {data.x}%
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Score: {data.z}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter name="Iniciativas" data={scatterData}>
                      {scatterData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getQuadrantColor(entry.quadrant)} />
                      ))}
                    </Scatter>
                    {/* Reference lines for quadrants */}
                    <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="hsl(var(--border))" strokeDasharray="5 5" />
                    <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="hsl(var(--border))" strokeDasharray="5 5" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="flex justify-center gap-6 mt-4">
                <LegendItem color="bg-success" label="Quick Wins (Hacer YA)" />
                <LegendItem color="bg-primary" label="Proyectos Mayores (Planificar)" />
                <LegendItem color="bg-warning" label="Fill-ins (Cuando hay tiempo)" />
                <LegendItem color="bg-destructive" label="Time Wasters (Evitar)" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRIORITIES TAB */}
        <TabsContent value="priorities" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Wins */}
            <PriorityQuadrant
              title="⚡ Quick Wins"
              subtitle="Alto impacto, bajo esfuerzo - ¡Hazlo YA!"
              priorities={priorities.high_impact_low_effort || []}
              color="success"
            />

            {/* Major Projects */}
            <PriorityQuadrant
              title="🚀 Proyectos Mayores"
              subtitle="Alto impacto, alto esfuerzo - Planifica bien"
              priorities={priorities.high_impact_high_effort || []}
              color="primary"
            />

            {/* Fill-ins */}
            <PriorityQuadrant
              title="📝 Fill-ins"
              subtitle="Bajo impacto, bajo esfuerzo - Cuando sobre tiempo"
              priorities={priorities.low_impact_low_effort || []}
              color="warning"
            />

            {/* Time Wasters */}
            <PriorityQuadrant
              title="⏰ Time Wasters"
              subtitle="Bajo impacto, alto esfuerzo - Evitar"
              priorities={priorities.low_impact_high_effort || []}
              color="destructive"
            />
          </div>
        </TabsContent>

        {/* QUESTIONS TAB */}
        <TabsContent value="questions" className="space-y-6">
          {/* Focus Questions */}
          {questions.focus_questions && questions.focus_questions.length > 0 && (
            <QuestionCategory
              title="🎯 Preguntas de Enfoque"
              questions={questions.focus_questions}
              color="primary"
            />
          )}

          {/* Money Questions */}
          {questions.money_questions && questions.money_questions.length > 0 && (
            <QuestionCategory
              title="💰 Preguntas Financieras"
              questions={questions.money_questions}
              color="success"
            />
          )}

          {/* Team Questions */}
          {questions.team_questions && questions.team_questions.length > 0 && (
            <QuestionCategory
              title="👥 Preguntas de Equipo"
              questions={questions.team_questions}
              color="warning"
            />
          )}

          {/* Market Questions */}
          {questions.market_questions && questions.market_questions.length > 0 && (
            <QuestionCategory
              title="🌍 Preguntas de Mercado"
              questions={questions.market_questions}
              color="info"
            />
          )}

          {/* Product Questions */}
          {questions.product_questions && questions.product_questions.length > 0 && (
            <QuestionCategory
              title="📦 Preguntas de Producto"
              questions={questions.product_questions}
              color="violet"
            />
          )}

          {!questions.focus_questions?.length && !questions.money_questions?.length && 
           !questions.team_questions?.length && !questions.market_questions?.length &&
           !questions.product_questions?.length && (
            <Card className="p-8 text-center">
              <HelpCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                No hay preguntas estratégicas generadas aún. Genera un nuevo análisis con más datos.
              </p>
            </Card>
          )}
        </TabsContent>

        {/* FOCUS TAB */}
        <TabsContent value="focus" className="space-y-6">
          {/* Recommended Focus */}
          <Card className="border-success/30 bg-success/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-success">
                <CheckCircle2 className="w-5 h-5" />
                Donde Enfocar tu Energía
              </CardTitle>
              <CardDescription>
                Las iniciativas más importantes según el análisis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {(priorities.recommended_focus || ['Completa más datos para obtener recomendaciones']).map((focus, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-4 bg-success/10 rounded-lg border-l-4 border-success">
                    <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-success">{idx + 1}</span>
                    </div>
                    <span className="text-base">{focus}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Initiatives to Stop */}
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                <XCircle className="w-5 h-5" />
                Qué Dejar de Hacer
              </CardTitle>
              <CardDescription>
                Iniciativas que te están quitando tiempo sin retorno
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {(priorities.initiatives_to_stop || []).length > 0 ? (
                  priorities.initiatives_to_stop.map((stop, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg border-l-4 border-destructive">
                      <XCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                      <span className="text-base">{stop}</span>
                    </li>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-success" />
                    <p>No se identificaron iniciativas a eliminar</p>
                  </div>
                )}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper Components
function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function PriorityQuadrant({
  title,
  subtitle,
  priorities,
  color,
}: {
  title: string;
  subtitle: string;
  priorities: Priority[];
  color: 'success' | 'primary' | 'warning' | 'destructive';
}) {
  const colorClasses = {
    success: 'border-success/30 bg-success/5',
    primary: 'border-primary/30 bg-primary/5',
    warning: 'border-warning/30 bg-warning/5',
    destructive: 'border-destructive/30 bg-destructive/5',
  };

  return (
    <Card className={colorClasses[color]}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        {priorities.length > 0 ? (
          <ul className="space-y-3">
            {priorities.map((priority, idx) => (
              <li key={idx} className="p-3 bg-card rounded-lg border">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-medium text-sm">{priority.title}</span>
                  <Badge variant="outline">{priority.priority_score}/100</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{priority.description}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {priority.timeline}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {priority.expected_outcome}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Sin iniciativas en este cuadrante</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuestionCategory({
  title,
  questions,
  color,
}: {
  title: string;
  questions: Question[];
  color: 'primary' | 'success' | 'warning' | 'info' | 'violet';
}) {
  const colorClasses = {
    primary: 'border-primary/30',
    success: 'border-success/30',
    warning: 'border-warning/30',
    info: 'border-info/30',
    violet: 'border-violet-500/30',
  };

  const getDeadlineColor = (deadline: Deadline) => {
    const colors = {
      urgent: 'text-destructive',
      this_week: 'text-warning',
      this_month: 'text-primary',
      this_quarter: 'text-muted-foreground',
    };
    return colors[deadline] || colors.this_quarter;
  };

  return (
    <Card className={colorClasses[color]}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {questions.map((question, idx) => (
            <Card key={idx} className="p-4 border-muted">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold text-base">{question.question}</h4>
                <Badge className={getDeadlineColor(question.deadline)} variant="outline">
                  {question.deadline === 'urgent' ? '🔥 Urgente' : 
                   question.deadline === 'this_week' ? 'Esta semana' :
                   question.deadline === 'this_month' ? 'Este mes' : 'Este trimestre'}
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs font-medium mb-1">🤔 Por qué importa:</p>
                  <p className="text-sm text-muted-foreground">{question.why_important}</p>
                </div>
                
                <div className="p-3 bg-primary/5 rounded-lg">
                  <p className="text-xs font-medium mb-1">📍 Situación actual:</p>
                  <p className="text-sm text-muted-foreground">{question.current_situation}</p>
                </div>
                
                <div className="p-3 bg-success/5 rounded-lg">
                  <p className="text-xs font-medium mb-1">💡 Enfoque sugerido:</p>
                  <p className="text-sm text-muted-foreground">{question.suggested_approach}</p>
                </div>
                
                <div className="p-3 bg-destructive/5 rounded-lg">
                  <p className="text-xs font-medium mb-1">⚠️ Si lo ignoras:</p>
                  <p className="text-sm text-muted-foreground">{question.consequences_if_ignored}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default StrategySection;
