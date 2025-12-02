// ============================================
// COMPONENTE: OPINIÓN SINCERA DE LA IA
// src/components/ai-analysis/HonestFeedbackSection.tsx
// ============================================

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Lock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
  Shield,
  Target,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { HonestFeedback, ToughDecision, Difficulty } from '@/types/ai-analysis.types';
import { useState } from 'react';

interface HonestFeedbackSectionProps {
  data: HonestFeedback;
}

export function HonestFeedbackSection({ data }: HonestFeedbackSectionProps) {
  return (
    <div className="space-y-6">
      {/* HEADER DE ADVERTENCIA */}
      <Card className="border-2 border-destructive bg-destructive/5">
        <CardHeader>
          <div className="flex items-start gap-4">
            <Lock className="w-10 h-10 text-destructive flex-shrink-0 mt-1" />
            <div className="flex-1">
              <CardTitle className="text-3xl text-destructive mb-2">
                🔥 Opinión Sincera de la IA
              </CardTitle>
              <CardDescription className="text-base">
                Feedback sin filtros. Solo datos duros y verdades incómodas.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="border-destructive">
            <Shield className="h-4 w-4" />
            <AlertTitle>Confidencial</AlertTitle>
            <AlertDescription>
              Este análisis es 100% privado. La IA te dirá las cosas como son, sin suavizar.
              Solo tú y los administradores pueden ver esta sección.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* EVALUACIÓN GENERAL */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="text-xl">Evaluación General</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-6 bg-muted rounded-lg">
            <p className="text-lg leading-relaxed">{data.overall_assessment}</p>
          </div>
        </CardContent>
      </Card>

      {/* LO QUE SÍ FUNCIONA */}
      <Card className="border-success">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-success">
            <CheckCircle2 className="w-6 h-6" />
            Lo que SÍ está funcionando
          </CardTitle>
          <CardDescription>
            {data.what_is_working.length} aspectos positivos identificados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {data.what_is_working.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 p-4 bg-success/10 rounded-lg border border-success/20">
                <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                <span className="text-sm leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* LO QUE NO FUNCIONA */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-destructive">
            <XCircle className="w-6 h-6" />
            Lo que NO está funcionando
          </CardTitle>
          <CardDescription>
            {data.what_is_not_working.length} problemas críticos identificados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {data.what_is_not_working.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <XCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <span className="text-sm leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* VERDADES DURAS */}
      <Card className="border-warning">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-warning">
            <AlertTriangle className="w-6 h-6" />
            Verdades Duras (pero necesarias)
          </CardTitle>
          <CardDescription>
            Cosas difíciles de escuchar, pero críticas para tu éxito
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {data.hard_truths.map((truth, idx) => (
              <li key={idx} className="flex items-start gap-3 p-4 bg-warning/10 rounded-lg border-l-4 border-warning">
                <AlertTriangle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                <span className="text-sm leading-relaxed font-medium">{truth}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* DECISIONES DIFÍCILES */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Flame className="w-8 h-8 text-destructive" />
          <div>
            <h2 className="text-2xl font-bold">Decisiones Difíciles que Debes Tomar</h2>
            <p className="text-muted-foreground">
              {data.tough_decisions.length} decisiones críticas requieren tu atención
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {data.tough_decisions.map((decision, idx) => (
            <ToughDecisionCard key={idx} decision={decision} index={idx + 1} />
          ))}
        </div>
      </div>

      <Separator className="my-8" />

      {/* ANÁLISIS SWOT */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Posición Competitiva (SWOT)</CardTitle>
          <CardDescription>Análisis completo de tu posición en el mercado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SWOTQuadrant
              title="Fortalezas"
              items={data.competitive_position.strengths}
              color="success"
              icon={<TrendingUp className="w-5 h-5" />}
            />
            <SWOTQuadrant
              title="Debilidades"
              items={data.competitive_position.weaknesses}
              color="destructive"
              icon={<TrendingDown className="w-5 h-5" />}
            />
            <SWOTQuadrant
              title="Oportunidades"
              items={data.competitive_position.opportunities}
              color="warning"
              icon={<Target className="w-5 h-5" />}
            />
            <SWOTQuadrant
              title="Amenazas"
              items={data.competitive_position.threats}
              color="muted"
              icon={<AlertCircle className="w-5 h-5" />}
            />
          </div>
        </CardContent>
      </Card>

      {/* RIESGOS EXISTENCIALES */}
      {data.existential_risks && data.existential_risks.length > 0 && (
        <Card className="border-2 border-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-6 h-6" />
              ⚠️ Riesgos Existenciales
            </CardTitle>
            <CardDescription>
              Amenazas que podrían poner en peligro la viabilidad del negocio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.existential_risks.map((risk, idx) => (
                <Alert key={idx} variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Riesgo {idx + 1}</AlertTitle>
                  <AlertDescription>{risk}</AlertDescription>
                </Alert>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* PUNTOS CIEGOS */}
      {data.blind_spots && data.blind_spots.length > 0 && (
        <Card className="border-warning">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-warning" />
              Puntos Ciegos Detectados
            </CardTitle>
            <CardDescription>
              Áreas que podrías estar pasando por alto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.blind_spots.map((spot, idx) => (
                <li key={idx} className="flex items-start gap-2 p-3 bg-warning/5 rounded-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-warning mt-2 flex-shrink-0" />
                  <span className="text-sm">{spot}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================
// COMPONENTE: TARJETA DE DECISIÓN DIFÍCIL
// ============================================

interface ToughDecisionCardProps {
  decision: ToughDecision;
  index: number;
}

function ToughDecisionCard({ decision, index }: ToughDecisionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="border-2 border-destructive">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="destructive" className="text-base px-3 py-1">
                Decisión #{index}
              </Badge>
              <DifficultyBadge difficulty={decision.difficulty} />
            </div>
            <CardTitle className="text-xl">{decision.decision}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4 pt-0">
          <Separator />

          {/* Por qué es necesaria */}
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">Por qué es necesaria:</h4>
            <p className="text-sm leading-relaxed">{decision.why_necessary}</p>
          </div>

          {/* Consecuencias si NO se hace */}
          <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-destructive" />
              Si NO lo haces:
            </h4>
            <p className="text-sm leading-relaxed">{decision.consequences_if_not_done}</p>
          </div>

          {/* Consecuencias si SÍ se hace */}
          <div className="p-4 bg-success/10 rounded-lg border border-success/20">
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Si SÍ lo haces:
            </h4>
            <p className="text-sm leading-relaxed">{decision.consequences_if_done}</p>
          </div>

          {/* Recomendación */}
          <div className="p-4 bg-primary/10 rounded-lg border-l-4 border-primary">
            <h4 className="font-semibold text-sm mb-2">💡 Recomendación de la IA:</h4>
            <p className="text-sm leading-relaxed">{decision.recommendation}</p>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-card rounded-lg border">
              <p className="text-xs text-muted-foreground mb-1">Timeline Estimado</p>
              <p className="font-semibold">{decision.estimated_timeline}</p>
            </div>
            <div className="p-3 bg-card rounded-lg border">
              <p className="text-xs text-muted-foreground mb-1">Probabilidad de Éxito</p>
              <p className="font-semibold">{decision.success_probability}%</p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ============================================
// COMPONENTE: CUADRANTE SWOT
// ============================================

interface SWOTQuadrantProps {
  title: string;
  items: string[];
  color: 'success' | 'destructive' | 'warning' | 'muted';
  icon: React.ReactNode;
}

function SWOTQuadrant({ title, items, color, icon }: SWOTQuadrantProps) {
  const colorClasses = {
    success: {
      border: 'border-success',
      bg: 'bg-success/5',
      text: 'text-success',
      bullet: 'bg-success',
    },
    destructive: {
      border: 'border-destructive',
      bg: 'bg-destructive/5',
      text: 'text-destructive',
      bullet: 'bg-destructive',
    },
    warning: {
      border: 'border-warning',
      bg: 'bg-warning/5',
      text: 'text-warning',
      bullet: 'bg-warning',
    },
    muted: {
      border: 'border-muted',
      bg: 'bg-muted',
      text: 'text-muted-foreground',
      bullet: 'bg-muted-foreground',
    },
  };

  const colors = colorClasses[color];

  return (
    <Card className={`${colors.border} ${colors.bg}`}>
      <CardHeader>
        <CardTitle className={`text-lg flex items-center gap-2 ${colors.text}`}>
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <div className={`w-1.5 h-1.5 rounded-full ${colors.bullet} mt-1.5 flex-shrink-0`} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const config = {
    hard: { color: 'bg-warning/10 text-warning border-warning', text: '🔥 Difícil' },
    very_hard: { color: 'bg-destructive/10 text-destructive border-destructive', text: '🔥🔥 Muy Difícil' },
    extremely_hard: { color: 'bg-destructive text-destructive-foreground', text: '🔥🔥🔥 Extremadamente Difícil' },
  };

  return (
    <Badge variant="outline" className={config[difficulty].color}>
      {config[difficulty].text}
    </Badge>
  );
}

export default HonestFeedbackSection;
