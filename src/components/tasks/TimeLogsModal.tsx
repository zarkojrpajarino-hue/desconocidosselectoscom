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
      <DialogContent className="sm:max-w-md max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-3 border-b bg-muted/30">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Clock className="w-4 h-4 text-primary" />
            Historial de Tiempo
          </DialogTitle>
          <p className="text-xs text-muted-foreground line-clamp-2 pr-6">{taskTitle}</p>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Summary - Fixed to fit properly */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 text-center">
              <span className="text-[10px] text-muted-foreground block mb-0.5">Total Registrado</span>
              <p className="text-xl font-bold text-primary">{formatTotalTime(totalMinutes)}</p>
            </div>
            <div className="p-3 bg-violet-500/10 rounded-lg border border-violet-500/20 text-center">
              <span className="text-[10px] text-muted-foreground block mb-0.5">Sesiones</span>
              <p className="text-xl font-bold text-violet-500">{logs.length}</p>
            </div>
          </div>

          {/* Logs list */}
          <ScrollArea className="max-h-[350px]">
            {loading ? (
              <div className="space-y-3 pr-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay registros de tiempo</p>
                <p className="text-xs">Usa el botón Play para empezar a trackear</p>
              </div>
            ) : (
              <div className="space-y-2 pr-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Badge variant={log.ended_at ? "secondary" : "default"} className="text-[10px] px-1.5 py-0">
                            <Clock className="w-2.5 h-2.5 mr-0.5" />
                            {formatDuration(log.duration_minutes)}
                          </Badge>
                          {log.was_interrupted && (
                            <Badge variant="outline" className="text-yellow-600 text-[10px] px-1.5 py-0">
                              <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
                              Interrumpido
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
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
                          <p className="text-xs mt-1.5 text-foreground/80 italic line-clamp-2">
                            "{log.notes}"
                          </p>
                        )}
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => deleteLog(log.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
