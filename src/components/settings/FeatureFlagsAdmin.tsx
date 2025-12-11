import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useFeatureFlags, FeatureFlag } from '@/hooks/useFeatureFlags';
import { Flag, Plus, TrendingUp } from 'lucide-react';

/**
 * Admin panel for managing feature flags
 */
export function FeatureFlagsAdmin() {
  const { flags, getFlagsWithStatus, toggleFeature, isToggling } = useFeatureFlags();
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);

  const flagsWithStatus = getFlagsWithStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Flag className="h-8 w-8" />
            Feature Flags
          </h1>
          <p className="text-muted-foreground mt-1">
            Controla la disponibilidad de funcionalidades
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Flags</p>
          <p className="text-2xl font-bold">{flags.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Habilitados</p>
          <p className="text-2xl font-bold text-green-600">
            {flagsWithStatus.filter(f => f.isEnabled).length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Personalizados</p>
          <p className="text-2xl font-bold text-primary">
            {flagsWithStatus.filter(f => f.hasOverride).length}
          </p>
        </Card>
      </div>

      {/* Flags List */}
      <div className="space-y-3">
        {flagsWithStatus.map(flag => (
          <Card key={flag.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-medium">{flag.name}</h3>
                  <Badge variant={flag.isEnabled ? 'default' : 'secondary'}>
                    {flag.isEnabled ? 'Habilitado' : 'Deshabilitado'}
                  </Badge>
                  {flag.hasOverride && (
                    <Badge variant="outline">
                      Personalizado
                    </Badge>
                  )}
                </div>

                {flag.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {flag.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Default: {flag.default_enabled ? 'On' : 'Off'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={flag.isEnabled}
                  onCheckedChange={(checked) => 
                    toggleFeature({ flagId: flag.id, enabled: checked })
                  }
                  disabled={isToggling}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingFlag(flag)}
                >
                  Ver
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {flags.length === 0 && (
          <Card className="p-12 text-center">
            <Flag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">No hay feature flags</h3>
            <p className="text-sm text-muted-foreground">
              Los feature flags se configuran a nivel de sistema
            </p>
          </Card>
        )}
      </div>

      {/* View Flag Modal */}
      {editingFlag && (
        <FlagDetailModal
          flag={editingFlag}
          open={!!editingFlag}
          onOpenChange={(open) => !open && setEditingFlag(null)}
        />
      )}
    </div>
  );
}

interface FlagDetailModalProps {
  flag: FeatureFlag;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function FlagDetailModal({ flag, open, onOpenChange }: FlagDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalles del Feature Flag</DialogTitle>
          <DialogDescription>
            Información sobre esta funcionalidad
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Nombre</Label>
            <Input value={flag.name} disabled />
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea value={flag.description || 'Sin descripción'} disabled rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Estado por defecto</Label>
              <Input value={flag.default_enabled ? 'Habilitado' : 'Deshabilitado'} disabled />
            </div>
            <div>
              <Label>Creado</Label>
              <Input value={new Date(flag.created_at).toLocaleDateString()} disabled />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
