import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useBrandKit, useColorPalettes, useGenerateBrandKit } from '@/hooks/useBrandKit';
import type { BrandKit, ColorPalette, BrandKitInput } from '@/hooks/useBrandKit';
import { createWrapper } from '../test-utils';

// Mock Supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    })),
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

describe('useBrandKit Hook', () => {
  const mockOrganizationId = 'org-123';

  const mockBrandKit: BrandKit = {
    id: 'brand-123',
    organization_id: mockOrganizationId,
    primary_color: '#FF5733',
    secondary_color: '#C70039',
    accent_color: '#900C3F',
    neutral_light: '#F5F5F5',
    neutral_dark: '#333333',
    font_heading: 'Inter',
    font_body: 'Roboto',
    font_heading_url: null,
    font_body_url: null,
    tone_of_voice: 'professional',
    tone_description: 'Corporate and trustworthy',
    logo_url: null,
    logo_concept: null,
    industry: 'technology',
    target_audience: 'B2B professionals',
    brand_personality: ['innovative', 'trustworthy'],
    created_at: '2026-01-20T00:00:00Z',
    updated_at: '2026-01-20T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnThis();
    mockEq.mockReturnThis();
    mockMaybeSingle.mockReturnThis();
    mockInsert.mockReturnThis();
    mockUpdate.mockReturnThis();
    mockDelete.mockReturnThis();
  });

  describe('useBrandKit - Fetching', () => {
    it('should fetch brand kit successfully', async () => {
      mockMaybeSingle.mockResolvedValueOnce({
        data: mockBrandKit,
        error: null,
      });

      const { result } = renderHook(() => useBrandKit(mockOrganizationId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.brandKit).toEqual(mockBrandKit);
      expect(result.current.error).toBeNull();
    });

    it('should return null when organizationId is null', async () => {
      const { result } = renderHook(() => useBrandKit(null), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.brandKit).toBeNull();
    });

    it('should return null when brand kit does not exist', async () => {
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const { result } = renderHook(() => useBrandKit(mockOrganizationId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.brandKit).toBeNull();
    });

    it('should handle fetch errors', async () => {
      const error = new Error('Database error');
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error,
      });

      const { result } = renderHook(() => useBrandKit(mockOrganizationId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });

    it('should parse brand_personality array correctly', async () => {
      mockMaybeSingle.mockResolvedValueOnce({
        data: {
          ...mockBrandKit,
          brand_personality: ['innovative', 'trustworthy'],
        },
        error: null,
      });

      const { result } = renderHook(() => useBrandKit(mockOrganizationId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.brandKit?.brand_personality).toEqual([
        'innovative',
        'trustworthy',
      ]);
    });
  });

  describe('useBrandKit - Create Mutation', () => {
    it('should create brand kit successfully', async () => {
      const newBrandKit: BrandKitInput = {
        primary_color: '#FF5733',
        secondary_color: '#C70039',
        accent_color: '#900C3F',
        font_heading: 'Inter',
        font_body: 'Roboto',
        tone_of_voice: 'professional',
      };

      mockMaybeSingle.mockResolvedValueOnce({
        data: null, // No existing brand kit
        error: null,
      });

      mockInsert.mockResolvedValueOnce({
        data: { ...mockBrandKit, ...newBrandKit },
        error: null,
      });

      const { result } = renderHook(() => useBrandKit(mockOrganizationId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.createBrandKit(newBrandKit);
      });

      await waitFor(() => {
        expect(result.current.isCreating).toBe(false);
      });

      expect(mockInsert).toHaveBeenCalledWith({
        ...newBrandKit,
        organization_id: mockOrganizationId,
      });
    });

    it('should handle create errors', async () => {
      const error = new Error('Insert failed');

      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      mockInsert.mockResolvedValueOnce({
        data: null,
        error,
      });

      const { result } = renderHook(() => useBrandKit(mockOrganizationId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(
          result.current.createBrandKit({
            primary_color: '#FF5733',
            secondary_color: '#C70039',
            accent_color: '#900C3F',
            font_heading: 'Inter',
            font_body: 'Roboto',
            tone_of_voice: 'professional',
          })
        ).rejects.toThrow('Insert failed');
      });
    });
  });

  describe('useBrandKit - Update Mutation', () => {
    it('should update brand kit successfully', async () => {
      const updates: Partial<BrandKitInput> = {
        primary_color: '#00FF00',
        tone_of_voice: 'casual',
      };

      mockMaybeSingle.mockResolvedValueOnce({
        data: mockBrandKit,
        error: null,
      });

      mockUpdate.mockResolvedValueOnce({
        data: { ...mockBrandKit, ...updates },
        error: null,
      });

      const { result } = renderHook(() => useBrandKit(mockOrganizationId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateBrandKit(updates);
      });

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false);
      });

      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('useBrandKit - Delete Mutation', () => {
    it('should delete brand kit successfully', async () => {
      mockMaybeSingle.mockResolvedValueOnce({
        data: mockBrandKit,
        error: null,
      });

      mockDelete.mockResolvedValueOnce({
        error: null,
      });

      const { result } = renderHook(() => useBrandKit(mockOrganizationId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteBrandKit();
      });

      await waitFor(() => {
        expect(result.current.isDeleting).toBe(false);
      });

      expect(mockDelete).toHaveBeenCalled();
    });
  });
});

describe('useColorPalettes Hook', () => {
  const mockPalettes: ColorPalette[] = [
    {
      id: 'palette-1',
      name: 'Tech Blue',
      industry: 'technology',
      description: 'Professional tech palette',
      primary_color: '#0066CC',
      secondary_color: '#00A3E0',
      accent_color: '#FF6B35',
      neutral_light: '#F5F5F5',
      neutral_dark: '#333333',
      psychology: 'Trust and innovation',
    },
    {
      id: 'palette-2',
      name: 'Nature Green',
      industry: 'sustainability',
      description: 'Eco-friendly palette',
      primary_color: '#2D5016',
      secondary_color: '#6B8E23',
      accent_color: '#FFD700',
      neutral_light: '#FAFAFA',
      neutral_dark: '#1A1A1A',
      psychology: 'Growth and sustainability',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnThis();
  });

  describe('Fetching Color Palettes', () => {
    it('should fetch all color palettes successfully', async () => {
      mockSelect.mockResolvedValueOnce({
        data: mockPalettes,
        error: null,
      });

      const { result } = renderHook(() => useColorPalettes(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.palettes).toEqual(mockPalettes);
      expect(result.current.palettes).toHaveLength(2);
    });

    it('should cache palettes indefinitely (staleTime: Infinity)', async () => {
      mockSelect.mockResolvedValueOnce({
        data: mockPalettes,
        error: null,
      });

      const { result, rerender } = renderHook(() => useColorPalettes(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Rerender should not trigger new fetch (cached)
      rerender();

      // Only one call should have been made
      expect(mockSelect).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch errors', async () => {
      const error = new Error('Failed to fetch palettes');
      mockSelect.mockResolvedValueOnce({
        data: null,
        error,
      });

      const { result } = renderHook(() => useColorPalettes(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });

    it('should return empty array when no palettes exist', async () => {
      mockSelect.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const { result } = renderHook(() => useColorPalettes(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.palettes).toEqual([]);
    });
  });
});

describe('useGenerateBrandKit Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AI Brand Kit Generation', () => {
    it('should generate brand kit with AI successfully', async () => {
      const prompt = 'Create a brand kit for a modern tech startup';
      const mockGeneratedKit = {
        primary_color: '#0066CC',
        secondary_color: '#00A3E0',
        accent_color: '#FF6B35',
        font_heading: 'Inter',
        font_body: 'Roboto',
        tone_of_voice: 'innovative',
      };

      // Mock supabase functions edge function call
      const { supabase } = await import('@/integrations/supabase/client');
      (supabase as any).functions = {
        invoke: vi.fn().mockResolvedValue({
          data: mockGeneratedKit,
          error: null,
        }),
      };

      const { result } = renderHook(() => useGenerateBrandKit('org-123'), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        const generated = await result.current.generateBrandKit(prompt);
        expect(generated).toEqual(mockGeneratedKit);
      });

      expect(result.current.isGenerating).toBe(false);
    });

    it('should handle generation errors', async () => {
      const error = new Error('AI generation failed');

      const { supabase } = await import('@/integrations/supabase/client');
      (supabase as any).functions = {
        invoke: vi.fn().mockResolvedValue({
          data: null,
          error,
        }),
      };

      const { result } = renderHook(() => useGenerateBrandKit('org-123'), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await expect(
          result.current.generateBrandKit('test prompt')
        ).rejects.toThrow('AI generation failed');
      });
    });
  });
});

describe('React Query Integration', () => {
  it('should use correct query keys for brand kit', async () => {
    const { brandKitKeys } = await import('@/hooks/useBrandKit');

    const key = brandKitKeys.brandKit('org-123');
    expect(key).toEqual(['brandKits', 'brandKit', { organizationId: 'org-123' }]);
  });

  it('should use correct query keys for palettes', async () => {
    const { brandKitKeys } = await import('@/hooks/useBrandKit');

    const key = brandKitKeys.palettes();
    expect(key).toEqual(['brandKits', 'palettes']);
  });
});
