import { useState, useEffect, useCallback } from 'react';
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
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [palettes, setPalettes] = useState<ColorPalette[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Cargar fuentes cuando hay brand kit
  useGoogleFonts(brandKit ? [brandKit.font_heading, brandKit.font_body] : []);

  const loadBrandKit = useCallback(async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('brand_kits')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error) throw error;
      
      // Parse brand_personality si viene como string
      if (data) {
        const parsed = {
          ...data,
          brand_personality: Array.isArray(data.brand_personality) 
            ? data.brand_personality 
            : []
        };
        setBrandKit(parsed as BrandKit);
      } else {
        setBrandKit(null);
      }
    } catch (error) {
      console.error('Error loading brand kit:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const loadPalettes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('brand_color_palettes')
        .select('*')
        .order('industry');

      if (error) throw error;
      setPalettes(data || []);
    } catch (error) {
      console.error('Error loading palettes:', error);
    }
  }, []);

  useEffect(() => {
    loadBrandKit();
    loadPalettes();
  }, [loadBrandKit, loadPalettes]);

  const createBrandKit = async (data: BrandKitInput): Promise<BrandKit | null> => {
    if (!organizationId) {
      toast({
        title: 'Error',
        description: 'No hay organización seleccionada',
        variant: 'destructive',
      });
      return null;
    }

    try {
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

      const parsed = {
        ...newKit,
        brand_personality: Array.isArray(newKit.brand_personality) 
          ? newKit.brand_personality 
          : []
      } as BrandKit;

      setBrandKit(parsed);
      toast({
        title: '¡Brand Kit creado!',
        description: 'Tu identidad de marca ha sido guardada',
      });

      return parsed;
    } catch (error) {
      console.error('Error creating brand kit:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el brand kit',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateBrandKit = async (updates: Partial<BrandKitInput>): Promise<BrandKit | null> => {
    if (!brandKit) return null;

    try {
      const { data, error } = await supabase
        .from('brand_kits')
        .update(updates)
        .eq('id', brandKit.id)
        .select()
        .single();

      if (error) throw error;

      const parsed = {
        ...data,
        brand_personality: Array.isArray(data.brand_personality) 
          ? data.brand_personality 
          : []
      } as BrandKit;

      setBrandKit(parsed);
      toast({
        title: 'Brand Kit actualizado',
        description: 'Los cambios han sido guardados',
      });

      return parsed;
    } catch (error) {
      console.error('Error updating brand kit:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el brand kit',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteBrandKit = async (): Promise<boolean> => {
    if (!brandKit) return false;

    try {
      const { error } = await supabase
        .from('brand_kits')
        .delete()
        .eq('id', brandKit.id);

      if (error) throw error;

      setBrandKit(null);
      toast({
        title: 'Brand Kit eliminado',
        description: 'Tu identidad de marca ha sido eliminada',
      });

      return true;
    } catch (error) {
      console.error('Error deleting brand kit:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el brand kit',
        variant: 'destructive',
      });
      return false;
    }
  };

  const getPalettesByIndustry = (industry: string): ColorPalette[] => {
    return palettes.filter((p) => p.industry === industry);
  };

  const applyPalette = async (palette: ColorPalette): Promise<BrandKit | null> => {
    const updates = {
      primary_color: palette.primary_color,
      secondary_color: palette.secondary_color,
      accent_color: palette.accent_color,
      neutral_light: palette.neutral_light,
      neutral_dark: palette.neutral_dark,
    };

    if (brandKit) {
      return updateBrandKit(updates);
    } else {
      return createBrandKit({
        ...updates,
        font_heading: 'Montserrat',
        font_body: 'Open Sans',
        tone_of_voice: 'professional',
      });
    }
  };

  return {
    brandKit,
    palettes,
    loading,
    createBrandKit,
    updateBrandKit,
    deleteBrandKit,
    getPalettesByIndustry,
    applyPalette,
    refetch: loadBrandKit,
  };
};

// Hook para generar brand kit con IA
export const useGenerateBrandKit = () => {
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const generateBrandKit = async (params: {
    industry: string;
    businessName: string;
    targetAudience: string;
    brandPersonality: string[];
    countryCode?: string;
  }): Promise<BrandKitInput | null> => {
    setGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-brand-kit', {
        body: params,
      });

      if (error) throw error;
      
      if (data.error) {
        throw new Error(data.error);
      }

      return data as BrandKitInput;
    } catch (error) {
      console.error('Error generating brand kit:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo generar el brand kit',
        variant: 'destructive',
      });
      return null;
    } finally {
      setGenerating(false);
    }
  };

  return { generateBrandKit, generating };
};
