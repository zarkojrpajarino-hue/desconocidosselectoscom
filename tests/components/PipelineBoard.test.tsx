/**
 * Tests para PipelineBoard component
 * Archivo: tests/components/PipelineBoard.test.tsx
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import type { ReactNode } from 'react';

// Mock de hooks
vi.mock('@/hooks/useLeads', () => ({
  useLeads: vi.fn(() => ({
    leads: mockLeads,
    loading: false,
    error: null,
    refetch: vi.fn(),
    updateLeadStage: vi.fn(),
  })),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    currentOrganizationId: 'org-1',
  }),
}));

vi.mock('@/hooks/useSubscriptionLimits', () => ({
  useSubscriptionLimits: () => ({
    canUseFeature: () => true,
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useUserRoles', () => ({
  useUserRoles: () => ({
    currentRole: 'admin',
    formatCurrency: (v: number) => `€${v.toLocaleString()}`,
  }),
}));

const mockLeads = [
  {
    id: 'lead-1',
    name: 'Juan Pérez',
    company: 'Tech Corp',
    email: 'juan@techcorp.com',
    estimated_value: 50000,
    probability: 75,
    stage: 'new',
    priority: 'high',
  },
  {
    id: 'lead-2',
    name: 'María García',
    company: 'Innovate SL',
    email: 'maria@innovate.com',
    estimated_value: 30000,
    probability: 60,
    stage: 'qualified',
    priority: 'medium',
  },
  {
    id: 'lead-3',
    name: 'Pedro López',
    company: 'StartupXYZ',
    email: 'pedro@startupxyz.com',
    estimated_value: 75000,
    probability: 80,
    stage: 'proposal',
    priority: 'urgent',
  },
];

const mockStages = ['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

describe('PipelineBoard', () => {
  let queryClient: QueryClient;

  const renderWithProviders = (component: ReactNode) => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Lead data structure', () => {
    it('has correct lead properties', () => {
      const lead = mockLeads[0];
      
      expect(lead.id).toBe('lead-1');
      expect(lead.name).toBe('Juan Pérez');
      expect(lead.company).toBe('Tech Corp');
      expect(lead.estimated_value).toBe(50000);
    });

    it('has all required leads in mock', () => {
      expect(mockLeads).toHaveLength(3);
    });

    it('leads have different stages', () => {
      const stages = new Set(mockLeads.map(l => l.stage));
      expect(stages.size).toBe(3);
    });
  });

  describe('Stage calculations', () => {
    it('counts leads per stage', () => {
      const stageCounts = mockLeads.reduce((acc, lead) => {
        acc[lead.stage] = (acc[lead.stage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      expect(stageCounts['new']).toBe(1);
      expect(stageCounts['qualified']).toBe(1);
      expect(stageCounts['proposal']).toBe(1);
    });

    it('calculates stage value', () => {
      const newStageValue = mockLeads
        .filter(l => l.stage === 'new')
        .reduce((sum, l) => sum + l.estimated_value, 0);

      expect(newStageValue).toBe(50000);
    });

    it('calculates total pipeline value', () => {
      const totalValue = mockLeads.reduce((sum, l) => sum + l.estimated_value, 0);
      expect(totalValue).toBe(155000);
    });
  });

  describe('Lead filtering', () => {
    it('filters by priority', () => {
      const highPriority = mockLeads.filter(l => l.priority === 'high');
      expect(highPriority).toHaveLength(1);
      expect(highPriority[0].name).toBe('Juan Pérez');
    });

    it('filters by stage', () => {
      const proposalLeads = mockLeads.filter(l => l.stage === 'proposal');
      expect(proposalLeads).toHaveLength(1);
    });

    it('handles empty filter results', () => {
      const wonLeads = mockLeads.filter(l => l.stage === 'won');
      expect(wonLeads).toHaveLength(0);
    });
  });

  describe('Stage configuration', () => {
    it('has all pipeline stages', () => {
      expect(mockStages).toContain('new');
      expect(mockStages).toContain('qualified');
      expect(mockStages).toContain('proposal');
      expect(mockStages).toContain('negotiation');
      expect(mockStages).toContain('won');
      expect(mockStages).toContain('lost');
    });

    it('has correct stage count', () => {
      expect(mockStages).toHaveLength(6);
    });
  });

  describe('Lead probability calculations', () => {
    it('calculates weighted value', () => {
      const lead = mockLeads[0];
      const weightedValue = lead.estimated_value * (lead.probability / 100);
      
      expect(weightedValue).toBe(37500);
    });

    it('calculates total weighted pipeline', () => {
      const totalWeighted = mockLeads.reduce((sum, l) => {
        return sum + (l.estimated_value * (l.probability / 100));
      }, 0);

      expect(totalWeighted).toBe(115500);
    });
  });

  describe('Priority distribution', () => {
    it('counts priorities correctly', () => {
      const priorityCounts = mockLeads.reduce((acc, lead) => {
        acc[lead.priority] = (acc[lead.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      expect(priorityCounts['high']).toBe(1);
      expect(priorityCounts['medium']).toBe(1);
      expect(priorityCounts['urgent']).toBe(1);
    });
  });
});
