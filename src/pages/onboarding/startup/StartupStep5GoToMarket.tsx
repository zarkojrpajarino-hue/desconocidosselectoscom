import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Megaphone, Plus, Trash2, Rocket, Users, Handshake } from 'lucide-react';
import { Step5Props, LaunchStrategy, AcquisitionChannel, ChannelPriority } from '@/types/startup-onboarding';

const LAUNCH_STRATEGIES: { value: LaunchStrategy; label: string; description: string }[] = [
  { value: 'stealth', label: 'Stealth', description: 'Desarrollo privado, sin comunicación pública' },
  { value: 'beta', label: 'Beta Privada', description: 'Acceso limitado a usuarios seleccionados' },
  { value: 'public', label: 'Lanzamiento Público', description: 'Launch abierto a todos desde día 1' },
  { value: 'gradual', label: 'Gradual', description: 'Roll-out por etapas, ampliando acceso' },
];

const PRIORITY_OPTIONS: { value: ChannelPriority; label: string; color: string }[] = [
  { value: 'high', label: 'Alta', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
  { value: 'medium', label: 'Media', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300' },
  { value: 'low', label: 'Baja', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
];

const COMMON_CHANNELS = [
  'Content Marketing (Blog/SEO)', 'Paid Ads (Google/Meta)', 'Social Media Orgánico',
  'Email Marketing', 'Product Hunt Launch', 'LinkedIn Outreach', 'Reddit/Forums',
  'Influencer Marketing', 'Partnerships B2B', 'Community Building', 'Referral Program', 'Direct Sales',
];

export default function StartupStep5GoToMarket({ data, updateData }: Step5Props) {
  const [newChannel, setNewChannel] = useState<AcquisitionChannel>({
    channel: '', priority: 'medium', estimatedCost: 0
  });

  const addChannel = () => {
    if (newChannel.channel.trim()) {
      updateData({ acquisitionChannels: [...data.acquisitionChannels, { ...newChannel }] });
      setNewChannel({ channel: '', priority: 'medium', estimatedCost: 0 });
    }
  };

  const removeChannel = (index: number) => {
    updateData({ acquisitionChannels: data.acquisitionChannels.filter((_, i) => i !== index) });
  };

  const addCommonChannel = (channelName: string) => {
    if (!data.acquisitionChannels.some(ch => ch.channel === channelName)) {
      updateData({ acquisitionChannels: [...data.acquisitionChannels, { channel: channelName, priority: 'medium', estimatedCost: 0 }] });
    }
  };

  const totalMarketingCost = data.acquisitionChannels.reduce((sum, ch) => sum + ch.estimatedCost, 0);
  const highPriorityCount = data.acquisitionChannels.filter(ch => ch.priority === 'high').length;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2 pb-6 border-b">
        <Megaphone className="w-12 h-12 text-primary mx-auto" />
        <h2 className="text-2xl font-bold">Go-to-Market Strategy</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Define cómo vas a lanzar tu producto y conseguir tus primeros clientes
        </p>
      </div>

      <Card className="border-2 border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            Estrategia de Lanzamiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={data.launchStrategy} onValueChange={(value) => updateData({ launchStrategy: value as LaunchStrategy })}>
            <div className="space-y-3">
              {LAUNCH_STRATEGIES.map((strategy) => (
                <div key={strategy.value} className="flex items-start space-x-3">
                  <RadioGroupItem value={strategy.value} id={strategy.value} className="mt-1" />
                  <Label htmlFor={strategy.value} className="cursor-pointer">
                    <span className="font-semibold">{strategy.label}</span>
                    <p className="text-sm text-muted-foreground">{strategy.description}</p>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="border-2 border-green-300 dark:border-green-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Estrategia para los Primeros 100 Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Ej: Semanas 1-2: Contactar 100 founders en LinkedIn. Semanas 3-4: Publicar en comunidades. Semanas 5-6: Lanzar en Product Hunt..."
            value={data.first100CustomersStrategy}
            onChange={(e) => updateData({ first100CustomersStrategy: e.target.value })}
            rows={6}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Presupuesto de Marketing Inicial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              value={data.initialMarketingBudget || ''}
              onChange={(e) => updateData({ initialMarketingBudget: parseFloat(e.target.value) || 0 })}
              placeholder="1000"
              className="w-40"
            />
            <span className="text-muted-foreground">EUR (primeros 3 meses)</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-blue-300 dark:border-blue-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Canales de Adquisición</span>
            <Badge variant="outline">Total: €{totalMarketingCost.toLocaleString()}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.acquisitionChannels.length > 0 && (
            <div className="space-y-2">
              {data.acquisitionChannels.map((channel, index) => {
                const priorityOption = PRIORITY_OPTIONS.find(p => p.value === channel.priority);
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <span className="font-medium">{channel.channel}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={priorityOption?.color}>{priorityOption?.label}</Badge>
                        <span className="text-sm text-muted-foreground">€{channel.estimatedCost}/mes</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeChannel(index)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {COMMON_CHANNELS.map((channel) => {
              const exists = data.acquisitionChannels.some(ch => ch.channel === channel);
              return (
                <Badge key={channel} variant="outline" className={`cursor-pointer hover:bg-primary hover:text-primary-foreground ${exists ? 'opacity-50' : ''}`}
                  onClick={() => addCommonChannel(channel)}>
                  {channel}
                </Badge>
              );
            })}
          </div>

          <div className="space-y-3 p-4 border-2 border-dashed rounded-lg">
            <Input placeholder="Canal personalizado" value={newChannel.channel}
              onChange={(e) => setNewChannel({ ...newChannel, channel: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Select value={newChannel.priority} onValueChange={(value) => setNewChannel({ ...newChannel, priority: value as ChannelPriority })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" min="0" placeholder="€/mes" value={newChannel.estimatedCost || ''}
                onChange={(e) => setNewChannel({ ...newChannel, estimatedCost: parseFloat(e.target.value) || 0 })} />
            </div>
            <Button onClick={addChannel} className="w-full" disabled={!newChannel.channel.trim()}>
              <Plus className="w-4 h-4 mr-2" />Agregar Canal
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Estrategia de Contenido</CardTitle></CardHeader>
        <CardContent>
          <Textarea placeholder="Ej: 2 blog posts/semana, newsletter semanal, threads en Twitter..."
            value={data.contentStrategy} onChange={(e) => updateData({ contentStrategy: e.target.value })} rows={4} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Handshake className="w-5 h-5" />
            Estrategia de Partnerships
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea placeholder="Ej: Contactar influencers, partnerships con consultoras, integraciones..."
            value={data.partnershipsStrategy} onChange={(e) => updateData({ partnershipsStrategy: e.target.value })} rows={4} />
        </CardContent>
      </Card>
    </div>
  );
}
