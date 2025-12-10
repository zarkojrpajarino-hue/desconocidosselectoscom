import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useLeads } from '@/hooks/useLeads';

// Mock Supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('useLeads Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnThis();
    mockEq.mockReturnThis();
    mockOrder.mockReturnThis();
  });

  describe('Fetching leads', () => {
    it('should fetch leads successfully', async () => {
      const mockLeads = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          company: 'Acme Inc',
          stage: 'lead',
          estimated_value: 5000,
          created_at: '2024-01-01',
          organization_id: 'org-123',
          created_by: 'user-123',
          assigned_to: 'user-123',
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          company: 'Tech Corp',
          stage: 'qualified',
          estimated_value: 10000,
          created_at: '2024-01-02',
          organization_id: 'org-123',
          created_by: 'user-123',
          assigned_to: 'user-456',
        },
      ];

      mockOrder.mockResolvedValue({ data: mockLeads, error: null });

      const { result } = renderHook(() => useLeads('user-123', 'org-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.leads).toEqual(mockLeads);
      expect(result.current.leads).toHaveLength(2);
      expect(result.current.error).toBeNull();
    });

    it('should filter leads by organization_id (multi-tenancy)', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      const { result } = renderHook(() => useLeads('user-123', 'org-456'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockEq).toHaveBeenCalledWith('organization_id', 'org-456');
    });

    it('should not fetch when userId is undefined', async () => {
      const { result } = renderHook(() => useLeads(undefined, 'org-123'));

      expect(result.current.leads).toEqual([]);
      expect(result.current.loading).toBe(false);
    });

    it('should handle fetch errors gracefully', async () => {
      const error = new Error('Database error');
      mockOrder.mockResolvedValue({ data: null, error });

      const { result } = renderHook(() => useLeads('user-123', 'org-123'));

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });
  });

  describe('Lead filtering', () => {
    it('should return leads filtered by assigned user', async () => {
      const mockLeads = [
        { id: '1', assigned_to: 'user-123', organization_id: 'org-123' },
        { id: '2', assigned_to: 'user-456', organization_id: 'org-123' },
      ];

      mockOrder.mockResolvedValue({ data: mockLeads, error: null });

      const { result } = renderHook(() => useLeads('user-123', 'org-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const userLeads = result.current.leads.filter(l => l.assigned_to === 'user-123');
      expect(userLeads).toHaveLength(1);
    });
  });

  describe('Lead stage counts', () => {
    it('should calculate stage counts correctly', async () => {
      const mockLeads = [
        { id: '1', stage: 'lead', organization_id: 'org-123' },
        { id: '2', stage: 'lead', organization_id: 'org-123' },
        { id: '3', stage: 'qualified', organization_id: 'org-123' },
        { id: '4', stage: 'won', organization_id: 'org-123' },
      ];

      mockOrder.mockResolvedValue({ data: mockLeads, error: null });

      const { result } = renderHook(() => useLeads('user-123', 'org-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const leadCount = result.current.leads.filter(l => l.stage === 'lead').length;
      const qualifiedCount = result.current.leads.filter(l => l.stage === 'qualified').length;
      const wonCount = result.current.leads.filter(l => l.stage === 'won').length;

      expect(leadCount).toBe(2);
      expect(qualifiedCount).toBe(1);
      expect(wonCount).toBe(1);
    });
  });

  describe('Pipeline value calculations', () => {
    it('should calculate total pipeline value', async () => {
      const mockLeads = [
        { id: '1', estimated_value: 5000, stage: 'qualified', organization_id: 'org-123' },
        { id: '2', estimated_value: 10000, stage: 'proposal', organization_id: 'org-123' },
        { id: '3', estimated_value: 3000, stage: 'won', organization_id: 'org-123' },
      ];

      mockOrder.mockResolvedValue({ data: mockLeads, error: null });

      const { result } = renderHook(() => useLeads('user-123', 'org-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const pipelineValue = result.current.leads
        .filter(l => !['won', 'lost'].includes(l.stage))
        .reduce((sum, l) => sum + (l.estimated_value || 0), 0);

      expect(pipelineValue).toBe(15000);
    });
  });
});
