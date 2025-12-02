// ============================================
// COMPONENTE: RENDIMIENTO DEL EQUIPO
// src/components/ai-analysis/TeamPerformanceSection.tsx
// ============================================

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
} from 'recharts';
import {
  Users,
  Star,
  Target,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Award,
  Zap,
  CheckCircle2,
  Clock,
  BarChart3,
} from 'lucide-react';
import { TeamPerformance, IndividualPerformance, ImpactLevel, TrendDirection } from '@/types/ai-analysis.types';

interface TeamPerformanceSectionProps {
  data: TeamPerformance;
}

export function TeamPerformanceSection({ data }: TeamPerformanceSectionProps) {
  return (
    <div className="space-y-6">
      {/* HEADER CON SCORE GENERAL */}
      <Card className="border-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl flex items-center gap-3">
                👥 Rendimiento del Equipo
                <Badge variant="outline" className="text-xl">
                  {data.overall_score}/100
                </Badge>
              </CardTitle>
              <CardDescription className="mt-2 flex items-center gap-2">
                Tendencia de productividad: <TrendBadge trend={data.productivity_trend} />
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* MÉTRICAS DEL EQUIPO - GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <TeamMetricCard
          icon={<Users className="w-5 h-5" />}
          title="Miembros Activos"
          value={`${data.team_metrics.active_members}/${data.team_metrics.total_members}`}
          color="text-primary"
        />
        <TeamMetricCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          title="Tasa de Completitud"
          value={`${data.team_metrics.completion_rate.toFixed(1)}%`}
          color="text-success"
        />
        <TeamMetricCard
          icon={<Zap className="w-5 h-5" />}
          title="Colaboración"
          value={`${data.team_metrics.collaboration_score}/100`}
          color="text-warning"
        />
        <TeamMetricCard
          icon={<Sparkles className="w-5 h-5" />}
          title="Innovación"
          value={`${data.team_metrics.innovation_score}/100`}
          color="text-purple-500"
        />
      </div>

      {/* INDICADORES DE SALUD DEL EQUIPO */}
      <Card>
        <CardHeader>
          <CardTitle>Indicadores de Salud del Equipo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <HealthIndicator
              label="Balance de Carga de Trabajo"
              value={data.team_health_indicators.workload_balance}
            />
            <HealthIndicator
              label="Calidad de Comunicación"
              value={data.team_health_indicators.communication_quality}
            />
            <HealthIndicator
              label="Alineación con Objetivos"
              value={data.team_health_indicators.goal_alignment}
            />
            <HealthIndicator
              label="Moral del Equipo"
              value={data.team_health_indicators.morale}
            />
          </div>
        </CardContent>
      </Card>

      {/* GRÁFICA: PRODUCTIVIDAD POR MIEMBRO */}
      <Card>
        <CardHeader>
          <CardTitle>Productividad por Miembro</CardTitle>
          <CardDescription>Score de rendimiento individual</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.charts.productivity_by_member} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="name" type="category" width={120} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="score" name="Score" radius={[0, 8, 8, 0]}>
                {data.charts.productivity_by_member.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={getPerformanceColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* GRÁFICAS ADICIONALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Distribución de Tareas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribución de Tareas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.charts.task_distribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" stackId="a" fill="hsl(var(--success))" name="Completadas" />
                <Bar dataKey="pending" stackId="a" fill="hsl(var(--warning))" name="Pendientes" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Velocidad del Equipo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Velocidad del Equipo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.charts.team_velocity}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="velocity" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ r: 5, fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* DESTACADOS Y ALERTAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Star Performers */}
        {data.star_performers.length > 0 && (
          <Card className="border-success">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5 text-success" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.star_performers.map((name, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-success/5 rounded-lg">
                    <Award className="w-4 h-4 text-success" />
                    <span className="font-medium">{name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cuellos de Botella */}
        {data.bottlenecks.length > 0 && (
          <Card className="border-warning">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Cuellos de Botella
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.bottlenecks.map((bottleneck, idx) => (
                  <div key={idx} className="text-sm p-2 bg-warning/5 rounded-lg border border-warning/20">
                    {bottleneck}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Miembros en Riesgo */}
        {data.at_risk_members.length > 0 && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                En Riesgo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.at_risk_members.map((name, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-destructive/5 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <span className="font-medium">{name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator className="my-8" />

      {/* 💬 FEEDBACK INDIVIDUAL POR USUARIO */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-3xl font-bold">💬 Feedback Individual</h2>
            <p className="text-muted-foreground">Análisis personalizado para cada miembro del equipo</p>
          </div>
        </div>

        {data.individual_performance.map((member) => (
          <IndividualFeedbackCard key={member.user_id} member={member} />
        ))}
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE: FEEDBACK INDIVIDUAL
// ============================================

interface IndividualFeedbackCardProps {
  member: IndividualPerformance;
}

function IndividualFeedbackCard({ member }: IndividualFeedbackCardProps) {
  return (
    <Card className="border-2 hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user_name}`} />
              <AvatarFallback>{member.user_name.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="flex items-center gap-3 text-2xl">
                {member.user_name}
                <Badge variant="outline">{member.role}</Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                Score: {member.performance_score}/100 • Completitud: {member.task_completion_rate.toFixed(1)}%
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <ImpactBadge impact={member.impact_rating} />
            {member.burnout_risk === 'high' && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="w-3 h-3" />
                Riesgo burnout
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Score Visual */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Rendimiento General</span>
            <span className="text-muted-foreground">{member.performance_score}/100</span>
          </div>
          <Progress value={member.performance_score} className="h-3" />
        </div>

        {/* Métricas Adicionales */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-card rounded-lg border">
            <p className="text-sm text-muted-foreground mb-1">Colaboración</p>
            <p className="text-2xl font-bold">{member.collaboration_score}/100</p>
          </div>
          <div className="p-3 bg-card rounded-lg border">
            <p className="text-sm text-muted-foreground mb-1">Completitud</p>
            <p className="text-2xl font-bold">{member.task_completion_rate.toFixed(0)}%</p>
          </div>
        </div>

        {/* Logros Recientes */}
        {member.recent_achievements && member.recent_achievements.length > 0 && (
          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-success" />
              Logros Recientes
            </h4>
            <div className="space-y-2">
              {member.recent_achievements.map((achievement, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm p-2 bg-success/5 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span>{achievement}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Fortalezas */}
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-success" />
            Fortalezas
          </h4>
          <ul className="space-y-2">
            {member.strengths.map((strength, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 flex-shrink-0" />
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Áreas de Mejora */}
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-warning" />
            Áreas de Mejora
          </h4>
          <ul className="space-y-2">
            {member.areas_to_improve.map((area, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 flex-shrink-0" />
                <span>{area}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Consejo Personalizado de la IA */}
        <div className="p-4 bg-primary/10 rounded-lg border-l-4 border-primary">
          <h4 className="font-semibold flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            Consejo Personalizado de la IA
          </h4>
          <p className="text-sm italic leading-relaxed">{member.personalized_advice}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================

function TeamMetricCard({ icon, title, value, color }: any) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className={`${color}`}>{icon}</div>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function HealthIndicator({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{value}/100</span>
      </div>
      <Progress value={value} className="h-2" />
      <p className="text-xs text-muted-foreground">
        {value >= 80 ? '✅ Excelente' : value >= 60 ? '⚠️ Aceptable' : '🚨 Necesita atención'}
      </p>
    </div>
  );
}

function TrendBadge({ trend }: { trend: TrendDirection }) {
  const config = {
    increasing: { icon: <TrendingUp className="w-4 h-4" />, color: 'text-success', text: 'Aumentando' },
    stable: { icon: <div className="w-4 h-0.5 bg-current" />, color: 'text-muted-foreground', text: 'Estable' },
    decreasing: { icon: <TrendingDown className="w-4 h-4" />, color: 'text-destructive', text: 'Disminuyendo' },
  };

  return (
    <div className={`flex items-center gap-1 ${config[trend].color}`}>
      {config[trend].icon}
      <span className="font-medium text-sm">{config[trend].text}</span>
    </div>
  );
}

function ImpactBadge({ impact }: { impact: ImpactLevel }) {
  const config = {
    high: { color: 'bg-success/10 text-success border-success', text: '🌟 Alto Impacto' },
    medium: { color: 'bg-warning/10 text-warning border-warning', text: '⚡ Impacto Medio' },
    low: { color: 'bg-muted text-muted-foreground border-muted', text: 'Impacto Bajo' },
  };

  return (
    <Badge variant="outline" className={config[impact].color}>
      {config[impact].text}
    </Badge>
  );
}

function getPerformanceColor(score: number): string {
  if (score >= 80) return 'hsl(var(--success))';
  if (score >= 60) return 'hsl(var(--primary))';
  if (score >= 40) return 'hsl(var(--warning))';
  return 'hsl(var(--destructive))';
}

export default TeamPerformanceSection;
