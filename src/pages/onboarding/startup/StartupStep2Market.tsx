import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Plus, Trash2, Users, TrendingUp } from 'lucide-react';
import { Step2Props, Competitor } from '@/types/startup-onboarding';

export default function StartupStep2Market({ data, updateData }: Step2Props) {
  const [newPainPoint, setNewPainPoint] = useState('');
  const [newChannel, setNewChannel] = useState('');
  const [newCompetitor, setNewCompetitor] = useState<Competitor>({
    name: '',
    strengths: '',
    weaknesses: ''
  });

  const addPainPoint = () => {
    if (newPainPoint.trim()) {
      updateData({
        customerPainPoints: [...data.customerPainPoints, newPainPoint.trim()]
      });
      setNewPainPoint('');
    }
  };

  const removePainPoint = (index: number) => {
    updateData({
      customerPainPoints: data.customerPainPoints.filter((_, i) => i !== index)
    });
  };

  const addChannel = () => {
    if (newChannel.trim()) {
      updateData({
        distributionChannels: [...data.distributionChannels, newChannel.trim()]
      });
      setNewChannel('');
    }
  };

  const removeChannel = (index: number) => {
    updateData({
      distributionChannels: data.distributionChannels.filter((_, i) => i !== index)
    });
  };

  const addCompetitor = () => {
    if (newCompetitor.name.trim() && newCompetitor.strengths.trim()) {
      updateData({
        competitors: [...data.competitors, { ...newCompetitor }]
      });
      setNewCompetitor({ name: '', strengths: '', weaknesses: '' });
    }
  };

  const removeCompetitor = (index: number) => {
    updateData({
      competitors: data.competitors.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2 pb-6 border-b">
        <Target className="w-12 h-12 text-primary mx-auto" />
        <h2 className="text-2xl font-bold">Mercado y Clientes</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Define quién es tu cliente ideal y qué tan grande es tu oportunidad
        </p>
      </div>

      <Card className="border-2 border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Perfil del Cliente Ideal (ICP)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Ej: Emprendedor digital entre 28-45 años, con negocio online facturando €5K-50K/mes, busca herramientas que le ahorren tiempo..."
            value={data.idealCustomerProfile}
            onChange={(e) => updateData({ idealCustomerProfile: e.target.value })}
            rows={5}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pain Points Críticos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.customerPainPoints.length > 0 && (
            <div className="space-y-2">
              {data.customerPainPoints.map((pain, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <span className="flex-1">{pain}</span>
                  <Button variant="ghost" size="sm" onClick={() => removePainPoint(index)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="Ej: Pierden 10+ horas/semana en tareas manuales"
              value={newPainPoint}
              onChange={(e) => setNewPainPoint(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addPainPoint()}
            />
            <Button onClick={addPainPoint} disabled={!newPainPoint.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Añadir
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-accent/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Tamaño del Mercado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>TAM (Total)</Label>
              <Input
                placeholder="Ej: €5B"
                value={data.marketSize.TAM}
                onChange={(e) => updateData({ marketSize: { ...data.marketSize, TAM: e.target.value } })}
              />
            </div>
            <div className="space-y-2">
              <Label>SAM (Alcanzable)</Label>
              <Input
                placeholder="Ej: €500M"
                value={data.marketSize.SAM}
                onChange={(e) => updateData({ marketSize: { ...data.marketSize, SAM: e.target.value } })}
              />
            </div>
            <div className="space-y-2">
              <Label>SOM (Objetivo)</Label>
              <Input
                placeholder="Ej: €10M"
                value={data.marketSize.SOM}
                onChange={(e) => updateData({ marketSize: { ...data.marketSize, SOM: e.target.value } })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Análisis de Competencia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.competitors.length > 0 && (
            <div className="space-y-3">
              {data.competitors.map((competitor, index) => (
                <Card key={index} className="bg-muted/30">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{competitor.name}</h4>
                      <Button variant="ghost" size="sm" onClick={() => removeCompetitor(index)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p><strong className="text-green-600">Fortalezas:</strong> {competitor.strengths}</p>
                      <p><strong className="text-red-600">Debilidades:</strong> {competitor.weaknesses}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="space-y-3 p-4 border-2 border-dashed rounded-lg">
            <Label className="font-semibold">➕ Agregar Competidor</Label>
            <Input
              placeholder="Nombre del competidor"
              value={newCompetitor.name}
              onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
            />
            <Textarea
              placeholder="¿Qué hacen bien?"
              value={newCompetitor.strengths}
              onChange={(e) => setNewCompetitor({ ...newCompetitor, strengths: e.target.value })}
              rows={2}
            />
            <Textarea
              placeholder="¿Dónde fallan?"
              value={newCompetitor.weaknesses}
              onChange={(e) => setNewCompetitor({ ...newCompetitor, weaknesses: e.target.value })}
              rows={2}
            />
            <Button onClick={addCompetitor} className="w-full" disabled={!newCompetitor.name.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Competidor
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-green-300 dark:border-green-700">
        <CardHeader>
          <CardTitle>Tu Ventaja Competitiva</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="¿Por qué un cliente elegiría tu producto?"
            value={data.competitiveAdvantage}
            onChange={(e) => updateData({ competitiveAdvantage: e.target.value })}
            rows={4}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Canales de Distribución</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.distributionChannels.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.distributionChannels.map((channel, index) => (
                <Badge key={index} variant="secondary" className="gap-2 px-3 py-1">
                  {channel}
                  <button onClick={() => removeChannel(index)} className="text-destructive hover:text-destructive/80">×</button>
                </Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="Ej: E-commerce, Amazon, Distribuidores..."
              value={newChannel}
              onChange={(e) => setNewChannel(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addChannel()}
            />
            <Button onClick={addChannel} disabled={!newChannel.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Añadir
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
