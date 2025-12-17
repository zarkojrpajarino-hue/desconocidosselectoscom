// ============================================
// TEAM PERFORMANCE SECTION - COMPLETE
// Individual performance, radar charts, health indicators
// ============================================

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  AlertTriangle,
  CheckCircle2,
  Heart,
  Zap,
  Brain,
  MessageSquare,
  Star,
  Flame,
  Shield,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
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
} from 'recharts';
import { TeamPerformance, TrendDirection, IndividualPerformance, ImpactLevel } from '@/types/ai-analysis.types';

interface TeamPerformanceSectionProps {
  data: TeamPerformance;
}

export function TeamPerformanceSection({ data }: TeamPerformanceSectionProps) {
  const getTrendIcon = (trend: TrendDirection) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-success" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-destructive" />;
      default: return <span className="text-muted-foreground">→</span>;
    }
  };

  // Team Health Radar Data
  const healthRadarData = [
    { subject: 'Carga de Trabajo', value: data.team_health_indicators?.workload_balance || 0, fullMark: 100 },
    { subject: 'Comunicación', value: data.team_health_indicators?.communication_quality || 0, fullMark: 100 },
    { subject: 'Alineación', value: data.team_health_indicators?.goal_alignment || 0, fullMark: 100 },
    { subject: 'Moral', value: data.team_health_indicators?.morale || 0, fullMark: 100 },
  ];

  // Team metrics bar chart
  const metricsBarData = [
    { name: 'Tareas/Miembro', value: data.team_metrics?.avg_tasks_per_member || 0, target: 10 },
    { name: 'Completadas', value: data.team_metrics?.completion_rate || 0, target: 80 },
    { name: 'Colaboración', value: data.team_metrics?.collaboration_score || 0, target: 70 },
    { name: 'Innovación', value: data.team_metrics?.innovation_score || 0, target: 60 },
    { name: 'Retención', value: data.team_metrics?.retention_rate || 0, target: 90 },
  ];

  // Productivity distribution pie
  const productivityPie = [
    { name: 'Top Performers', value: (data.star_performers || []).length, fill: 'hsl(var(--success))' },
    { name: 'En Riesgo', value: (data.at_risk_members || []).length, fill: 'hsl(var(--destructive))' },
    { name: 'Promedio', value: Math.max(0, (data.team_metrics?.active_members || 0) - (data.star_performers || []).length - (data.at_risk_members || []).length), fill: 'hsl(var(--primary))' },
  ];

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-amber-500/10 via-background to-background border-2 border-amber-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl flex items-center gap-3">
                  Rendimiento del Equipo
                  <Badge variant="outline" className="gap-1">
                    {getTrendIcon(data.productivity_trend)}
                    {data.productivity_trend === 'improving' ? 'Mejorando' : data.productivity_trend === 'declining' ? 'Declinando' : 'Estable'}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-base">
                  {data.team_metrics?.active_members || 0} de {data.team_metrics?.total_members || 0} miembros activos
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-amber-500">{data.overall_score || 0}</div>
              <div className="text-sm text-muted-foreground">/ 100 puntos</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <QuickStatCard
          icon={<Users className="w-5 h-5" />}
          label="Total Miembros"
          value={data.team_metrics?.total_members || 0}
          color="primary"
        />
        <QuickStatCard
          icon={<Target className="w-5 h-5" />}
          label="Tareas/Miembro"
          value={(data.team_metrics?.avg_tasks_per_member || 0).toFixed(1)}
          color="info"
        />
        <QuickStatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Completadas"
          value={`${(data.team_metrics?.completion_rate || 0).toFixed(0)}%`}
          color="success"
        />
        <QuickStatCard
          icon={<Star className="w-5 h-5" />}
          label="Top Performers"
          value={(data.star_performers || []).length}
          color="warning"
        />
        <QuickStatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="En Riesgo"
          value={(data.at_risk_members || []).length}
          color="destructive"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Health Radar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="w-5 h-5 text-destructive" />
              Salud del Equipo
            </CardTitle>
            <CardDescription>Indicadores de bienestar y productividad</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={healthRadarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" className="text-xs" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name="Tu equipo"
                    dataKey="value"
                    stroke="hsl(var(--warning))"
                    fill="hsl(var(--warning))"
                    fillOpacity={0.5}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Health Indicators Legend */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <HealthIndicator
                label="Carga de Trabajo"
                value={data.team_health_indicators?.workload_balance || 0}
                description="Balance de tareas"
              />
              <HealthIndicator
                label="Comunicación"
                value={data.team_health_indicators?.communication_quality || 0}
                description="Calidad de comunicación"
              />
              <HealthIndicator
                label="Alineación"
                value={data.team_health_indicators?.goal_alignment || 0}
                description="Con objetivos"
              />
              <HealthIndicator
                label="Moral"
                value={data.team_health_indicators?.morale || 0}
                description="Estado de ánimo"
              />
            </div>
          </CardContent>
        </Card>

        {/* Metrics Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Métricas vs Objetivo
            </CardTitle>
            <CardDescription>Comparación con targets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metricsBarData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" className="text-xs" width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="value" name="Actual" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="target" name="Objetivo" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Performance */}
      {data.individual_performance && data.individual_performance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Rendimiento Individual
            </CardTitle>
            <CardDescription>Análisis detallado por miembro del equipo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.individual_performance.map((member, idx) => (
                <IndividualPerformanceCard key={idx} member={member} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Star Performers & At Risk */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Star Performers */}
        <Card className="border-success/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-success">
              <Star className="w-5 h-5" />
              Top Performers
            </CardTitle>
            <CardDescription>Miembros con rendimiento excepcional</CardDescription>
          </CardHeader>
          <CardContent>
            {(data.star_performers || []).length > 0 ? (
              <ul className="space-y-2">
                {data.star_performers.map((performer, idx) => (
                  <li key={idx} className="flex items-center gap-3 p-3 bg-success/5 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                      <Star className="w-4 h-4 text-success" />
                    </div>
                    <span className="font-medium">{performer}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Target className="w-8 h-8 mx-auto mb-2" />
                <p>No hay datos suficientes para identificar top performers</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* At Risk Members */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Miembros en Riesgo
            </CardTitle>
            <CardDescription>Requieren atención o apoyo</CardDescription>
          </CardHeader>
          <CardContent>
            {(data.at_risk_members || []).length > 0 ? (
              <ul className="space-y-2">
                {data.at_risk_members.map((member, idx) => (
                  <li key={idx} className="flex items-center gap-3 p-3 bg-destructive/5 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                    </div>
                    <span className="font-medium">{member}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-success" />
                <p>No hay miembros en riesgo identificados</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottlenecks */}
      {data.bottlenecks && data.bottlenecks.length > 0 && (
        <Card className="border-warning/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Flame className="w-5 h-5 text-warning" />
              Cuellos de Botella del Equipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.bottlenecks.map((bottleneck, idx) => (
                <li key={idx} className="flex items-start gap-3 p-3 bg-warning/5 rounded-lg border-l-4 border-warning">
                  <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{bottleneck}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper Components
function QuickStatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: 'primary' | 'success' | 'info' | 'warning' | 'destructive';
}) {
  const colorClasses = {
    primary: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    info: 'text-info bg-info/10',
    warning: 'text-warning bg-warning/10',
    destructive: 'text-destructive bg-destructive/10',
  };

  return (
    <Card className="p-4 text-center">
      <div className={`w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center ${colorClasses[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}

function HealthIndicator({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  const getColor = (v: number) => {
    if (v >= 80) return 'text-success';
    if (v >= 60) return 'text-primary';
    if (v >= 40) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className={`font-bold ${getColor(value)}`}>{value}</span>
      </div>
      <Progress value={value} className="h-1.5" />
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  );
}

function IndividualPerformanceCard({ member }: { member: IndividualPerformance }) {
  const getImpactBadge = (impact: ImpactLevel) => {
    const configs = {
      high: { label: 'Alto Impacto', color: 'bg-success/10 text-success' },
      medium: { label: 'Impacto Medio', color: 'bg-primary/10 text-primary' },
      low: { label: 'Bajo Impacto', color: 'bg-muted text-muted-foreground' },
    };
    return configs[impact];
  };

  const getBurnoutBadge = (risk: ImpactLevel) => {
    const configs = {
      high: { label: '🔥 Alto Riesgo', color: 'bg-destructive/10 text-destructive' },
      medium: { label: '⚠️ Riesgo Medio', color: 'bg-warning/10 text-warning' },
      low: { label: '✅ Bajo Riesgo', color: 'bg-success/10 text-success' },
    };
    return configs[risk];
  };

  const impactBadge = getImpactBadge(member.impact_rating);
  const burnoutBadge = getBurnoutBadge(member.burnout_risk);

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3 mb-4">
        <Avatar className="w-12 h-12">
          <AvatarFallback className="bg-primary/10 text-primary font-bold">
            {member.user_name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h4 className="font-semibold">{member.user_name}</h4>
          <p className="text-sm text-muted-foreground">{member.role}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">{member.performance_score}</div>
          <p className="text-xs text-muted-foreground">Score</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Badge variant="outline" className={impactBadge.color}>{impactBadge.label}</Badge>
        <Badge variant="outline" className={burnoutBadge.color}>{burnoutBadge.label}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-2 bg-muted/50 rounded-lg text-center">
          <p className="text-lg font-bold">{member.task_completion_rate}%</p>
          <p className="text-xs text-muted-foreground">Tareas completadas</p>
        </div>
        <div className="p-2 bg-muted/50 rounded-lg text-center">
          <p className="text-lg font-bold">{member.collaboration_score}</p>
          <p className="text-xs text-muted-foreground">Colaboración</p>
        </div>
      </div>

      {/* Strengths */}
      {member.strengths && member.strengths.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium mb-1 text-success">Fortalezas:</p>
          <div className="flex flex-wrap gap-1">
            {member.strengths.slice(0, 3).map((s, i) => (
              <Badge key={i} variant="outline" className="text-xs bg-success/5">{s}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Areas to improve */}
      {member.areas_to_improve && member.areas_to_improve.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium mb-1 text-warning">Áreas de mejora:</p>
          <div className="flex flex-wrap gap-1">
            {member.areas_to_improve.slice(0, 3).map((a, i) => (
              <Badge key={i} variant="outline" className="text-xs bg-warning/5">{a}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Personalized advice */}
      {member.personalized_advice && (
        <div className="p-2 bg-primary/5 rounded-lg border-l-2 border-primary">
          <p className="text-xs"><strong>💡 Consejo:</strong> {member.personalized_advice}</p>
        </div>
      )}
    </Card>
  );
}

export default TeamPerformanceSection;
