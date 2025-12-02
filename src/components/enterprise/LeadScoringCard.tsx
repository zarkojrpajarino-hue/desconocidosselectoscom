import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { 
  Flame, Thermometer, Snowflake, Target, 
  TrendingUp, Phone, Mail, Calendar 
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LeadScore {
  lead_id: string;
  lead_name: string;
  company: string;
  total_score: number;
  fit_score: number;
  behavior_score: number;
  engagement_score: number;
  classification: 'hot' | 'warm' | 'cold';
  next_best_action: string;
  probability_to_close: number;
}

const classificationConfig = {
  hot: { color: 'text-rose-600', bg: 'bg-rose-500/10', icon: Flame, label: 'Caliente' },
  warm: { color: 'text-amber-600', bg: 'bg-amber-500/10', icon: Thermometer, label: 'Tibio' },
  cold: { color: 'text-blue-600', bg: 'bg-blue-500/10', icon: Snowflake, label: 'Frío' },
};

const actionIcons: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  default: Target,
};

export function LeadScoringCard() {
  const { organizationId } = useCurrentOrganization();
  const [data, setData] = useState<LeadScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchLeadScores() {
      if (!organizationId) return;
      try {
        setLoading(true);
        const { data: scores, error: scoresError } = await supabase
          .from('lead_scores')
          .select(`
            *,
            leads:lead_id (name, company)
          `)
          .eq('organization_id', organizationId)
          .order('total_score', { ascending: false })
          .limit(10);

        if (scoresError) throw scoresError;

        const formattedScores: LeadScore[] = (scores || []).map((score: any) => ({
          lead_id: score.lead_id,
          lead_name: score.leads?.name || 'Sin nombre',
          company: score.leads?.company || 'Sin empresa',
          total_score: score.total_score || 0,
          fit_score: score.fit_score || 0,
          behavior_score: score.behavior_score || 0,
          engagement_score: score.engagement_score || 0,
          classification: score.classification || 'cold',
          next_best_action: score.next_best_action || 'Contactar',
          probability_to_close: score.probability_to_close || 0,
        }));

        setData(formattedScores);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    fetchLeadScores();
  }, [organizationId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <p className="text-destructive text-center">Error cargando lead scoring</p>
        </CardContent>
      </Card>
    );
  }

  const leads = data || [];
  const hotLeads = leads.filter(l => l.classification === 'hot').length;
  const warmLeads = leads.filter(l => l.classification === 'warm').length;
  const avgScore = leads.length > 0 
    ? Math.round(leads.reduce((sum, l) => sum + l.total_score, 0) / leads.length) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Lead Scoring</h2>
          <p className="text-muted-foreground">Puntuación inteligente de leads</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-rose-600">{hotLeads}</p>
            <p className="text-muted-foreground">Calientes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{warmLeads}</p>
            <p className="text-muted-foreground">Tibios</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{avgScore}</p>
            <p className="text-muted-foreground">Score Promedio</p>
          </div>
        </div>
      </div>

      {/* Leads Grid */}
      {leads.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No hay leads con puntuación calculada
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {leads.map((lead) => (
            <LeadScoreCard key={lead.lead_id} lead={lead} />
          ))}
        </div>
      )}
    </div>
  );
}

function LeadScoreCard({ lead }: { lead: LeadScore }) {
  const config = classificationConfig[lead.classification] || classificationConfig.cold;
  const ClassIcon = config.icon;
  const ActionIcon = actionIcons[lead.next_best_action?.toLowerCase()] || actionIcons.default;

  return (
    <Card className={`${config.bg} border-transparent`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">{lead.lead_name}</CardTitle>
            <p className="text-sm text-muted-foreground">{lead.company}</p>
          </div>
          <Badge variant="outline" className={config.color}>
            <ClassIcon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Principal */}
        <div className="flex items-center justify-between">
          <span className={`text-4xl font-bold ${config.color}`}>
            {lead.total_score}
          </span>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Probabilidad cierre</p>
            <p className="text-lg font-semibold">{lead.probability_to_close}%</p>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-2">
          <TooltipProvider>
            <div className="flex justify-between text-xs">
              <Tooltip>
                <TooltipTrigger className="flex items-center gap-1">
                  <span>Fit</span>
                  <span className="font-medium">{lead.fit_score}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Qué tan bien encaja con tu cliente ideal</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger className="flex items-center gap-1">
                  <span>Comportamiento</span>
                  <span className="font-medium">{lead.behavior_score}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Acciones realizadas en tu sitio/app</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger className="flex items-center gap-1">
                  <span>Engagement</span>
                  <span className="font-medium">{lead.engagement_score}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Nivel de interacción con tu equipo</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
          <Progress value={lead.total_score} className="h-2" />
        </div>

        {/* Next Best Action */}
        <div className="flex items-center gap-2 p-2 rounded-md bg-background/50">
          <ActionIcon className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Siguiente acción:</span>
          <span className="text-sm text-muted-foreground">{lead.next_best_action}</span>
        </div>
      </CardContent>
    </Card>
  );
}
