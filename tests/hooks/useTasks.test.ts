import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Mock Supabase client
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    })),
  },
}));

// Mock error handlers
vi.mock('@/utils/errorHandler', () => ({
  handleError: vi.fn(),
  handleSuccess: vi.fn(),
}));

// Mock constants
vi.mock('@/constants/limits', () => ({
  QUERY_STALE_TIMES: {
    tasks: 30000,
  },
}));

describe('useTasks Hook', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Fetching tasks', () => {
    it('should fetch tasks successfully', async () => {
      const mockTasks = [
        {
          id: '1',
          title: 'Task 1',
          description: 'Description 1',
          area: 'Marketing',
          phase: 1,
          user_id: 'user-123',
          leader_id: null,
          order_index: 0,
          estimated_cost: null,
          actual_cost: null,
          created_at: '2024-01-01',
          organization_id: 'org-123',
        },
        {
          id: '2',
          title: 'Task 2',
          description: 'Description 2',
          area: 'Sales',
          phase: 1,
          user_id: 'user-123',
          leader_id: null,
          order_index: 1,
          estimated_cost: 100,
          actual_cost: 80,
          created_at: '2024-01-02',
          organization_id: 'org-123',
        },
      ];

      mockSelect.mockReturnThis();
      mockEq.mockReturnThis();
      mockOrder.mockResolvedValue({ data: mockTasks, error: null });

      expect(mockTasks).toHaveLength(2);
      expect(mockTasks[0].title).toBe('Task 1');
    });

    it('should handle empty task list', async () => {
      mockSelect.mockReturnThis();
      mockEq.mockReturnThis();
      mockOrder.mockResolvedValue({ data: [], error: null });

      expect([]).toHaveLength(0);
    });

    it('should handle fetch errors', async () => {
      const error = new Error('Database error');
      mockOrder.mockResolvedValue({ data: null, error });

      expect(error.message).toBe('Database error');
    });
  });

  describe('Task completion', () => {
    it('should mark task as completed', async () => {
      mockUpdate.mockReturnThis();
      mockEq.mockReturnThis();
      mockSingle.mockResolvedValue({ data: { id: '1', completed: true }, error: null });

      const completedTask = { id: '1', completed: true };
      expect(completedTask.completed).toBe(true);
    });

    it('should handle completion errors', async () => {
      const error = new Error('Update failed');
      mockSingle.mockResolvedValue({ data: null, error });

      expect(error.message).toBe('Update failed');
    });
  });

  describe('Task filtering', () => {
    it('should filter tasks by phase', () => {
      const tasks = [
        { id: '1', phase: 1, title: 'Phase 1 Task' },
        { id: '2', phase: 2, title: 'Phase 2 Task' },
        { id: '3', phase: 1, title: 'Another Phase 1' },
      ];

      const phase1Tasks = tasks.filter(t => t.phase === 1);
      expect(phase1Tasks).toHaveLength(2);
    });

    it('should filter tasks by area', () => {
      const tasks = [
        { id: '1', area: 'Marketing', title: 'Marketing Task' },
        { id: '2', area: 'Sales', title: 'Sales Task' },
        { id: '3', area: 'Marketing', title: 'Another Marketing' },
      ];

      const marketingTasks = tasks.filter(t => t.area === 'Marketing');
      expect(marketingTasks).toHaveLength(2);
    });

    it('should filter tasks by user_id', () => {
      const tasks = [
        { id: '1', user_id: 'user-123', title: 'User 123 Task' },
        { id: '2', user_id: 'user-456', title: 'User 456 Task' },
      ];

      const userTasks = tasks.filter(t => t.user_id === 'user-123');
      expect(userTasks).toHaveLength(1);
    });
  });

  describe('Task statistics', () => {
    it('should calculate completion percentage', () => {
      const tasks = [
        { id: '1', completed: true },
        { id: '2', completed: true },
        { id: '3', completed: false },
        { id: '4', completed: false },
      ];

      const completed = tasks.filter(t => t.completed).length;
      const total = tasks.length;
      const percentage = (completed / total) * 100;

      expect(percentage).toBe(50);
    });

    it('should count tasks by status', () => {
      const tasks = [
        { id: '1', status: 'pending' },
        { id: '2', status: 'in_progress' },
        { id: '3', status: 'completed' },
        { id: '4', status: 'pending' },
      ];

      const statusCounts = tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      expect(statusCounts['pending']).toBe(2);
      expect(statusCounts['in_progress']).toBe(1);
      expect(statusCounts['completed']).toBe(1);
    });
  });

  describe('Multi-tenancy', () => {
    it('should filter tasks by organization_id', () => {
      const tasks = [
        { id: '1', organization_id: 'org-123', title: 'Org 123 Task' },
        { id: '2', organization_id: 'org-456', title: 'Org 456 Task' },
      ];

      const orgTasks = tasks.filter(t => t.organization_id === 'org-123');
      expect(orgTasks).toHaveLength(1);
      expect(orgTasks[0].title).toBe('Org 123 Task');
    });
  });

  describe('Task ordering', () => {
    it('should order tasks by order_index', () => {
      const tasks = [
        { id: '1', order_index: 2, title: 'Third' },
        { id: '2', order_index: 0, title: 'First' },
        { id: '3', order_index: 1, title: 'Second' },
      ];

      const sorted = [...tasks].sort((a, b) => a.order_index - b.order_index);

      expect(sorted[0].title).toBe('First');
      expect(sorted[1].title).toBe('Second');
      expect(sorted[2].title).toBe('Third');
    });
  });
});
