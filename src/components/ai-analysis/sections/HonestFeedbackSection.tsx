// ============================================
// SECCIÓN OPINIÓN SINCERA DE LA IA
// ============================================

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Shield,
  Eye,
  Target,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import type { HonestFeedback } from '@/types/ai-analysis.types';

interface HonestFeedbackSectionProps {
  data: HonestFeedback;
}

export function HonestFeedbackSection({ data }: HonestFeedbackSectionProps) {
  if (!data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No hay datos de feedback disponibles
        </CardContent>
      </Card>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'extremely_hard': return 'bg-red-500 text-white';
      case 'very_hard': return 'bg-orange-500 text-white';
      case 'hard': return 'bg-yellow-500 text-black';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'extremely_hard': return 'Extremadamente difícil';
      case 'very_hard': return 'Muy difícil';
      case 'hard': return 'Difícil';
      default: return difficulty;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Assessment */}
      <Card className="bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10 border-2 border-red-500/30">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
            🔥 Opinión Sincera de la IA
          </CardTitle>
          <CardDescription>
            Sin filtros, sin endulzar. La verdad sobre tu negocio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-card rounded-lg border">
            <p className="text-sm md:text-base leading-relaxed">{data.overall_assessment}</p>
          </div>
        </CardContent>
      </Card>

      {/* What's Working vs Not Working */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* What's Working */}
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Lo que Funciona
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.what_is_working && data.what_is_working.length > 0 ? (
              <ul className="space-y-2">
                {data.what_is_working.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">No hay datos disponibles</p>
            )}
          </CardContent>
        </Card>

        {/* What's Not Working */}
        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Lo que NO Funciona
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.what_is_not_working && data.what_is_not_working.length > 0 ? (
              <ul className="space-y-2">
                {data.what_is_not_working.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-red-500 mt-0.5">✗</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">No hay datos disponibles</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hard Truths */}
      {data.hard_truths && data.hard_truths.length > 0 && (
        <Card className="border-orange-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Verdades Difíciles
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Cosas que quizás no quieras escuchar, pero necesitas saber
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.hard_truths.map((truth, idx) => (
                <div key={idx} className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <p className="text-sm font-medium">{truth}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tough Decisions */}
      {data.tough_decisions && data.tough_decisions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              Decisiones Difíciles que Debes Tomar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.tough_decisions.map((decision, idx) => (
                <div key={idx} className="p-4 bg-muted/50 rounded-lg border">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-3">
                    <h4 className="font-semibold text-sm md:text-base">{decision.decision}</h4>
                    <Badge className={getDifficultyColor(decision.difficulty)} variant="outline">
                      {getDifficultyText(decision.difficulty)}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">{decision.why_necessary}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="p-2 bg-red-500/10 rounded-lg">
                      <p className="font-medium text-red-600 mb-1">Si NO lo haces:</p>
                      <p className="text-xs md:text-sm">{decision.consequences_if_not_done}</p>
                    </div>
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <p className="font-medium text-green-600 mb-1">Si lo haces:</p>
                      <p className="text-xs md:text-sm">{decision.consequences_if_done}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Recomendación:</p>
                        <p className="text-sm font-medium">{decision.recommendation}</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-muted-foreground">
                          ⏱️ {decision.estimated_timeline}
                        </span>
                        <span className="text-muted-foreground">
                          📊 {decision.success_probability}% prob. éxito
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SWOT Analysis */}
      {data.competitive_position && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              Análisis DAFO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="p-3 md:p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <h4 className="font-semibold text-green-600 mb-2 flex items-center gap-2 text-sm md:text-base">
                  <TrendingUp className="w-4 h-4" />
                  Fortalezas
                </h4>
                <ul className="space-y-1">
                  {data.competitive_position.strengths?.map((s, idx) => (
                    <li key={idx} className="text-xs md:text-sm flex items-start gap-1.5">
                      <span className="text-green-500">+</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="p-3 md:p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                <h4 className="font-semibold text-red-600 mb-2 flex items-center gap-2 text-sm md:text-base">
                  <TrendingDown className="w-4 h-4" />
                  Debilidades
                </h4>
                <ul className="space-y-1">
                  {data.competitive_position.weaknesses?.map((w, idx) => (
                    <li key={idx} className="text-xs md:text-sm flex items-start gap-1.5">
                      <span className="text-red-500">-</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Opportunities */}
              <div className="p-3 md:p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <h4 className="font-semibold text-blue-600 mb-2 flex items-center gap-2 text-sm md:text-base">
                  <Lightbulb className="w-4 h-4" />
                  Oportunidades
                </h4>
                <ul className="space-y-1">
                  {data.competitive_position.opportunities?.map((o, idx) => (
                    <li key={idx} className="text-xs md:text-sm flex items-start gap-1.5">
                      <span className="text-blue-500">★</span>
                      {o}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Threats */}
              <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                <h4 className="font-semibold text-orange-600 mb-2 flex items-center gap-2 text-sm md:text-base">
                  <AlertTriangle className="w-4 h-4" />
                  Amenazas
                </h4>
                <ul className="space-y-1">
                  {data.competitive_position.threats?.map((t, idx) => (
                    <li key={idx} className="text-xs md:text-sm flex items-start gap-1.5">
                      <span className="text-orange-500">⚠</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existential Risks & Blind Spots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Existential Risks */}
        {data.existential_risks && data.existential_risks.length > 0 && (
          <Card className="border-red-500/50 bg-red-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                🚨 Riesgos Existenciales
              </CardTitle>
              <CardDescription className="text-xs">
                Amenazas que podrían acabar con tu negocio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.existential_risks.map((risk, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm p-2 bg-red-500/10 rounded-lg">
                    <span className="text-red-500 font-bold">!</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Blind Spots */}
        {data.blind_spots && data.blind_spots.length > 0 && (
          <Card className="border-purple-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Eye className="w-5 h-5 text-purple-500" />
                Puntos Ciegos
              </CardTitle>
              <CardDescription className="text-xs">
                Cosas que probablemente no estás viendo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.blind_spots.map((spot, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm p-2 bg-purple-500/10 rounded-lg">
                    <span className="text-purple-500">👁️</span>
                    <span>{spot}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}