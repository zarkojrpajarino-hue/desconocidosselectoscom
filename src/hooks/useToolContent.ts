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

  // Cargar contenido existente y auto-generar si no existe
  useEffect(() => {
    const fetchAndAutoGenerate = async () => {
      if (!user || !currentOrganizationId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('tool_contents')
          .select('*')
          .eq('organization_id', currentOrganizationId)
          .eq('tool_type', toolType)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching tool content:', error);
        }

        if (data) {
          setContent(data);
          setLoading(false);
        } else {
          // Auto-generar si no existe contenido
          setLoading(false);
          setGenerating(true);
          
          try {
            const { data: generatedData, error: genError } = await supabase.functions.invoke('generate-tool-content', {
              body: { toolType }
            });

            if (genError) throw genError;

            if (generatedData?.success) {
              // Refetch para obtener el contenido guardado
              const { data: newContent } = await supabase
                .from('tool_contents')
                .select('*')
                .eq('organization_id', currentOrganizationId)
                .eq('tool_type', toolType)
                .maybeSingle();
              
              setContent(newContent);
            }
          } catch (genErr) {
            console.error('Error auto-generating tool content:', genErr);
          } finally {
            setGenerating(false);
          }
        }
      } catch (error) {
        console.error('Error:', error);
        setLoading(false);
      }
    };

    fetchAndAutoGenerate();
  }, [user, currentOrganizationId, toolType]);

  const generateContent = async () => {
    // Si ya existe contenido, solo admin puede regenerar
    if (content && !isAdmin) {
      toast.error('Solo el administrador puede regenerar el contenido');
      return;
    }

    // Si no existe contenido, cualquiera puede generar
    // Si existe contenido, solo admin puede regenerar (ya verificado arriba)

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

  // Determina si el usuario puede generar
  const canGenerate = !content || isAdmin;

  return {
    content: content?.content,
    loading,
    generating,
    generateContent,
    hasContent: !!content,
    isAdmin,
    canGenerate // Si no hay contenido, cualquiera puede generar; si hay, solo admin regenera
  };
};
