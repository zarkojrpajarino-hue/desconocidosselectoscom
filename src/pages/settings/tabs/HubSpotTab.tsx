import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Link2, RefreshCw } from 'lucide-react';
import { useHubSpotIntegration } from '@/hooks/integrations';

interface HubSpotTabProps {
  organizationId: string | null;
}

export function HubSpotTab({ organizationId }: HubSpotTabProps) {
  const { 
    account, 
    loading, 
    connecting,
    syncing,
    connect,
    disconnect,
    toggleSync,
    syncNow
  } = useHubSpotIntegration(organizationId);

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

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Link2 className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="font-semibold">{account.hub_domain}</p>
                <p className="text-sm text-muted-foreground">Portal ID: {account.portal_id}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                  <span>{account.total_contacts_synced} contactos</span>
                  <span>{account.total_deals_synced} deals</span>
                  {account.last_sync_at && (
                    <span>Última sync: {new Date(account.last_sync_at).toLocaleString()}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={syncNow} disabled={syncing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Sincronizando...' : 'Sincronizar'}
              </Button>
              <Switch checked={account.sync_enabled} onCheckedChange={toggleSync} />
              <Button variant="outline" size="sm" onClick={disconnect}>
                Desconectar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuración de Sincronización</CardTitle>
          <CardDescription>Mapeo de campos entre OPTIMUS-K y HubSpot</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">Lead.name</span>
              <span className="text-muted-foreground">→</span>
              <span className="text-sm text-muted-foreground">Contact.firstname + lastname</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">Lead.email</span>
              <span className="text-muted-foreground">→</span>
              <span className="text-sm text-muted-foreground">Contact.email</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">Lead.company</span>
              <span className="text-muted-foreground">→</span>
              <span className="text-sm text-muted-foreground">Contact.company</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">Lead.estimated_value</span>
              <span className="text-muted-foreground">→</span>
              <span className="text-sm text-muted-foreground">Deal.amount</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">Lead.stage</span>
              <span className="text-muted-foreground">→</span>
              <span className="text-sm text-muted-foreground">Deal.dealstage</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
