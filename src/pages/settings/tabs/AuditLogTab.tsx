import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Shield, 
  User, 
  Calendar, 
  FileText, 
  Target, 
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuditLog } from '@/hooks/useAuditLog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function AuditLogTab() {
  const [resourceFilter, setResourceFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { logs, isLoading, refetch } = useAuditLog({
    limit: 100,
    resourceType: resourceFilter === 'all' ? undefined : resourceFilter,
  });

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      log.resource_type.toLowerCase().includes(term) ||
      log.user_email?.toLowerCase().includes(term)
    );
  });

  const getActionColor = (action: string): 'destructive' | 'default' | 'secondary' => {
    if (action.includes('DELETE')) return 'destructive';
    if (action.includes('INSERT')) return 'default';
    return 'secondary';
  };

  const getActionIcon = (resourceType: string) => {
    switch (resourceType) {
      case 'leads': return FileText;
      case 'tasks': return Calendar;
      case 'objectives':
      case 'key_results': return Target;
      default: return User;
    }
  };

  const formatAction = (action: string): string => {
    const [operation, resource] = action.split('.');
    const opMap: Record<string, string> = {
      'INSERT': 'Creó',
      'UPDATE': 'Actualizó',
      'DELETE': 'Eliminó',
    };
    const resMap: Record<string, string> = {
      'leads': 'Lead',
      'tasks': 'Tarea',
      'objectives': 'Objetivo',
      'key_results': 'Key Result',
      'organizations': 'Organización',
    };
    return `${opMap[operation] || operation} ${resMap[resource] || resource}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Registro de Auditoría
            </CardTitle>
            <CardDescription>
              Historial de cambios realizados en la organización
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={resourceFilter} onValueChange={setResourceFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="leads">Leads</SelectItem>
              <SelectItem value="tasks">Tareas</SelectItem>
              <SelectItem value="objectives">Objetivos</SelectItem>
              <SelectItem value="key_results">Key Results</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No se encontraron registros de auditoría.
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {filteredLogs.map((log) => {
                const Icon = getActionIcon(log.resource_type);
                return (
                  <div 
                    key={log.id} 
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="p-2 rounded-full bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={getActionColor(log.action)}>
                          {formatAction(log.action)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          por {log.user_email}
                        </span>
                      </div>
                      {log.resource_id && (
                        <p className="text-sm text-muted-foreground truncate">
                          ID: {log.resource_id.slice(0, 8)}...
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.created_at), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
