/**
 * @fileoverview Catálogo de herramientas empresariales premium para Enterprise
 * Permite seleccionar y generar hasta 5 herramientas adicionales personalizadas con IA
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sparkles, 
  Lock, 
  Check, 
  Loader2, 
  BarChart3, 
  Target, 
  Users, 
  TrendingUp,
  Shield,
  Puzzle,
  Lightbulb,
  Compass,
  Layers,
  FileText,
  Crown,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { toast } from 'sonner';

// Catálogo de herramientas empresariales disponibles
const ENTERPRISE_TOOLS_CATALOG = [
  {
    id: 'swot_analysis',
    icon: Shield,
    category: 'strategy'
  },
  {
    id: 'porter_five_forces',
    icon: Puzzle,
    category: 'strategy'
  },
  {
    id: 'business_model_canvas',
    icon: Layers,
    category: 'strategy'
  },
  {
    id: 'lean_canvas',
    icon: FileText,
    category: 'startup'
  },
  {
    id: 'value_proposition_canvas',
    icon: Target,
    category: 'marketing'
  },
  {
    id: 'competitor_matrix',
    icon: BarChart3,
    category: 'strategy'
  },
  {
    id: 'ansoff_matrix',
    icon: TrendingUp,
    category: 'growth'
  },
  {
    id: 'bcg_matrix',
    icon: Compass,
    category: 'strategy'
  },
  {
    id: 'pestel_analysis',
    icon: Lightbulb,
    category: 'strategy'
  },
  {
    id: 'okr_template_advanced',
    icon: Target,
    category: 'operations'
  },
  {
    id: 'stakeholder_map',
    icon: Users,
    category: 'operations'
  },
  {
    id: 'risk_assessment_matrix',
    icon: Shield,
    category: 'operations'
  }
];

const MAX_ENTERPRISE_TOOLS = 5;

interface GeneratedTool {
  id: string;
  tool_type: string;
  content: Record<string, unknown>;
  created_at: string;
}

export function EnterpriseToolsCatalog() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isEnterprise } = usePlanAccess();
  
  const [generatedTools, setGeneratedTools] = useState<GeneratedTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // Obtener organización y herramientas generadas
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Obtener organización
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();
        
        if (!userRole?.organization_id) {
          setLoading(false);
          return;
        }
        
        setOrganizationId(userRole.organization_id);
        
        // Obtener herramientas ya generadas (filtrar las del catálogo enterprise)
        const enterpriseToolIds = ENTERPRISE_TOOLS_CATALOG.map(t => t.id);
        const { data: tools } = await supabase
          .from('tool_contents')
          .select('id, tool_type, content, created_at')
          .eq('organization_id', userRole.organization_id)
          .in('tool_type', enterpriseToolIds);
        
        setGeneratedTools((tools as GeneratedTool[]) || []);
      } catch (error) {
        console.error('Error fetching enterprise tools:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  const isToolGenerated = (toolId: string) => {
    return generatedTools.some(t => t.tool_type === toolId);
  };

  const remainingSlots = MAX_ENTERPRISE_TOOLS - generatedTools.length;
  const usagePercentage = (generatedTools.length / MAX_ENTERPRISE_TOOLS) * 100;

  const handleGenerateTool = async (toolId: string) => {
    if (!isEnterprise) {
      toast.error(t('enterpriseTools.requiresEnterprise'));
      return;
    }
    
    if (remainingSlots <= 0) {
      toast.error(t('enterpriseTools.limitReached'));
      return;
    }
    
    if (isToolGenerated(toolId)) {
      toast.info(t('enterpriseTools.alreadyGenerated'));
      return;
    }
    
    setGenerating(toolId);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-enterprise-tool', {
        body: { toolType: toolId }
      });
      
      if (error) throw error;
      
      if (data?.success) {
        // Recargar herramientas
        const { data: tools } = await supabase
          .from('tool_contents')
          .select('id, tool_type, content, created_at')
          .eq('organization_id', organizationId)
          .in('tool_type', ENTERPRISE_TOOLS_CATALOG.map(t => t.id));
        
        setGeneratedTools((tools as GeneratedTool[]) || []);
        toast.success(t('enterpriseTools.generateSuccess'));
      } else {
        throw new Error(data?.error || 'Error generating tool');
      }
    } catch (error) {
      console.error('Error generating tool:', error);
      toast.error(t('enterpriseTools.generateError'));
    } finally {
      setGenerating(null);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      strategy: 'bg-primary/10 text-primary',
      marketing: 'bg-violet-500/10 text-violet-500',
      growth: 'bg-emerald-500/10 text-emerald-500',
      startup: 'bg-amber-500/10 text-amber-500',
      operations: 'bg-blue-500/10 text-blue-500'
    };
    return colors[category] || 'bg-muted text-muted-foreground';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con contador */}
      <Card className="bg-gradient-to-r from-primary/5 to-violet-500/5 border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Crown className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                  {t('enterpriseTools.title')}
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                    Enterprise
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {t('enterpriseTools.description')}
                </CardDescription>
              </div>
            </div>
            
            {/* Contador de uso */}
            <div className="bg-card rounded-lg p-3 md:p-4 border min-w-[200px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {t('enterpriseTools.usage')}
                </span>
                <span className="font-semibold text-foreground">
                  {generatedTools.length}/{MAX_ENTERPRISE_TOOLS}
                </span>
              </div>
              <Progress value={usagePercentage} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {remainingSlots > 0 
                  ? t('enterpriseTools.slotsRemaining', { count: remainingSlots })
                  : t('enterpriseTools.noSlotsRemaining')
                }
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Catálogo de herramientas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ENTERPRISE_TOOLS_CATALOG.map((tool) => {
          const Icon = tool.icon;
          const isGenerated = isToolGenerated(tool.id);
          const isGenerating = generating === tool.id;
          const canGenerate = isEnterprise && remainingSlots > 0 && !isGenerated;
          
          return (
            <Card 
              key={tool.id} 
              className={`transition-all duration-300 ${
                isGenerated 
                  ? 'border-primary/50 bg-primary/5' 
                  : canGenerate 
                    ? 'hover:border-primary/30 hover:shadow-md cursor-pointer' 
                    : 'opacity-60'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Icon className="w-5 h-5 text-foreground" />
                  </div>
                  <Badge className={getCategoryColor(tool.category)}>
                    {t(`enterpriseTools.categories.${tool.category}`)}
                  </Badge>
                </div>
                <CardTitle className="text-base mt-3">
                  {t(`enterpriseTools.tools.${tool.id}.name`)}
                </CardTitle>
                <CardDescription className="text-sm line-clamp-2">
                  {t(`enterpriseTools.tools.${tool.id}.description`)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isGenerated ? (
                  <Button 
                    variant="outline" 
                    className="w-full gap-2 border-primary/30 text-primary"
                    disabled
                  >
                    <Check className="w-4 h-4" />
                    {t('enterpriseTools.generated')}
                  </Button>
                ) : !isEnterprise ? (
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    disabled
                  >
                    <Lock className="w-4 h-4" />
                    {t('enterpriseTools.requiresEnterprise')}
                  </Button>
                ) : remainingSlots <= 0 ? (
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    disabled
                  >
                    <Lock className="w-4 h-4" />
                    {t('enterpriseTools.limitReached')}
                  </Button>
                ) : (
                  <Button 
                    className="w-full gap-2"
                    onClick={() => handleGenerateTool(tool.id)}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('enterpriseTools.generating')}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        {t('enterpriseTools.generate')}
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info adicional */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {t('enterpriseTools.infoTitle')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('enterpriseTools.infoDescription')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
