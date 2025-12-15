import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type ToolType = 
  | 'buyer_persona' 
  | 'customer_journey' 
  | 'growth_model' 
  | 'lead_scoring'
  | 'sales_playbook'
  | 'sales_simulator'
  | 'communication_guide'
  | 'opportunity_calculator'
  | 'brand_kit'
  | 'web_generator';

// Plan requirements for each tool
export const TOOL_PLAN_REQUIREMENTS: Record<ToolType, 'free' | 'starter' | 'professional' | 'enterprise'> = {
  buyer_persona: 'free',
  customer_journey: 'starter',
  growth_model: 'starter',
  lead_scoring: 'free',
  sales_playbook: 'professional',
  sales_simulator: 'professional',
  communication_guide: 'professional',
  opportunity_calculator: 'professional',
  brand_kit: 'professional',
  web_generator: 'professional'
};

export const useToolContent = (toolType: ToolType) => {
  const { user, currentOrganizationId, userOrganizations } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Verificar si el usuario es admin usando userOrganizations
  const currentUserRole = userOrganizations.find(
    org => org.organization_id === currentOrganizationId
  )?.role || 'member';
  const isAdmin = currentUserRole === 'admin';

  // Cargar contenido existente
  useEffect(() => {
    const fetchContent = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // Obtener organización del usuario
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();

        if (!userRole) {
          setLoading(false);
          return;
        }

        // Buscar contenido de la herramienta
        const { data, error } = await supabase
          .from('tool_contents')
          .select('*')
          .eq('organization_id', userRole.organization_id)
          .eq('tool_type', toolType)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching tool content:', error);
        }

        setContent(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [user, toolType]);

  const generateContent = async () => {
    if (!isAdmin) {
      toast.error('Solo los administradores pueden generar contenido');
      return;
    }

    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-tool-content', {
        body: { toolType }
      });

      if (error) throw error;

      if (data.success) {
        setContent(data.content);
        toast.success('¡Contenido generado exitosamente!');
      } else {
        throw new Error(data.error || 'Error al generar contenido');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Error al generar contenido. Intenta de nuevo.');
    } finally {
      setGenerating(false);
    }
  };

  return {
    content: content?.content,
    loading,
    generating,
    generateContent,
    hasContent: !!content,
    isAdmin
  };
};
