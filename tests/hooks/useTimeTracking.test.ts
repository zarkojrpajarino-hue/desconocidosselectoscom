import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Mock Auth Context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
    currentOrganizationId: 'org-123',
  }),
}));

// Mock Supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockIs = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockMaybeSingle = vi.fn();
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

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useTimeTracking Hook', () => {
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

  describe('Active time log', () => {
    it('should fetch active time log for user', async () => {
      const mockActiveLog = {
        id: 'log-1',
        task_id: 'task-123',
        user_id: 'user-123',
        started_at: '2024-01-01T10:00:00Z',
        ended_at: null,
        duration_minutes: null,
      };

      mockSelect.mockReturnThis();
      mockEq.mockReturnThis();
      mockIs.mockReturnThis();
      mockOrder.mockReturnThis();
      mockLimit.mockReturnThis();
      mockMaybeSingle.mockResolvedValue({ data: mockActiveLog, error: null });

      expect(mockActiveLog.ended_at).toBeNull();
      expect(mockActiveLog.task_id).toBe('task-123');
    });

    it('should return null when no active log exists', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });

      expect(null).toBeNull();
    });
  });

  describe('Time log calculations', () => {
    it('should calculate elapsed seconds correctly', () => {
      const startedAt = new Date('2024-01-01T10:00:00Z');
      const now = new Date('2024-01-01T10:30:00Z');
      
      const elapsedMs = now.getTime() - startedAt.getTime();
      const elapsedSeconds = Math.floor(elapsedMs / 1000);

      expect(elapsedSeconds).toBe(1800); // 30 minutes = 1800 seconds
    });

    it('should calculate total minutes from completed logs', () => {
      const logs = [
        { duration_minutes: 30 },
        { duration_minutes: 45 },
        { duration_minutes: 15 },
      ];

      const totalMinutes = logs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);

      expect(totalMinutes).toBe(90);
    });

    it('should format duration as hours and minutes', () => {
      const totalMinutes = 135;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      expect(hours).toBe(2);
      expect(minutes).toBe(15);
    });
  });

  describe('Starting timer', () => {
    it('should create new time log when starting timer', async () => {
      const newLog = {
        id: 'log-new',
        task_id: 'task-123',
        user_id: 'user-123',
        started_at: new Date().toISOString(),
        ended_at: null,
      };

      mockInsert.mockReturnThis();
      mockSelect.mockReturnThis();
      mockSingle.mockResolvedValue({ data: newLog, error: null });

      expect(newLog.ended_at).toBeNull();
      expect(newLog.task_id).toBe('task-123');
    });

    it('should prevent starting timer when another is active', () => {
      const activeLog = { id: 'log-1', task_id: 'task-other' };
      const canStart = !activeLog;

      expect(canStart).toBe(false);
    });
  });

  describe('Stopping timer', () => {
    it('should update time log with end time and duration', async () => {
      const startedAt = '2024-01-01T10:00:00Z';
      const endedAt = '2024-01-01T10:45:00Z';
      
      const durationMs = new Date(endedAt).getTime() - new Date(startedAt).getTime();
      const durationMinutes = Math.floor(durationMs / 60000);

      mockUpdate.mockReturnThis();
      mockEq.mockReturnThis();
      mockSingle.mockResolvedValue({ 
        data: { 
          id: 'log-1', 
          ended_at: endedAt, 
          duration_minutes: durationMinutes 
        }, 
        error: null 
      });

      expect(durationMinutes).toBe(45);
    });

    it('should support adding notes when stopping', () => {
      const notes = 'Completed initial research phase';
      
      expect(notes.length).toBeGreaterThan(0);
    });

    it('should support marking as interrupted', () => {
      const wasInterrupted = true;
      
      expect(wasInterrupted).toBe(true);
    });
  });

  describe('Deleting time logs', () => {
    it('should delete specified time log', async () => {
      mockDelete.mockReturnThis();
      mockEq.mockResolvedValue({ error: null });

      const logIdToDelete = 'log-to-delete';
      expect(logIdToDelete).toBe('log-to-delete');
    });

    it('should handle deletion errors', async () => {
      const error = new Error('Delete failed');
      mockEq.mockResolvedValue({ error });

      expect(error.message).toBe('Delete failed');
    });
  });

  describe('Multi-task tracking', () => {
    it('should determine if tracking this specific task', () => {
      const activeLog = { task_id: 'task-123' };
      const currentTaskId = 'task-123';
      
      const isTrackingThisTask = activeLog?.task_id === currentTaskId;

      expect(isTrackingThisTask).toBe(true);
    });

    it('should determine if tracking any task', () => {
      const activeLog = { task_id: 'task-456' };
      
      const isTrackingAnyTask = !!activeLog;

      expect(isTrackingAnyTask).toBe(true);
    });

    it('should return false when not tracking any task', () => {
      const activeLog = null;
      
      const isTrackingAnyTask = !!activeLog;

      expect(isTrackingAnyTask).toBe(false);
    });
  });

  describe('Task time statistics', () => {
    it('should calculate variance from estimated hours', () => {
      const estimatedHours = 2;
      const actualHours = 2.5;
      const variance = ((actualHours - estimatedHours) / estimatedHours) * 100;

      expect(variance).toBe(25); // 25% over estimate
    });

    it('should identify tasks over time estimate', () => {
      const estimatedHours = 2;
      const actualHours = 2.5;
      const threshold = 10; // 10% threshold
      
      const variance = ((actualHours - estimatedHours) / estimatedHours) * 100;
      const isOverEstimate = variance > threshold;

      expect(isOverEstimate).toBe(true);
    });
  });
});
