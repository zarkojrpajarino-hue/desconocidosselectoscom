import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Link2, RefreshCw, ArrowUpRight, ArrowDownLeft, ArrowLeftRight } from 'lucide-react';
import { useHubSpotIntegration } from '@/hooks/integrations';
import { IntegrationStatusBadge, IntegrationSyncLog } from '@/components/integrations';
import type { SyncStatus } from '@/components/integrations/IntegrationStatusBadge';

interface HubSpotTabProps {
  organizationId: string | null;
}

export function HubSpotTab({ organizationId }: HubSpotTabProps) {
  const { 
    account, 
    loading, 
    connecting,
    syncing,
    importing,
    connect,
    disconnect,
    toggleSync,
    syncNow,
    importNow,
    syncBidirectional
  } = useHubSpotIntegration(organizationId);

  const [syncMode, setSyncMode] = useState<'export' | 'import' | 'bidirectional'>('export');

  const handleSync = async () => {
    switch (syncMode) {
      case 'export':
        await syncNow();
        break;
      case 'import':
        await importNow();
        break;
      case 'bidirectional':
        await syncBidirectional();
        break;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  if (!account) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-6">
          <Link2 className="w-16 h-16 mx-auto text-orange-500" />
          <div>
            <h3 className="text-xl font-semibold mb-2">Conecta tu HubSpot CRM</h3>
            <p className="text-muted-foreground mb-4">Sincroniza leads bidireccional con HubSpot</p>
          </div>
          <Button 
            onClick={connect} 
            disabled={connecting} 
            size="lg" 
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Link2 className="w-5 h-5 mr-2" />
            {connecting ? 'Conectando...' : 'Conectar con HubSpot'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentStatus: SyncStatus = syncing || importing 
    ? 'syncing' 
    : (account.last_sync_status as SyncStatus) || 'active';

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Link2 className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{account.hub_domain}</p>
                  <IntegrationStatusBadge 
                    status={currentStatus} 
                    lastSync={account.last_sync_at}
                    showTime
                    size="sm"
                  />
                </div>
                <p className="text-sm text-muted-foreground">Portal ID: {account.portal_id}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                  <span>{account.total_contacts_synced || 0} contactos</span>
                  <span>{account.total_deals_synced || 0} deals</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={account.sync_enabled} onCheckedChange={toggleSync} />
              <Button variant="outline" size="sm" onClick={disconnect}>
                Desconectar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sincronización</CardTitle>
          <CardDescription>Elige la dirección de sincronización</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Sync Mode Selector */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={syncMode === 'export' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSyncMode('export')}
                className="flex-1"
              >
                <ArrowUpRight className="w-4 h-4 mr-1" />
                Exportar
              </Button>
              <Button
                variant={syncMode === 'import' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSyncMode('import')}
                className="flex-1"
              >
                <ArrowDownLeft className="w-4 h-4 mr-1" />
                Importar
              </Button>
              <Button
                variant={syncMode === 'bidirectional' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSyncMode('bidirectional')}
                className="flex-1"
              >
                <ArrowLeftRight className="w-4 h-4 mr-1" />
                Bidireccional
              </Button>
            </div>

            {/* Mode Description */}
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              {syncMode === 'export' && (
                <p><strong>Exportar:</strong> Envía leads de OPTIMUS-K → HubSpot</p>
              )}
              {syncMode === 'import' && (
                <p><strong>Importar:</strong> Trae contactos de HubSpot → OPTIMUS-K</p>
              )}
              {syncMode === 'bidirectional' && (
                <p><strong>Bidireccional:</strong> Sincroniza en ambas direcciones (exporta primero, luego importa)</p>
              )}
            </div>

            {/* Sync Button */}
            <Button 
              onClick={handleSync} 
              disabled={syncing || importing}
              className="w-full"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing || importing ? 'animate-spin' : ''}`} />
              {syncing || importing ? 'Sincronizando...' : `Sincronizar ${syncMode === 'bidirectional' ? 'Todo' : ''}`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sync Log */}
      {organizationId && account && (
        <IntegrationSyncLog
          integrationTable="hubspot_contact_mappings"
          accountId={account.id}
          organizationId={organizationId}
          title="Historial de Sincronización"
        />
      )}

      {/* Field Mapping */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mapeo de Campos</CardTitle>
          <CardDescription>Correspondencia entre OPTIMUS-K y HubSpot</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { local: 'Lead.name', remote: 'Contact.firstname + lastname' },
              { local: 'Lead.email', remote: 'Contact.email' },
              { local: 'Lead.company', remote: 'Contact.company' },
              { local: 'Lead.phone', remote: 'Contact.phone' },
              { local: 'Lead.estimated_value', remote: 'Deal.amount' },
              { local: 'Lead.stage', remote: 'Deal.dealstage' }
            ].map((mapping, i) => (
              <div key={i} className="flex items-center justify-between p-2 border rounded-lg text-sm">
                <span className="font-medium text-foreground">{mapping.local}</span>
                <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{mapping.remote}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
