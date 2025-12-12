import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Building2, User, Save } from 'lucide-react';
import { useGlobalAgendaSettings, useUpdateGlobalAgendaSettings } from '@/hooks/useGlobalAgenda';

const PRESET_COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#10B981',
  '#F59E0B', '#EF4444', '#14B8A6', '#F97316',
];

interface GlobalAgendaSettingsProps {
  onClose?: () => void;
}

export function GlobalAgendaSettings({ onClose }: GlobalAgendaSettingsProps) {
  const { user } = useAuth();
  const { data: settings, isLoading: settingsLoading } = useGlobalAgendaSettings();
  const updateSettings = useUpdateGlobalAgendaSettings();

  // Cargar organizaciones del usuario
  const { data: userOrgs, isLoading: orgsLoading } = useQuery({
    queryKey: ['user-organizations-for-agenda', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          organization_id,
          role,
          organizations (id, name, industry)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const [localSettings, setLocalSettings] = React.useState({
    linked_organization_ids: [] as string[],
    show_personal_tasks: true,
    show_org_tasks: true,
    org_color_map: {} as Record<string, string>,
  });

  React.useEffect(() => {
    if (settings) {
      setLocalSettings({
        linked_organization_ids: settings.linked_organization_ids || [],
        show_personal_tasks: settings.show_personal_tasks,
        show_org_tasks: settings.show_org_tasks,
        org_color_map: (settings.org_color_map as Record<string, string>) || {},
      });
    }
  }, [settings]);

  const handleOrgToggle = (orgId: string, checked: boolean) => {
    setLocalSettings((prev) => ({
      ...prev,
      linked_organization_ids: checked
        ? [...prev.linked_organization_ids, orgId]
        : prev.linked_organization_ids.filter((id) => id !== orgId),
    }));
  };

  const handleColorChange = (orgId: string, color: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      org_color_map: { ...prev.org_color_map, [orgId]: color },
    }));
  };

  const handleSave = () => {
    updateSettings.mutate(localSettings, {
      onSuccess: () => onClose?.(),
    });
  };

  if (settingsLoading || orgsLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          Configuración de Agenda Global
        </SheetTitle>
        <SheetDescription>
          Selecciona qué organizaciones y tareas ver en tu agenda unificada
        </SheetDescription>
      </SheetHeader>

      {/* Toggle tareas personales */}
      <div className="space-y-4">
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Tipos de Tareas</Label>

        <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-primary" />
            <div>
              <div className="font-medium text-foreground">Tareas Personales</div>
              <div className="text-xs text-muted-foreground">Gym, médico, etc.</div>
            </div>
          </div>
          <Switch
            checked={localSettings.show_personal_tasks}
            onCheckedChange={(checked) =>
              setLocalSettings((prev) => ({ ...prev, show_personal_tasks: checked }))
            }
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-accent-foreground" />
            <div>
              <div className="font-medium text-foreground">Tareas Organizacionales</div>
              <div className="text-xs text-muted-foreground">Trabajo de empresas</div>
            </div>
          </div>
          <Switch
            checked={localSettings.show_org_tasks}
            onCheckedChange={(checked) =>
              setLocalSettings((prev) => ({ ...prev, show_org_tasks: checked }))
            }
          />
        </div>
      </div>

      {/* Lista de organizaciones */}
      <div className="space-y-3">
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">
          Organizaciones Vinculadas
        </Label>

        {userOrgs && userOrgs.length > 0 ? (
          <div className="space-y-2">
            {userOrgs.map((org) => {
              const orgId = org.organization_id;
              const orgName = (org.organizations as { name?: string })?.name || 'Sin nombre';
              const isLinked = localSettings.linked_organization_ids.includes(orgId);
              const orgColor = localSettings.org_color_map[orgId] || PRESET_COLORS[0];

              return (
                <div key={orgId} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isLinked}
                      onCheckedChange={(checked) => handleOrgToggle(orgId, !!checked)}
                    />
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: orgColor }}
                    />
                    <span className="font-medium text-foreground">{orgName}</span>
                  </div>

                  {isLinked && (
                    <div className="flex gap-1">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
                            orgColor === color ? 'border-foreground' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => handleColorChange(orgId, color)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No tienes organizaciones asignadas</p>
        )}
      </div>

      {/* Botón guardar */}
      <Button
        onClick={handleSave}
        disabled={updateSettings.isPending}
        className="w-full"
      >
        <Save className="w-4 h-4 mr-2" />
        {updateSettings.isPending ? 'Guardando...' : 'Guardar Configuración'}
      </Button>
    </div>
  );
}
