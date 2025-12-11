import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAutomatedReports } from '@/hooks/useAutomatedReports';
import { Mail, Calendar, TrendingUp } from 'lucide-react';

interface ReportSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal for configuring automated report settings
 */
export function ReportSettingsModal({ open, onOpenChange }: ReportSettingsModalProps) {
  const { 
    weeklyReport, 
    createReport,
    updateReport,
    isCreating,
    isUpdating,
  } = useAutomatedReports();

  const [reportType, setReportType] = useState<string>(weeklyReport?.report_type || 'weekly_summary');
  const [scheduleCron, setScheduleCron] = useState(weeklyReport?.schedule_cron || '0 9 * * 1');
  const [includeTasks, setIncludeTasks] = useState(weeklyReport?.sections?.includes('tasks') ?? true);
  const [includeLeads, setIncludeLeads] = useState(weeklyReport?.sections?.includes('leads') ?? true);
  const [includeOKRs, setIncludeOKRs] = useState(weeklyReport?.sections?.includes('okrs') ?? true);
  const [includeFinancial, setIncludeFinancial] = useState(weeklyReport?.sections?.includes('financial') ?? true);
  const [includeTeam, setIncludeTeam] = useState(weeklyReport?.sections?.includes('team') ?? true);

  const handleSave = () => {
    const sections = [];
    sections.push('overview');
    if (includeTasks) sections.push('tasks');
    if (includeLeads) sections.push('leads');
    if (includeOKRs) sections.push('okrs');
    if (includeFinancial) sections.push('financial');
    if (includeTeam) sections.push('team');

    const data = {
      report_type: reportType as 'weekly_summary' | 'daily_digest' | 'monthly_report',
      name: `${reportType === 'weekly_summary' ? 'Semanal' : reportType === 'daily_digest' ? 'Diario' : 'Mensual'} Report`,
      schedule_cron: scheduleCron,
      sections,
      is_active: true,
    };

    if (weeklyReport) {
      updateReport({ id: weeklyReport.id, ...data });
    } else {
      createReport(data);
    }
    onOpenChange(false);
  };

  const daysOfWeek = [
    { value: '0 9 * * 0', label: 'Domingo' },
    { value: '0 9 * * 1', label: 'Lunes' },
    { value: '0 9 * * 2', label: 'Martes' },
    { value: '0 9 * * 3', label: 'Miércoles' },
    { value: '0 9 * * 4', label: 'Jueves' },
    { value: '0 9 * * 5', label: 'Viernes' },
    { value: '0 9 * * 6', label: 'Sábado' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Configurar Reportes Automáticos
          </DialogTitle>
          <DialogDescription>
            Recibe un resumen de métricas clave por email automáticamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Schedule Settings */}
          <div>
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Frecuencia y horario
            </h3>
            
            <div className="grid gap-4">
              <div>
                <Label htmlFor="report-type">Tipo de reporte</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger id="report-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily_digest">Diario</SelectItem>
                    <SelectItem value="weekly_summary">Semanal</SelectItem>
                    <SelectItem value="monthly_report">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {reportType === 'weekly_summary' && (
                <div>
                  <Label htmlFor="day-of-week">Día de la semana</Label>
                  <Select value={scheduleCron} onValueChange={setScheduleCron}>
                    <SelectTrigger id="day-of-week">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {daysOfWeek.map(day => (
                        <SelectItem key={day.value} value={day.value}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Content Settings */}
          <div>
            <h3 className="text-sm font-medium mb-4">Contenido del reporte</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex-1">
                  <Label htmlFor="include-tasks" className="cursor-pointer">
                    Tareas
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tareas completadas, creadas y tasa de finalización
                  </p>
                </div>
                <Switch
                  id="include-tasks"
                  checked={includeTasks}
                  onCheckedChange={setIncludeTasks}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex-1">
                  <Label htmlFor="include-leads" className="cursor-pointer">
                    Leads & CRM
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Leads añadidos, ganados y tasa de conversión
                  </p>
                </div>
                <Switch
                  id="include-leads"
                  checked={includeLeads}
                  onCheckedChange={setIncludeLeads}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex-1">
                  <Label htmlFor="include-okrs" className="cursor-pointer">
                    OKRs
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Progreso de objetivos y key results
                  </p>
                </div>
                <Switch
                  id="include-okrs"
                  checked={includeOKRs}
                  onCheckedChange={setIncludeOKRs}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex-1">
                  <Label htmlFor="include-financial" className="cursor-pointer">
                    Financiero
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Revenue, gastos y beneficio neto
                  </p>
                </div>
                <Switch
                  id="include-financial"
                  checked={includeFinancial}
                  onCheckedChange={setIncludeFinancial}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex-1">
                  <Label htmlFor="include-team" className="cursor-pointer">
                    Equipo
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Actividad y performance del equipo
                  </p>
                </div>
                <Switch
                  id="include-team"
                  checked={includeTeam}
                  onCheckedChange={setIncludeTeam}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Example email note */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">Ejemplo de email</p>
                <p className="text-muted-foreground mt-1">
                  Recibirás un email con estas métricas en formato visual con gráficos,
                  comparativas vs. periodo anterior y enlaces directos a la plataforma.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isCreating || isUpdating}>
            {(isCreating || isUpdating) ? 'Guardando...' : 'Guardar configuración'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
