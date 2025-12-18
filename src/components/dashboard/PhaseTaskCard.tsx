import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Clock, 
  RefreshCw, 
  Users, 
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Undo2
} from 'lucide-react';
import { TimeTracker } from '@/components/tasks/TimeTracker';
import { TimeLogsModal } from '@/components/tasks/TimeLogsModal';
import { AIResourcesPanel } from '@/components/tasks/ai-resources';
import { TaskSwapModal } from '@/components/TaskSwapModal';
import { TaskCompletionModal } from '@/components/tasks/TaskCompletionModal';
import { IntegrationButton } from '@/components/IntegrationButton';
import type { PhaseTask } from '@/hooks/usePhaseWeeklyTasks';

interface PhaseTaskCardProps {
  task: PhaseTask & { organization_id?: string | null };
  userId: string;
  onComplete: (taskId: string, completed: boolean) => void;
  remainingSwaps?: number;
  onSwapComplete?: () => void;
  leaderName?: string;
  isLocked?: boolean;
  currentWeek?: number;
  isCarriedOver?: boolean;
}

export function PhaseTaskCard({
  task,
  userId,
  onComplete,
  remainingSwaps = 0,
  onSwapComplete,
  leaderName,
  isLocked = false,
  currentWeek,
  isCarriedOver = false
}: PhaseTaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [timeLogsOpen, setTimeLogsOpen] = useState(false);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  
  const isCompleted = task.is_completed;
  const canSwap = !isCompleted && !isLocked && task.user_id === userId;
  
  // Determine if task is carried over from previous week
  const isFromPreviousWeek = isCarriedOver || (currentWeek && task.week_number < currentWeek && !isCompleted);

  // Open completion modal instead of direct toggle
  const handleCheckboxClick = () => {
    if (isLocked) return;
    
    if (isCompleted) {
      // Direct unmark - no modal needed
      onComplete(task.id, false);
    } else {
      // Open completion modal with requirements
      setCompletionModalOpen(true);
    }
  };

  const handleCompletionSuccess = () => {
    // Refresh is handled by the modal
  };

  return (
    <>
      <div
        className={`rounded-lg border transition-all ${
          isCompleted
            ? 'bg-success/5 border-success/20'
            : 'bg-card hover:shadow-sm border-border'
        }`}
      >
        {/* Header Row */}
        <div className="flex items-start gap-3 p-3 md:p-4">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={handleCheckboxClick}
            className="mt-1 h-5 w-5"
            disabled={isLocked}
          />
          
          <div className="flex-1 min-w-0">
            <p className={`font-medium text-sm md:text-base ${
              isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
            }`}>
              {task.title}
            </p>
            
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap mt-2">
              {task.area && (
                <Badge variant="secondary" className="text-xs">
                  {task.area}
                </Badge>
              )}
              {task.leader_id && leaderName && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Líder: {leaderName}
                </Badge>
              )}
              {task.estimated_hours && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  ~{task.estimated_hours}h
                </span>
              )}
              {isCompleted && (
                <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Completada
                </Badge>
              )}
              {isFromPreviousWeek && !isCompleted && (
                <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/30">
                  <Clock className="w-3 h-3 mr-1" />
                  Semana anterior
                </Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Unmark button for completed tasks */}
            {isCompleted && !isLocked && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onComplete(task.id, false)}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                <Undo2 className="w-3 h-3 mr-1" />
                Desmarcar
              </Button>
            )}
            
            {/* Swap Button */}
            {canSwap && remainingSwaps > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSwapModalOpen(true)}
                className="shrink-0 h-8"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden md:inline ml-1">Cambiar</span>
              </Button>
            )}
            
            {/* Expand/Collapse */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="shrink-0 h-8 w-8 p-0"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        
        {/* Expanded Content */}
        {expanded && (
          <div className="px-3 md:px-4 pb-3 md:pb-4 pt-0 space-y-3 border-t border-border/50">
            {/* Description */}
            {task.description && (
              <div className="pt-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Instrucciones:</p>
                <p className="text-sm text-foreground">{task.description}</p>
              </div>
            )}
            
            {!isCompleted && (
              <>
                {/* AI Resources Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAiPanelOpen(true)}
                  className="w-full border-primary/50 text-primary hover:bg-primary/10"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generar Recursos con IA
                </Button>
                
                {/* Time Tracking */}
                <div className="flex items-center gap-2 flex-wrap">
                  <TimeTracker
                    taskId={task.id}
                    estimatedHours={task.estimated_hours}
                    actualHours={task.actual_hours}
                    compact={true}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setTimeLogsOpen(true)}
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    Ver historial
                  </Button>
                </div>
                
                {/* Integration Buttons */}
                <div className="flex flex-wrap gap-2">
                  <IntegrationButton
                    type="calendar"
                    action="sync"
                    data={{ task_id: task.id, user_id: userId }}
                    label="Calendario"
                    size="sm"
                    variant="outline"
                  />
                  <IntegrationButton
                    type="asana"
                    action="export"
                    data={{
                      name: task.title,
                      notes: task.description || '',
                      due_on: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    }}
                    label="Asana"
                    size="sm"
                    variant="outline"
                  />
                  <IntegrationButton
                    type="trello"
                    action="export"
                    data={{ name: task.title, desc: task.description || '' }}
                    label="Trello"
                    size="sm"
                    variant="outline"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Modals */}
      <AIResourcesPanel
        taskId={task.id}
        resourceType="task_resources"
        taskTitle={task.title}
        taskDescription={task.description || ''}
        open={aiPanelOpen}
        onOpenChange={setAiPanelOpen}
      />
      
      <TimeLogsModal
        open={timeLogsOpen}
        onOpenChange={setTimeLogsOpen}
        taskId={task.id}
        taskTitle={task.title}
      />
      
      <TaskCompletionModal
        open={completionModalOpen}
        onOpenChange={setCompletionModalOpen}
        taskId={task.id}
        taskTitle={task.title}
        taskDescription={task.description || ''}
        onComplete={handleCompletionSuccess}
      />
      
      {swapModalOpen && (
        <TaskSwapModal
          task={{
            id: task.id,
            title: task.title,
            description: task.description || '',
            area: task.area || '',
            phase: task.phase,
            user_id: task.user_id,
            leader_id: task.leader_id,
          }}
          userId={userId}
          remainingSwaps={remainingSwaps}
          onSwapComplete={() => {
            setSwapModalOpen(false);
            onSwapComplete?.();
          }}
          onCancel={() => setSwapModalOpen(false)}
        />
      )}
    </>
  );
}
