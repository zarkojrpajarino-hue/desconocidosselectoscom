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
  | 'opportunity_calculator';

// Plan requirements for each tool
export const TOOL_PLAN_REQUIREMENTS: Record<ToolType, 'free' | 'starter' | 'professional' | 'enterprise'> = {
  buyer_persona: 'free',
  customer_journey: 'free',
  growth_model: 'free',
  lead_scoring: 'free',
  sales_playbook: 'professional',
  sales_simulator: 'professional',
  communication_guide: 'professional',
  opportunity_calculator: 'professional'
};

export const useToolContent = (toolType: ToolType) => {
  const { user } = useAuth();
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Verificar si el usuario es admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      setIsAdmin(data?.role === 'admin');
    };

    checkAdmin();
  }, [user]);

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
