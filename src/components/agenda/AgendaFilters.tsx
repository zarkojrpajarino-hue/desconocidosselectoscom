import React from 'react';
import { Filter, Clock, CheckCircle2, Users, User, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { AgendaFilters as FiltersType, GlobalAgendaStats } from '@/hooks/useGlobalAgenda';

interface AgendaFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
}

export function AgendaFilters({ filters, onFiltersChange }: AgendaFiltersProps) {
  const activeFiltersCount = [
    !filters.showPersonal,
    !filters.showOrganizational,
    filters.status !== 'all',
    filters.collaborative !== 'all',
    filters.selectedOrgs.length > 0,
  ].filter(Boolean).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Filter className="w-4 h-4 mr-2" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge className="ml-2 bg-primary text-primary-foreground text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Filtrar Agenda</h4>

          {/* Tipo de tareas */}
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase">Tipo de Tareas</Label>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-primary" />
                Personales
              </div>
              <Switch
                checked={filters.showPersonal}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, showPersonal: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-accent-foreground" />
                Organizacionales
              </div>
              <Switch
                checked={filters.showOrganizational}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, showOrganizational: checked })
                }
              />
            </div>
          </div>

          {/* Estado */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase">Estado</Label>
            <Select
              value={filters.status}
              onValueChange={(value: 'all' | 'pending' | 'completed') =>
                onFiltersChange({ ...filters, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="completed">Completadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Colaborativas */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase">Colaborativas</Label>
            <Select
              value={filters.collaborative}
              onValueChange={(value: 'all' | 'yes' | 'no') =>
                onFiltersChange({ ...filters, collaborative: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="yes">Solo colaborativas</SelectItem>
                <SelectItem value="no">Solo individuales</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset */}
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() =>
                onFiltersChange({
                  showPersonal: true,
                  showOrganizational: true,
                  selectedOrgs: [],
                  status: 'all',
                  collaborative: 'all',
                })
              }
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface AgendaStatsProps {
  stats: GlobalAgendaStats;
}

export function AgendaStats({ stats }: AgendaStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <div className="text-2xl font-bold text-foreground">{stats.total_hours.toFixed(1)}h</div>
              <div className="text-xs text-muted-foreground">Total semana</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-accent/5 border-accent/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-accent-foreground" />
            <div>
              <div className="text-2xl font-bold text-foreground">{stats.org_tasks}</div>
              <div className="text-xs text-muted-foreground">Organizacionales</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-secondary/50 border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-foreground" />
            <div>
              <div className="text-2xl font-bold text-foreground">{stats.personal_tasks}</div>
              <div className="text-xs text-muted-foreground">Personales</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-green-500/5 border-green-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-foreground">{stats.completed_tasks}</div>
              <div className="text-xs text-muted-foreground">Completadas</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
