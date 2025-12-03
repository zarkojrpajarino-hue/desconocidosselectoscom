import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Copy, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { Influencer } from '@/types/ai-resources.types';

interface InfluencerListDisplayProps {
  influencers: Influencer[];
}

export const InfluencerListDisplay = ({ influencers }: InfluencerListDisplayProps) => {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };
  
  const copyOutreachMessage = (influencer: Influencer) => {
    navigator.clipboard.writeText(influencer.outreach_message_template);
    toast.success(`Mensaje para ${influencer.username} copiado`);
  };

  if (!influencers?.length) {
    return <p className="text-muted-foreground">No hay influencers generados.</p>;
  }
  
  const microInfluencers = influencers.filter(i => i.followers < 100000);
  const macroInfluencers = influencers.filter(i => i.followers >= 100000);
  
  const totalBudgetMin = influencers.reduce((sum, i) => sum + i.estimated_cost_per_post.min, 0);
  const totalBudgetMax = influencers.reduce((sum, i) => sum + i.estimated_cost_per_post.max, 0);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">👥 Lista de Influencers Recomendados</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {microInfluencers.length} micro + {macroInfluencers.length} macro influencers
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Presupuesto Total Estimado</p>
          <p className="text-lg font-bold text-primary">
            €{totalBudgetMin.toLocaleString()} - €{totalBudgetMax.toLocaleString()}
          </p>
        </div>
      </div>
      
      {microInfluencers.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h4 className="text-lg font-semibold">Micro-Influencers (10K-100K)</h4>
            <Badge variant="secondary">Mejor engagement</Badge>
          </div>
          
          <div className="grid gap-4">
            {microInfluencers.map((influencer, idx) => (
              <InfluencerCard key={idx} influencer={influencer} onCopyMessage={copyOutreachMessage} />
            ))}
          </div>
        </div>
      )}
      
      {macroInfluencers.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h4 className="text-lg font-semibold">Macro-Influencers (100K+)</h4>
            <Badge variant="secondary">Mayor alcance</Badge>
          </div>
          
          <div className="grid gap-4">
            {macroInfluencers.map((influencer, idx) => (
              <InfluencerCard key={idx} influencer={influencer} onCopyMessage={copyOutreachMessage} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const InfluencerCard = ({ influencer, onCopyMessage }: { 
  influencer: Influencer; 
  onCopyMessage: (inf: Influencer) => void;
}) => {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold">
              {influencer.username.slice(1, 3).toUpperCase()}
            </div>
            <div>
              <CardTitle className="text-lg">{influencer.username}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{influencer.platform}</Badge>
                <Badge>{influencer.category}</Badge>
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(influencer.profile_url, '_blank')}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Seguidores</p>
            <p className="text-xl font-bold">{formatNumber(influencer.followers)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Engagement</p>
            <p className="text-xl font-bold text-primary">{influencer.engagement_rate}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Costo/Post</p>
            <p className="text-lg font-bold">
              €{influencer.estimated_cost_per_post.min}-{influencer.estimated_cost_per_post.max}
            </p>
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium mb-2">👥 Audiencia:</p>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Edad: {influencer.audience_demographics.age_range}</p>
            <p>• Género: {influencer.audience_demographics.gender_split}</p>
            <p>• Top países: {influencer.audience_demographics.top_countries.join(', ')}</p>
          </div>
        </div>
        
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
          <p className="text-xs font-medium text-primary mb-1">💡 Por qué recomendado:</p>
          <p className="text-sm">{influencer.why_recommended}</p>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">📧 Mensaje de Contacto:</p>
            <Button size="sm" variant="ghost" onClick={() => onCopyMessage(influencer)}>
              <Copy className="w-4 h-4 mr-1" />
              Copiar
            </Button>
          </div>
          <div className="bg-muted p-3 rounded text-sm whitespace-pre-line">
            {influencer.outreach_message_template}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
