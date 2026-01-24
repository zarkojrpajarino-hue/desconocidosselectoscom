import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BrandKit {
  id: string;
  organization_id: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  neutral_light: string;
  neutral_dark: string;
  font_heading: string;
  font_body: string;
  font_heading_url: string | null;
  font_body_url: string | null;
  tone_of_voice: string;
  tone_description: string | null;
  logo_url: string | null;
  logo_concept: string | null;
  industry: string | null;
  target_audience: string | null;
  brand_personality: string[];
  created_at: string;
  updated_at: string;
}

export interface ColorPalette {
  id: string;
  name: string;
  industry: string;
  description: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  neutral_light: string;
  neutral_dark: string;
  psychology: string | null;
}

export interface BrandKitInput {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  neutral_light?: string;
  neutral_dark?: string;
  font_heading: string;
  font_body: string;
  font_heading_url?: string;
  font_body_url?: string;
  tone_of_voice: string;
  tone_description?: string;
  logo_url?: string;
  logo_concept?: string;
  industry?: string;
  target_audience?: string;
  brand_personality?: string[];
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const brandKitKeys = {
  all: ['brandKits'] as const,
  brandKit: (organizationId: string | null) =>
    [...brandKitKeys.all, 'brandKit', { organizationId }] as const,
  palettes: () => [...brandKitKeys.all, 'palettes'] as const,
};

// ============================================================================
// FETCH FUNCTIONS
// ============================================================================

/**
 * Fetch brand kit for organization
 */
async function fetchBrandKit(
  organizationId: string | null
): Promise<BrandKit | null> {
  if (!organizationId) return null;

  const { data, error } = await supabase
    .from('brand_kits')
    .select('*')
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (error) throw error;

  // Parse brand_personality si viene como string
  if (data) {
    return {
      ...data,
      brand_personality: Array.isArray(data.brand_personality)
        ? data.brand_personality
        : [],
    } as BrandKit;
  }

  return null;
}

/**
 * Fetch all color palettes
 */
async function fetchColorPalettes(): Promise<ColorPalette[]> {
  const { data, error } = await supabase
    .from('brand_color_palettes')
    .select('*')
    .order('industry');

  if (error) throw error;
  return data || [];
}

// Hook para cargar Google Fonts dinámicamente
export const useGoogleFonts = (fonts: string[]) => {
  useEffect(() => {
    if (fonts.length === 0) return;

    const uniqueFonts = [...new Set(fonts.filter(Boolean))];
    const fontQuery = uniqueFonts.map(f => f.replace(/\s+/g, '+')).join('|');
    
    const existingLink = document.querySelector(`link[href*="fonts.googleapis.com/css?family=${fontQuery}"]`);
    if (existingLink) return;

    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css?family=${fontQuery}:400,500,600,700&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [fonts.join(',')]);
};

export const useBrandKit = (organizationId: string | null) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query for brand kit
  const {
    data: brandKit = null,
    isLoading: brandKitLoading,
    error: brandKitError,
    refetch: refetchBrandKit,
  } = useQuery({
    queryKey: brandKitKeys.brandKit(organizationId),
    queryFn: () => fetchBrandKit(organizationId),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes - brand kits don't change frequently
    onError: (error: Error) => {
      console.error('Error loading brand kit:', error);
    },
  });

  // Query for color palettes
  const {
    data: palettes = [],
    isLoading: palettesLoading,
  } = useQuery({
    queryKey: brandKitKeys.palettes(),
    queryFn: fetchColorPalettes,
    staleTime: Infinity, // Palettes are static, cache indefinitely
    onError: (error: Error) => {
      console.error('Error loading palettes:', error);
    },
  });

  // Cargar fuentes cuando hay brand kit
  useGoogleFonts(brandKit ? [brandKit.font_heading, brandKit.font_body] : []);

  const loading = brandKitLoading || palettesLoading;

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: BrandKitInput) => {
      if (!organizationId) {
        throw new Error('No hay organización seleccionada');
      }

      const { data: newKit, error } = await supabase
        .from('brand_kits')
        .insert({
          organization_id: organizationId,
          ...data,
          brand_personality: data.brand_personality || [],
        })
        .select()
        .single();

      if (error) throw error;

      return {
        ...newKit,
        brand_personality: Array.isArray(newKit.brand_personality)
          ? newKit.brand_personality
          : [],
      } as BrandKit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: brandKitKeys.brandKit(organizationId),
      });
      toast({
        title: '¡Brand Kit creado!',
        description: 'Tu identidad de marca ha sido guardada',
      });
    },
    onError: (error: Error) => {
      console.error('Error creating brand kit:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el brand kit',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<BrandKitInput>) => {
      if (!brandKit) throw new Error('No brand kit to update');

      const { data, error } = await supabase
        .from('brand_kits')
        .update(updates)
        .eq('id', brandKit.id)
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        brand_personality: Array.isArray(data.brand_personality)
          ? data.brand_personality
          : [],
      } as BrandKit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: brandKitKeys.brandKit(organizationId),
      });
      toast({
        title: 'Brand Kit actualizado',
        description: 'Los cambios han sido guardados',
      });
    },
    onError: (error: Error) => {
      console.error('Error updating brand kit:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el brand kit',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!brandKit) throw new Error('No brand kit to delete');

      const { error } = await supabase
        .from('brand_kits')
        .delete()
        .eq('id', brandKit.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: brandKitKeys.brandKit(organizationId),
      });
      toast({
        title: 'Brand Kit eliminado',
        description: 'Tu identidad de marca ha sido eliminada',
      });
    },
    onError: (error: Error) => {
      console.error('Error deleting brand kit:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el brand kit',
        variant: 'destructive',
      });
    },
  });

  const getPalettesByIndustry = (industry: string): ColorPalette[] => {
    return palettes.filter((p) => p.industry === industry);
  };

  const applyPalette = async (palette: ColorPalette): Promise<void> => {
    const updates = {
      primary_color: palette.primary_color,
      secondary_color: palette.secondary_color,
      accent_color: palette.accent_color,
      neutral_light: palette.neutral_light,
      neutral_dark: palette.neutral_dark,
    };

    if (brandKit) {
      updateMutation.mutate(updates);
    } else {
      createMutation.mutate({
        ...updates,
        font_heading: 'Montserrat',
        font_body: 'Open Sans',
        tone_of_voice: 'professional',
      });
    }
  };

  return {
    // Data
    brandKit,
    palettes,
    loading,
    error: brandKitError as Error | null,

    // Actions
    createBrandKit: (data: BrandKitInput) => createMutation.mutateAsync(data),
    updateBrandKit: (updates: Partial<BrandKitInput>) => updateMutation.mutateAsync(updates),
    deleteBrandKit: () => deleteMutation.mutateAsync(),
    getPalettesByIndustry,
    applyPalette,
    refetch: refetchBrandKit,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

// ============================================================================
// AI GENERATION HOOK
// ============================================================================

/**
 * Hook para generar brand kit con IA
 *
 * @example
 * const { generateBrandKit, isGenerating } = useGenerateBrandKit();
 */
export const useGenerateBrandKit = () => {
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async (params: {
      industry: string;
      businessName: string;
      targetAudience: string;
      brandPersonality: string[];
      countryCode?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('generate-brand-kit', {
        body: params,
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      return data as BrandKitInput;
    },
    onError: (error: Error) => {
      console.error('Error generating brand kit:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo generar el brand kit',
        variant: 'destructive',
      });
    },
  });

  return {
    generateBrandKit: (params: {
      industry: string;
      businessName: string;
      targetAudience: string;
      brandPersonality: string[];
      countryCode?: string;
    }) => generateMutation.mutateAsync(params),
    generating: generateMutation.isPending,
    isGenerating: generateMutation.isPending,
  };
};
