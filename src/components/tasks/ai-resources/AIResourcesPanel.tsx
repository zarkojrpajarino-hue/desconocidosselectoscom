import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { AIResourceType } from '@/types/ai-resources.types';

import { VideoScriptsDisplay } from './VideoScriptsDisplay';
import { InfluencerListDisplay } from './InfluencerListDisplay';
import { AdCampaignDisplay } from './AdCampaignDisplay';
import { SocialPostsDisplay } from './SocialPostsDisplay';
import { DesignBriefDisplay } from './DesignBriefDisplay';
import { OutreachTemplatesDisplay } from './OutreachTemplatesDisplay';
import { EmailSequencesDisplay } from './EmailSequencesDisplay';

interface AIResourcesPanelProps {
  taskId: string;
  resourceType: AIResourceType;
  taskTitle: string;
  taskDescription: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AIResourcesPanel = ({
  taskId,
  resourceType,
  taskTitle,
  taskDescription,
  open,
  onOpenChange
}: AIResourcesPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [resources, setResources] = useState<Record<string, unknown> | null>(null);
  const [currentType, setCurrentType] = useState<string>('');
  
  useEffect(() => {
    if (open && taskId) {
      loadExistingResources();
    }
  }, [open, taskId]);
  
  const loadExistingResources = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_task_resources')
        .select('*')
        .eq('task_id', taskId)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setResources(data.resources as Record<string, unknown>);
        setCurrentType(data.resource_type);
      } else {
        setResources(null);
        setCurrentType('');
      }
    } catch (error) {
      console.error('Error loading resources:', error);
    }
  };
  
  const generateResources = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-task-ai-resources', {
        body: {
          taskId,
          resourceType,
          taskTitle,
          taskDescription
        }
      });
      
      if (error) throw error;
      
      if (data?.error) {
        if (data.error.includes('Rate limit')) {
          toast.error('Límite de uso alcanzado. Intenta de nuevo más tarde.');
        } else if (data.error.includes('credits')) {
          toast.error('Créditos de IA agotados. Por favor, añade más créditos.');
        } else {
          throw new Error(data.error);
        }
        return;
      }
      
      setResources(data.resources);
      setCurrentType(resourceType);
      toast.success('¡Recursos generados exitosamente!');
    } catch (error) {
      console.error('Error generating resources:', error);
      toast.error('Error generando recursos. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };
  
  const renderResources = () => {
    if (!resources || !currentType) return null;
    
    switch (currentType) {
      case 'video_scripts':
        return <VideoScriptsDisplay scripts={(resources.video_scripts as never[]) || []} />;
      case 'influencer_list':
        return <InfluencerListDisplay influencers={(resources.influencer_list as never[]) || []} />;
      case 'ad_campaign':
        return <AdCampaignDisplay plan={resources as never} />;
      case 'social_posts':
        return <SocialPostsDisplay posts={(resources.social_post_ideas as never[]) || []} />;
      case 'design_brief':
        return <DesignBriefDisplay brief={resources as never} />;
      case 'outreach_templates':
        return <OutreachTemplatesDisplay templates={(resources.outreach_templates as never[]) || []} />;
      case 'email_sequences':
        return <EmailSequencesDisplay sequences={(resources.email_sequences as never[]) || []} />;
      default:
        return (
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-mono whitespace-pre-wrap">
              {JSON.stringify(resources, null, 2)}
            </p>
          </div>
        );
    }
  };

  const getResourceTypeLabel = (type: AIResourceType): string => {
    const labels: Record<AIResourceType, string> = {
      'video_scripts': 'Guiones de Video',
      'influencer_list': 'Lista de Influencers',
      'ad_campaign': 'Plan de Campaña',
      'social_posts': 'Posts de Redes',
      'design_brief': 'Brief de Diseño',
      'outreach_templates': 'Templates de Outreach',
      'email_sequences': 'Secuencias de Email'
    };
    return labels[type] || type;
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {getResourceTypeLabel(resourceType)}
          </DialogTitle>
          <DialogDescription>
            Para: {taskTitle}
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-lg font-medium mb-2">Generando recursos con IA...</p>
            <p className="text-sm text-muted-foreground">Esto puede tomar 15-30 segundos</p>
          </div>
        ) : resources ? (
          <div className="space-y-4">
            {renderResources()}
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={generateResources}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerar
              </Button>
              <Button onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No hay recursos generados aún</p>
            <p className="text-sm text-muted-foreground mb-6">
              Genera {getResourceTypeLabel(resourceType).toLowerCase()} personalizados con IA
            </p>
            <Button onClick={generateResources} size="lg">
              <Sparkles className="w-4 h-4 mr-2" />
              Generar Recursos con IA
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
