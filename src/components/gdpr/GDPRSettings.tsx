import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Shield, Download, Trash2 } from 'lucide-react';
import { useGDPR } from '@/hooks/useGDPR';

export function GDPRSettings() {
  const { requestDataExport, requestAccountDeletion, updateCookieConsent, exports } = useGDPR();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Cumplimiento GDPR
        </h3>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Exportar tus Datos</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Descarga todos tus datos personales en formato JSON
            </p>
            <Button
              onClick={() => requestDataExport.mutate()}
              disabled={requestDataExport.isPending}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Solicitar Exportación
            </Button>
          </div>

          {exports && exports.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Historial de Exportaciones</h4>
              <div className="space-y-2">
                {exports.map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="text-sm font-medium">
                        {exp.request_type === 'data_export' ? 'Exportación de Datos' : 'Eliminación de Cuenta'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(exp.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={exp.status === 'completed' ? 'default' : 'secondary'}>
                      {exp.status}
                    </Badge>
                    {exp.status === 'completed' && exp.export_url && (
                      <a href={exp.export_url} download>
                        <Button size="sm" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2 text-destructive">Eliminar Cuenta</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Elimina permanentemente tu cuenta y todos los datos asociados. Esta acción no se puede deshacer.
              Tienes 30 días para cancelar la eliminación.
            </p>
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Solicitar Eliminación
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Preferencias de Cookies</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Cookies Necesarias</p>
              <p className="text-sm text-muted-foreground">Requeridas para el funcionamiento</p>
            </div>
            <Switch checked disabled />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Cookies de Analytics</p>
              <p className="text-sm text-muted-foreground">Nos ayudan a mejorar el producto</p>
            </div>
            <Switch
              onCheckedChange={(checked) =>
                updateCookieConsent.mutate({ analytics: checked, marketing: false, preferences: false })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Cookies de Marketing</p>
              <p className="text-sm text-muted-foreground">Anuncios y contenido personalizado</p>
            </div>
            <Switch
              onCheckedChange={(checked) =>
                updateCookieConsent.mutate({ analytics: false, marketing: checked, preferences: false })
              }
            />
          </div>
        </div>
      </Card>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar Cuenta?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">
              ¿Estás seguro de que quieres eliminar tu cuenta? Esto:
            </p>
            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
              <li>Programará la eliminación en 30 días</li>
              <li>Eliminará todos tus datos personales</li>
              <li>Borrará todas tus tareas, leads y OKRs</li>
              <li>Te eliminará de todas las organizaciones</li>
            </ul>
            <p className="text-sm font-medium">
              Puedes cancelar esto dentro de 30 días iniciando sesión nuevamente.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  requestAccountDeletion.mutate();
                  setShowDeleteConfirm(false);
                }}
              >
                Sí, Eliminar Mi Cuenta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
