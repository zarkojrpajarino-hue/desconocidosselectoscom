import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Square, Clock, AlertCircle } from "lucide-react";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface TimeTrackerProps {
  taskId: string;
  estimatedHours?: number | null;
  actualHours?: number | null;
  compact?: boolean;
}

export function TimeTracker({ taskId, estimatedHours, actualHours, compact = false }: TimeTrackerProps) {
  const {
    isTrackingThisTask,
    isTrackingAnyTask,
    elapsedSeconds,
    startTimer,
    stopTimer,
    isStarting,
    isStopping,
  } = useTimeTracking(taskId);

  const [showStopDialog, setShowStopDialog] = useState(false);
  const [stopNotes, setStopNotes] = useState("");
  const [wasInterrupted, setWasInterrupted] = useState(false);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatHours = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    return `${hours.toFixed(1)}h`;
  };

  const handleStart = () => {
    if (isTrackingAnyTask && !isTrackingThisTask) {
      return; // Button is disabled, but just in case
    }
    startTimer(taskId);
  };

  const handleStopClick = () => {
    setShowStopDialog(true);
  };

  const handleConfirmStop = () => {
    stopTimer(stopNotes || undefined, wasInterrupted);
    setShowStopDialog(false);
    setStopNotes("");
    setWasInterrupted(false);
  };

  // Calculate variance
  const getVariance = () => {
    if (!estimatedHours || !actualHours) return null;
    const diff = ((actualHours - estimatedHours) / estimatedHours) * 100;
    return diff;
  };

  const variance = getVariance();
  const isOverBudget = variance !== null && variance > 10;

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {/* Estimated hours */}
        {estimatedHours && (
          <Badge variant="outline" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            {formatHours(estimatedHours)}
          </Badge>
        )}

        {/* Actual hours */}
        {actualHours !== undefined && actualHours > 0 && (
          <Badge 
            variant={isOverBudget ? "destructive" : "secondary"} 
            className="text-xs"
          >
            {formatHours(actualHours)} real
          </Badge>
        )}

        {/* Active timer display */}
        {isTrackingThisTask && (
          <Badge variant="default" className="text-xs animate-pulse bg-primary">
            {formatTime(elapsedSeconds)}
          </Badge>
        )}

        {/* Play/Stop button */}
        <Button
          size="sm"
          variant={isTrackingThisTask ? "destructive" : "outline"}
          onClick={isTrackingThisTask ? handleStopClick : handleStart}
          disabled={isStarting || isStopping || (isTrackingAnyTask && !isTrackingThisTask)}
          className="h-7 px-2"
        >
          {isTrackingThisTask ? (
            <>
              <Square className="w-3 h-3 mr-1" />
              Stop
            </>
          ) : (
            <>
              <Play className="w-3 h-3 mr-1" />
              Start
            </>
          )}
        </Button>

        {/* Warning if tracking another task */}
        {isTrackingAnyTask && !isTrackingThisTask && (
          <span className="text-xs text-muted-foreground flex items-center">
            <AlertCircle className="w-3 h-3 mr-1" />
            Timer activo
          </span>
        )}

        {/* Stop dialog */}
        <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Detener Timer</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="text-center py-2">
                <span className="text-2xl font-bold">{formatTime(elapsedSeconds)}</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="¿En qué trabajaste?"
                  value={stopNotes}
                  onChange={(e) => setStopNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="interrupted"
                  checked={wasInterrupted}
                  onCheckedChange={(checked) => setWasInterrupted(checked === true)}
                />
                <Label htmlFor="interrupted" className="text-sm text-muted-foreground">
                  Fui interrumpido durante esta sesión
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowStopDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmStop} disabled={isStopping}>
                Guardar y Detener
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Full version (for standalone use)
  return (
    <div className="p-4 border rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Time Tracking</h4>
        {isTrackingThisTask && (
          <Badge variant="default" className="animate-pulse">
            {formatTime(elapsedSeconds)}
          </Badge>
        )}
      </div>

      <div className="flex gap-4">
        {estimatedHours && (
          <div>
            <span className="text-sm text-muted-foreground">Estimado</span>
            <p className="font-medium">{formatHours(estimatedHours)}</p>
          </div>
        )}
        {actualHours !== undefined && actualHours > 0 && (
          <div>
            <span className="text-sm text-muted-foreground">Real</span>
            <p className={`font-medium ${isOverBudget ? "text-destructive" : ""}`}>
              {formatHours(actualHours)}
            </p>
          </div>
        )}
        {variance !== null && (
          <div>
            <span className="text-sm text-muted-foreground">Varianza</span>
            <p className={`font-medium ${variance > 0 ? "text-destructive" : "text-green-600"}`}>
              {variance > 0 ? "+" : ""}{variance.toFixed(0)}%
            </p>
          </div>
        )}
      </div>

      <Button
        className="w-full"
        variant={isTrackingThisTask ? "destructive" : "default"}
        onClick={isTrackingThisTask ? handleStopClick : handleStart}
        disabled={isStarting || isStopping || (isTrackingAnyTask && !isTrackingThisTask)}
      >
        {isTrackingThisTask ? (
          <>
            <Square className="w-4 h-4 mr-2" />
            Detener Timer
          </>
        ) : (
          <>
            <Play className="w-4 h-4 mr-2" />
            Iniciar Timer
          </>
        )}
      </Button>

      {/* Stop dialog */}
      <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detener Timer</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center py-4">
              <span className="text-3xl font-bold">{formatTime(elapsedSeconds)}</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes-full">Notas (opcional)</Label>
              <Textarea
                id="notes-full"
                placeholder="¿En qué trabajaste durante esta sesión?"
                value={stopNotes}
                onChange={(e) => setStopNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="interrupted-full"
                checked={wasInterrupted}
                onCheckedChange={(checked) => setWasInterrupted(checked === true)}
              />
              <Label htmlFor="interrupted-full">
                Fui interrumpido durante esta sesión
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStopDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmStop} disabled={isStopping}>
              Guardar y Detener
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
