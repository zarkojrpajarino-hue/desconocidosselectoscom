import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Target, DollarSign, TrendingUp, Eye } from 'lucide-react';
import { toast } from 'sonner';
import type { AdCampaignPlan } from '@/types/ai-resources.types';

interface AdCampaignDisplayProps {
  plan: AdCampaignPlan;
}

export const AdCampaignDisplay = ({ plan }: AdCampaignDisplayProps) => {
  const copyFullPlan = () => {
    const text = `
PLAN DE CAMPAÑA DE ANUNCIOS PAGADOS
═══════════════════════════════════

💰 PRESUPUESTO RECOMENDADO:
€${plan.total_budget_recommended.min.toLocaleString()} - €${plan.total_budget_recommended.max.toLocaleString()} ${plan.total_budget_recommended.currency}

📊 PLATAFORMAS Y DISTRIBUCIÓN:
${plan.recommended_platforms.map(p => `
${p.platform} (${p.budget_allocation_percentage}%)
Por qué: ${p.why}
`).join('\n')}

🎯 TARGETING:
Demografía: ${plan.targeting.demographics}
Intereses: ${plan.targeting.interests.join(', ')}
Comportamientos: ${plan.targeting.behaviors.join(', ')}
Ubicaciones: ${plan.targeting.locations.join(', ')}

📢 CREATIVOS DE ANUNCIO:
${plan.ad_creatives.map((ad, i) => `
Anuncio ${i + 1} (${ad.format}):
Headline: ${ad.headline}
Description: ${ad.description}
CTA: ${ad.cta}
`).join('\n')}

📈 KPIs A TRACKEAR:
${plan.kpis_to_track.map(kpi => `• ${kpi}`).join('\n')}

🎯 RESULTADOS ESPERADOS:
${plan.expected_results}
    `.trim();
    
    navigator.clipboard.writeText(text);
    toast.success('Plan de campaña copiado');
  };
  
  const getPlatformIcon = (platform: string): string => {
    const icons: Record<string, string> = {
      'Meta Ads': '📘',
      'Google Ads': '🔍',
      'LinkedIn Ads': '💼',
      'TikTok Ads': '🎵',
      'Twitter Ads': '🐦',
    };
    return icons[platform] || '📢';
  };

  if (!plan?.recommended_platforms) {
    return <p className="text-muted-foreground">No hay plan de campaña generado.</p>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">📢 Plan de Campaña de Anuncios Pagados</h3>
          <p className="text-sm text-muted-foreground mt-1">Plan completo listo para implementar</p>
        </div>
        <Button onClick={copyFullPlan} variant="outline">
          <Copy className="w-4 h-4 mr-2" />
          Copiar Plan
        </Button>
      </div>
      
      <Card className="border-2 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">💰 Presupuesto Total Recomendado</p>
              <p className="text-3xl font-bold text-primary">
                €{plan.total_budget_recommended.min.toLocaleString()} - €{plan.total_budget_recommended.max.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">por mes</p>
            </div>
            <DollarSign className="w-16 h-16 text-primary/20" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Distribución por Plataforma
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {plan.recommended_platforms.map((platform, idx) => {
            const budgetMin = Math.round(plan.total_budget_recommended.min * platform.budget_allocation_percentage / 100);
            const budgetMax = Math.round(plan.total_budget_recommended.max * platform.budget_allocation_percentage / 100);
            
            return (
              <div key={idx} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getPlatformIcon(platform.platform)}</div>
                    <div>
                      <p className="font-semibold">{platform.platform}</p>
                      <p className="text-sm text-muted-foreground">
                        €{budgetMin.toLocaleString()} - €{budgetMax.toLocaleString()} ({platform.budget_allocation_percentage}%)
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{platform.budget_allocation_percentage}%</Badge>
                </div>
                
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                  <p className="text-xs font-medium text-primary mb-1">💡 Por qué:</p>
                  <p className="text-sm">{platform.why}</p>
                </div>
                
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary rounded-full h-2 transition-all"
                    style={{ width: `${platform.budget_allocation_percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Targeting Recomendado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">👥 Demografía:</p>
            <p className="text-sm bg-muted p-3 rounded">{plan.targeting.demographics}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium mb-2">💡 Intereses:</p>
            <div className="flex flex-wrap gap-2">
              {plan.targeting.interests.map((interest, idx) => (
                <Badge key={idx} variant="secondary">{interest}</Badge>
              ))}
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium mb-2">🎯 Comportamientos:</p>
            <div className="flex flex-wrap gap-2">
              {plan.targeting.behaviors.map((behavior, idx) => (
                <Badge key={idx} variant="outline">{behavior}</Badge>
              ))}
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium mb-2">📍 Ubicaciones:</p>
            <div className="flex flex-wrap gap-2">
              {plan.targeting.locations.map((location, idx) => (
                <Badge key={idx}>{location}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Creativos de Anuncio ({plan.ad_creatives.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {plan.ad_creatives.map((creative, idx) => (
            <div key={idx} className="border-l-4 border-primary pl-4 py-3 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Anuncio {idx + 1}</Badge>
                <Badge variant="outline">{creative.format}</Badge>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground mb-1">HEADLINE:</p>
                <p className="font-semibold">{creative.headline}</p>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground mb-1">DESCRIPTION:</p>
                <p className="text-sm">{creative.description}</p>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground mb-1">CTA:</p>
                <Button size="sm" className="pointer-events-none">{creative.cta}</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-5 h-5" />
              KPIs a Trackear
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {plan.kpis_to_track.map((kpi, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm">{kpi}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        <Card className="bg-secondary/10">
          <CardHeader>
            <CardTitle className="text-base">🎯 Resultados Esperados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{plan.expected_results}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
