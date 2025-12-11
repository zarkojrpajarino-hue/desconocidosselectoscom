import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

export interface UndoableAction {
  type: string;
  do: () => Promise<void> | void;
  undo: () => Promise<void> | void;
  description: string;
}

interface UseUndoRedoOptions {
  maxHistorySize?: number;
}

/**
 * Hook for undo/redo functionality
 * Supports Ctrl/Cmd + Z and Ctrl/Cmd + Shift + Z
 */
export function useUndoRedo(options: UseUndoRedoOptions = {}) {
  const { maxHistorySize = 50 } = options;
  
  const [history, setHistory] = useState<UndoableAction[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const canUndo = currentIndex >= 0;
  const canRedo = currentIndex < history.length - 1;

  // Execute action and add to history
  const executeAction = useCallback(async (action: UndoableAction) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      await action.do();
      
      // Remove any actions after current index (redo history)
      const newHistory = history.slice(0, currentIndex + 1);
      newHistory.push(action);
      
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
      }
      
      setHistory(newHistory);
      setCurrentIndex(newHistory.length - 1);
    } catch (error) {
      toast.error('Failed to execute action', {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [history, currentIndex, maxHistorySize, isProcessing]);

  // Undo last action
  const undo = useCallback(async () => {
    if (!canUndo || isProcessing) return;
    
    const action = history[currentIndex];
    if (!action) return;
    
    setIsProcessing(true);
    try {
      await action.undo();
      setCurrentIndex(currentIndex - 1);
      toast.success(`Undone: ${action.description}`);
    } catch (error) {
      toast.error('Failed to undo action', {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [canUndo, history, currentIndex, isProcessing]);

  // Redo next action
  const redo = useCallback(async () => {
    if (!canRedo || isProcessing) return;
    
    const action = history[currentIndex + 1];
    if (!action) return;
    
    setIsProcessing(true);
    try {
      await action.do();
      setCurrentIndex(currentIndex + 1);
      toast.success(`Redone: ${action.description}`);
    } catch (error) {
      toast.error('Failed to redo action', {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [canRedo, history, currentIndex, isProcessing]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't trigger in inputs
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [undo, redo]);

  return {
    history,
    currentIndex,
    canUndo,
    canRedo,
    isProcessing,
    executeAction,
    undo,
    redo,
    clearHistory,
  };
}

// Helper to create common undoable actions
export const createUndoableActions = {
  // Task actions
  completeTask: (taskId: string, completeFn: () => Promise<void>, uncompleteFn: () => Promise<void>) => ({
    type: 'complete_task',
    description: 'Complete task',
    do: completeFn,
    undo: uncompleteFn,
  }),

  deleteTask: (taskId: string, task: { title: string }, deleteFn: () => Promise<void>, restoreFn: () => Promise<void>) => ({
    type: 'delete_task',
    description: `Delete task: ${task.title}`,
    do: deleteFn,
    undo: restoreFn,
  }),

  // Lead actions
  updateLeadStage: (
    leadId: string,
    oldStage: string,
    newStage: string,
    updateFn: (stage: string) => Promise<void>
  ) => ({
    type: 'update_lead_stage',
    description: `Move lead from ${oldStage} to ${newStage}`,
    do: () => updateFn(newStage),
    undo: () => updateFn(oldStage),
  }),

  // Generic edit action
  editField: <T>(
    entity: string,
    field: string,
    oldValue: T,
    newValue: T,
    updateFn: (value: T) => Promise<void>
  ) => ({
    type: 'edit_field',
    description: `Edit ${entity} ${field}`,
    do: () => updateFn(newValue),
    undo: () => updateFn(oldValue),
  }),
};
