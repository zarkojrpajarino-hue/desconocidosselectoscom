import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, Trash2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import { Skeleton } from "@/components/ui/skeleton";

interface TimeLogsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  taskTitle: string;
}

export function TimeLogsModal({ open, onOpenChange, taskId, taskTitle }: TimeLogsModalProps) {
  const { logs, totalMinutes, loading, deleteLog } = useTimeTracking(taskId);

  const formatDuration = (minutes: number | null) => {
    if (minutes === null) return "En progreso...";
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  const formatTotalTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Historial de Tiempo
          </DialogTitle>
          <p className="text-sm text-muted-foreground truncate">{taskTitle}</p>
        </DialogHeader>

        {/* Summary */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div>
            <span className="text-sm text-muted-foreground">Total Registrado</span>
            <p className="text-xl font-bold">{formatTotalTime(totalMinutes)}</p>
          </div>
          <div className="text-right">
            <span className="text-sm text-muted-foreground">Sesiones</span>
            <p className="text-xl font-bold">{logs.length}</p>
          </div>
        </div>

        {/* Logs list */}
        <ScrollArea className="max-h-[400px] pr-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay registros de tiempo</p>
              <p className="text-sm">Usa el botón Play para empezar a trackear</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={log.ended_at ? "secondary" : "default"}>
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDuration(log.duration_minutes)}
                        </Badge>
                        {log.was_interrupted && (
                          <Badge variant="outline" className="text-yellow-600">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Interrumpido
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(log.started_at), "d MMM, HH:mm", { locale: es })}
                        {log.ended_at && (
                          <> → {format(new Date(log.ended_at), "HH:mm", { locale: es })}</>
                        )}
                        <span className="mx-1">•</span>
                        {formatDistanceToNow(new Date(log.started_at), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </p>

                      {log.notes && (
                        <p className="text-sm mt-2 text-foreground/80 italic">
                          "{log.notes}"
                        </p>
                      )}
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteLog(log.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
