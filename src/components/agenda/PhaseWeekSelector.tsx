import React from 'react';
import { format, addWeeks, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface PhaseWeek {
  weekNumber: number;
  weekStart: string;
  weekEnd: string;
  taskCount: number;
  hasAvailability: boolean;
}

interface PhaseWeekSelectorProps {
  weeks: PhaseWeek[];
  selectedWeeks: number[];
  onSelectionChange: (weeks: number[]) => void;
  mode: 'single' | 'multiple';
}

export function PhaseWeekSelector({
  weeks,
  selectedWeeks,
  onSelectionChange,
  mode,
}: PhaseWeekSelectorProps) {
  if (mode === 'single') {
    return (
      <Select
        value={selectedWeeks[0]?.toString() || ''}
        onValueChange={(value) => onSelectionChange([parseInt(value)])}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecciona una semana" />
        </SelectTrigger>
        <SelectContent>
          {weeks.map((week) => (
            <SelectItem key={week.weekNumber} value={week.weekNumber.toString()}>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Semana {week.weekNumber}</span>
                <span className="text-muted-foreground text-xs">
                  ({format(parseISO(week.weekStart), "d MMM", { locale: es })})
                </span>
                <Badge variant="secondary" className="text-xs">
                  {week.taskCount} tareas
                </Badge>
                {week.hasAvailability && (
                  <Check className="w-3 h-3 text-success" />
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Multiple selection mode
  const toggleWeek = (weekNumber: number) => {
    if (selectedWeeks.includes(weekNumber)) {
      onSelectionChange(selectedWeeks.filter((w) => w !== weekNumber));
    } else {
      onSelectionChange([...selectedWeeks, weekNumber].sort((a, b) => a - b));
    }
  };

  const selectAll = () => {
    onSelectionChange(weeks.map((w) => w.weekNumber));
  };

  const selectNone = () => {
    onSelectionChange([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {selectedWeeks.length} de {weeks.length} semanas seleccionadas
        </span>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="text-xs text-primary hover:underline"
          >
            Todas
          </button>
          <span className="text-muted-foreground">|</span>
          <button
            onClick={selectNone}
            className="text-xs text-primary hover:underline"
          >
            Ninguna
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
        {weeks.map((week) => (
          <button
            key={week.weekNumber}
            onClick={() => toggleWeek(week.weekNumber)}
            className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
              selectedWeeks.includes(week.weekNumber)
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card hover:bg-muted/50'
            }`}
          >
            <div
              className={`w-5 h-5 rounded border flex items-center justify-center ${
                selectedWeeks.includes(week.weekNumber)
                  ? 'bg-primary border-primary'
                  : 'border-border'
              }`}
            >
              {selectedWeeks.includes(week.weekNumber) && (
                <Check className="w-3 h-3 text-primary-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Semana {week.weekNumber}</p>
              <p className="text-xs text-muted-foreground truncate">
                {format(parseISO(week.weekStart), "d MMM", { locale: es })} - {week.taskCount} tareas
              </p>
            </div>
            {week.hasAvailability && (
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                <Check className="w-3 h-3 mr-1" />
                Config
              </Badge>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
