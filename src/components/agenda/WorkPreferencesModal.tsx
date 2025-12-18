import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Users, User, Info, Lock, Calendar, Bell, AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

interface WorkPreferencesModalProps {
  onPreferencesChange?: () => void;
}

const TEAM_SIZE_OPTIONS = [
  { value: '1-5', label: '1-5 personas' },
  { value: '6-10', label: '6-10 personas' },
  { value: '11-20', label: '11-20 personas' },
  { value: '21-30', label: '21-30 personas' },
  { value: '31-50', label: '31-50 personas' },
  { value: '51-100', label: '51-100 personas' },
  { value: '100+', label: 'Más de 100 personas' },
];

const DAYS_OF_WEEK = [
  { value: '0', label: 'Domingo', short: 'Dom' },
  { value: '1', label: 'Lunes', short: 'Lun' },
  { value: '2', label: 'Martes', short: 'Mar' },
  { value: '3', label: 'Miércoles', short: 'Mié' },
  { value: '4', label: 'Jueves', short: 'Jue' },
  { value: '5', label: 'Viernes', short: 'Vie' },
  { value: '6', label: 'Sábado', short: 'Sáb' },
];

export function WorkPreferencesModal({ onPreferencesChange }: WorkPreferencesModalProps) {
  const { t } = useTranslation();
  const { user, currentOrganizationId, userOrganizations } = useAuth();
  const [hasTeam, setHasTeam] = useState<boolean | null>(null);
  const [teamSize, setTeamSize] = useState<string>('');
  const [collaborativePercentage, setCollaborativePercentage] = useState(0);
  const [weekStartDay, setWeekStartDay] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgName, setOrgName] = useState<string>('');

  // Verificar si el usuario es admin
  const currentUserRole = userOrganizations.find(
    org => org.organization_id === currentOrganizationId
  )?.role || 'member';
  const isAdmin = currentUserRole === 'admin';

  useEffect(() => {
    if (currentOrganizationId) {
      loadPreferences();
    }
  }, [currentOrganizationId]);

  const loadPreferences = async () => {
    if (!currentOrganizationId) return;
    
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', currentOrganizationId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orgData = data as any;
        // Only set values if they exist in database - leave blank if not configured
        setHasTeam(orgData.has_team ?? null);
        setTeamSize(orgData.team_size ?? '');
        setCollaborativePercentage(orgData.collaborative_percentage ?? 0);
        setWeekStartDay(orgData.week_start_day !== null && orgData.week_start_day !== undefined 
          ? String(orgData.week_start_day) 
          : '');
        setOrgName(orgData.name ?? 'tu organización');
      }
    } catch (error) {
      console.error('Error loading work preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const notifyTeamMembers = async (newWeekStartDay: number) => {
    if (!currentOrganizationId || !hasTeam) return;
    
    try {
      // Get all team members except admin
      const { data: teamMembers } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('organization_id', currentOrganizationId)
        .neq('user_id', user?.id);

      if (!teamMembers || teamMembers.length === 0) return;

      const dayName = DAYS_OF_WEEK.find(d => d.value === String(newWeekStartDay))?.label || 'Lunes';
      
      // Create notifications for all team members using correct smart_alerts schema
      const notifications = teamMembers.map(member => ({
        user_id: member.user_id,
        organization_id: currentOrganizationId,
        title: 'Cambio en el ciclo semanal',
        message: `El administrador ha establecido que la semana de ${orgName} ahora comienza los ${dayName}. Tus tareas y OKRs se calcularán según este nuevo ciclo.`,
        alert_type: 'week_start_change',
        severity: 'info' as const,
        source: 'system',
        priority: 'high',
        read: false,
        dismissed: false
      }));

      await supabase.from('smart_alerts').insert(notifications);
      
      console.log(`Notified ${teamMembers.length} team members about week start change`);
    } catch (error) {
      console.error('Error notifying team members:', error);
    }
  };

  const savePreferences = async () => {
    if (!isAdmin) {
      toast.error('Solo el administrador puede modificar la configuración');
      return;
    }

    if (!currentOrganizationId) return;
    
    // Validate week_start_day is set
    if (!weekStartDay) {
      toast.error('Debes seleccionar el día de inicio de semana');
      return;
    }

    // Validate has_team is set
    if (hasTeam === null) {
      toast.error('Debes indicar si tu organización cuenta con equipo');
      return;
    }
    
    setSaving(true);
    try {
      const newWeekStartDay = parseInt(weekStartDay);
      
      // Get current org data to check if week_start_day changed
      const { data: currentOrg } = await supabase
        .from('organizations')
        .select('week_start_day')
        .eq('id', currentOrganizationId)
        .single();

      const weekStartChanged = currentOrg?.week_start_day !== newWeekStartDay;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase
        .from('organizations')
        .update({
          has_team: hasTeam,
          team_size: hasTeam ? teamSize : null,
          collaborative_percentage: hasTeam ? collaborativePercentage : 0,
          week_start_day: newWeekStartDay,
        } as any)
        .eq('id', currentOrganizationId);

      if (error) throw error;

      // Notify team if week start day changed and has team
      if (weekStartChanged && hasTeam) {
        await notifyTeamMembers(newWeekStartDay);
      }

      const dayName = DAYS_OF_WEEK.find(d => d.value === weekStartDay)?.label || 'Lunes';
      
      toast.success('Configuración guardada', {
        description: `Semana comienza los ${dayName}${hasTeam ? ` · Equipo: ${teamSize} · ${collaborativePercentage}% colaborativas` : ' · Modo individual'}`,
      });

      if (weekStartChanged && hasTeam) {
        toast.info('Equipo notificado', {
          description: 'Todos los miembros del equipo han sido notificados del cambio.',
          icon: <Bell className="w-4 h-4" />,
        });
      }
      
      onPreferencesChange?.();
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleTeamToggle = (value: boolean) => {
    if (!isAdmin) return;
    setHasTeam(value);
    if (!value) {
      setCollaborativePercentage(0);
      setTeamSize('');
    } else {
      setCollaborativePercentage(70);
      if (!teamSize) setTeamSize('1-5');
    }
  };

  const individualPercentage = 100 - collaborativePercentage;
  const selectedDayName = weekStartDay ? DAYS_OF_WEEK.find(d => d.value === weekStartDay)?.label : null;

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-8 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base md:text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Configuración de Trabajo
          {!isAdmin && (
            <Badge variant="secondary" className="ml-2 gap-1">
              <Lock className="w-3 h-3" />
              Solo lectura
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {isAdmin 
            ? 'Establece cómo trabaja tu equipo. Esta configuración aplica a todos los miembros.'
            : 'Configuración establecida por el administrador de tu organización.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* ========================================= */}
        {/* WEEK START DAY - OBLIGATORIO */}
        {/* ========================================= */}
        <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border-2 border-primary/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-full bg-primary/20">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <Label className="text-sm font-semibold flex items-center gap-2">
                Día de inicio de semana
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  OBLIGATORIO
                </Badge>
              </Label>
              <p className="text-xs text-muted-foreground">
                Todos los OKRs y tareas se calcularán desde este día
              </p>
            </div>
          </div>
          
          <Select 
            value={weekStartDay} 
            onValueChange={(value) => isAdmin && setWeekStartDay(value)}
            disabled={!isAdmin}
          >
            <SelectTrigger className="w-full bg-background border-primary/30">
              <SelectValue placeholder="Selecciona el día de inicio" />
            </SelectTrigger>
            <SelectContent>
              {DAYS_OF_WEEK.map((day) => (
                <SelectItem key={day.value} value={day.value}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{day.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isAdmin && hasTeam === true && selectedDayName && (
            <Alert className="mt-3 border-amber-500/30 bg-amber-500/10">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Importante para tu equipo
              </AlertTitle>
              <AlertDescription className="text-xs text-amber-600 dark:text-amber-300">
                Al cambiar este día, <strong>todos los miembros serán notificados automáticamente</strong>.
                La app enviará un recordatorio semanal cada {selectedDayName}.
              </AlertDescription>
            </Alert>
          )}
          
          {selectedDayName ? (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Actualmente: La semana comienza los <strong className="text-primary">{selectedDayName}</strong>
            </p>
          ) : (
            <p className="text-xs text-orange-500 mt-2 text-center font-medium">
              Selecciona un día de inicio de semana
            </p>
          )}
        </div>

        <Separator />

        {/* Team Question */}
        <div className="p-4 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-full bg-muted">
              <Users className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <Label className="text-sm font-semibold flex items-center gap-2">
                ¿La organización cuenta con equipo?
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  OBLIGATORIO
                </Badge>
              </Label>
              <p className="text-xs text-muted-foreground">
                Esto determina cómo se generan y distribuyen las tareas
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => isAdmin && handleTeamToggle(false)}
              disabled={!isAdmin}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                hasTeam === false 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:border-primary/50 bg-background'
              } ${!isAdmin ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <User className={`w-6 h-6 mb-2 ${hasTeam === false ? 'text-primary' : 'text-muted-foreground'}`} />
              <div className={`font-medium text-sm ${hasTeam === false ? 'text-primary' : ''}`}>Individual</div>
              <p className="text-xs text-muted-foreground mt-1">Trabajo autónomo/emprendedor</p>
            </button>
            
            <button
              type="button"
              onClick={() => isAdmin && handleTeamToggle(true)}
              disabled={!isAdmin}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                hasTeam === true 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:border-primary/50 bg-background'
              } ${!isAdmin ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <Users className={`w-6 h-6 mb-2 ${hasTeam === true ? 'text-primary' : 'text-muted-foreground'}`} />
              <div className={`font-medium text-sm ${hasTeam === true ? 'text-primary' : ''}`}>Con Equipo</div>
              <p className="text-xs text-muted-foreground mt-1">Trabajo colaborativo</p>
            </button>
          </div>
          
          {hasTeam === null && (
            <p className="text-xs text-orange-500 mt-2 text-center font-medium">
              Selecciona una opción
            </p>
          )}
        </div>

        {/* Team Size Selector (only if has team) */}
        {hasTeam && (
          <div className="p-4 bg-muted/30 rounded-lg border border-border ml-4 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <div>
                <Label className="text-sm font-medium">¿Con cuántas personas cuenta su equipo?</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Esto nos ayuda a personalizar las fases y tareas
                </p>
              </div>
            </div>
            <Select 
              value={teamSize} 
              onValueChange={(value) => isAdmin && setTeamSize(value)}
              disabled={!isAdmin}
            >
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder="Selecciona el tamaño del equipo" />
              </SelectTrigger>
              <SelectContent>
                {TEAM_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Distribution Slider (only if has team) */}
        {hasTeam && (
          <div className="space-y-4 p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Distribución de tareas</Label>
              <Badge variant="outline" className="text-xs">
                {isAdmin ? 'Configurable' : 'Establecido por admin'}
              </Badge>
            </div>
            
            <div className="space-y-3">
              <Slider
                value={[collaborativePercentage]}
                onValueChange={(value) => isAdmin && setCollaborativePercentage(value[0])}
                max={100}
                step={10}
                className="w-full"
                disabled={!isAdmin}
              />
              
              <div className="flex justify-between gap-4">
                <div className="flex-1 p-3 bg-primary/10 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary">{collaborativePercentage}%</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Users className="w-3 h-3" />
                    Colaborativas
                  </div>
                </div>
                <div className="flex-1 p-3 bg-accent/10 rounded-lg text-center">
                  <div className="text-2xl font-bold text-accent-foreground">{individualPercentage}%</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <User className="w-3 h-3" />
                    Individuales
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mode indicator for solo workers */}
        {hasTeam === false && (
          <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <User className="w-4 h-4 text-accent-foreground" />
              Modo Individual Activado
            </div>
            <p className="text-xs text-muted-foreground">
              Todas las tareas serán individuales.{selectedDayName && ` Tu semana personal comienza los ${selectedDayName}.`}
            </p>
          </div>
        )}

        <Separator />

        {/* Explanations Accordion */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="week-start">
            <AccordionTrigger className="text-sm hover:no-underline">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                ¿Cómo funciona el inicio de semana?
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <p>
                El <strong>día de inicio de semana</strong> determina cuándo comienza cada ciclo semanal para tu organización.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Los <strong>OKRs semanales</strong> se generan al inicio de cada semana</li>
                <li>Las <strong>tareas</strong> se distribuyen según este ciclo</li>
                <li>Los <strong>recordatorios</strong> se envían el día de inicio</li>
                <li>Todos los miembros comparten el mismo ciclo</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="collaborative">
            <AccordionTrigger className="text-sm hover:no-underline">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                ¿Qué son las tareas colaborativas?
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Las <strong>tareas colaborativas</strong> tienen un <strong>líder asignado</strong> 
                que es experto en esa área funcional.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>El líder guía y valida el trabajo</li>
                <li>Fomenta el aprendizaje entre áreas</li>
                <li>Mejora la calidad del resultado</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="individual">
            <AccordionTrigger className="text-sm hover:no-underline">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-accent-foreground" />
                ¿Qué son las tareas individuales?
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Las <strong>tareas individuales</strong> son completamente autónomas.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Trabajas a tu propio ritmo</li>
                <li>Total autonomía en la ejecución</li>
                <li>Ideal para tareas de tu especialidad</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Save Button - only for admin */}
        {isAdmin ? (
          <Button
            onClick={savePreferences}
            disabled={saving}
            className="w-full bg-gradient-primary"
          >
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        ) : (
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Info className="w-4 h-4" />
              Solo el administrador puede modificar esta configuración
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
