import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DollarSign, Plus, Trash2, TrendingUp, Calculator } from 'lucide-react';
import { Step3Props, MonetizationStrategy, CostStructureItem } from '@/types/startup-onboarding';

const MONETIZATION_OPTIONS: { value: MonetizationStrategy; label: string; description: string }[] = [
  { value: 'subscription', label: 'Suscripción', description: 'Pago recurrente mensual/anual' },
  { value: 'one-time', label: 'Pago Único', description: 'Una sola compra' },
  { value: 'freemium', label: 'Freemium', description: 'Gratis básico + premium de pago' },
  { value: 'marketplace', label: 'Marketplace', description: 'Comisión por transacción' },
  { value: 'advertising', label: 'Publicidad', description: 'Gratis para usuarios, ingresos por ads' },
  { value: 'other', label: 'Otro', description: 'Modelo híbrido o diferente' },
];

const COMMON_COST_CATEGORIES = [
  'Hosting/Infraestructura',
  'Desarrollo/Tech',
  'Marketing',
  'Salarios',
  'Herramientas SaaS',
  'Legal/Contabilidad',
  'Oficina',
  'Otros',
];

export default function StartupStep3BusinessModel({ data, updateData }: Step3Props) {
  const [newRevenueStream, setNewRevenueStream] = useState('');
  const [newCost, setNewCost] = useState<CostStructureItem>({ category: '', estimatedMonthlyCost: 0 });

  const addRevenueStream = () => {
    if (newRevenueStream.trim()) {
      updateData({ revenueStreams: [...data.revenueStreams, newRevenueStream.trim()] });
      setNewRevenueStream('');
    }
  };

  const removeRevenueStream = (index: number) => {
    updateData({ revenueStreams: data.revenueStreams.filter((_, i) => i !== index) });
  };

  const addCost = () => {
    if (newCost.category.trim() && newCost.estimatedMonthlyCost > 0) {
      updateData({ costStructure: [...data.costStructure, { ...newCost }] });
      setNewCost({ category: '', estimatedMonthlyCost: 0 });
    }
  };

  const removeCost = (index: number) => {
    updateData({ costStructure: data.costStructure.filter((_, i) => i !== index) });
  };

  const totalMonthlyCost = data.costStructure.reduce((sum, cost) => sum + cost.estimatedMonthlyCost, 0);
  const ltvCacRatio = data.unitEconomics.estimatedCAC > 0 
    ? (data.unitEconomics.estimatedLTV / data.unitEconomics.estimatedCAC).toFixed(1) 
    : '0';

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2 pb-6 border-b">
        <DollarSign className="w-12 h-12 text-primary mx-auto" />
        <h2 className="text-2xl font-bold">Modelo de Negocio</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Define cómo vas a generar ingresos y cuáles son tus costos
        </p>
      </div>

      {/* Monetization Strategy */}
      <Card className="border-2 border-primary/30">
        <CardHeader>
          <CardTitle>Estrategia de Monetización</CardTitle>
          <CardDescription>¿Cómo vas a cobrar a tus clientes?</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={data.monetizationStrategy}
            onValueChange={(value) => updateData({ monetizationStrategy: value as MonetizationStrategy })}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MONETIZATION_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                  <Label htmlFor={option.value} className="cursor-pointer flex-1">
                    <span className="font-semibold">{option.label}</span>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Pricing Tiers */}
      <Card className="border-2 border-green-300 dark:border-green-700">
        <CardHeader>
          <CardTitle>Hipótesis de Pricing</CardTitle>
          <CardDescription>Define tus rangos de precio (puedes ajustar después)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Plan Básico</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={data.pricingHypothesis.lowestTier || ''}
                  onChange={(e) => updateData({
                    pricingHypothesis: { ...data.pricingHypothesis, lowestTier: parseFloat(e.target.value) || 0 }
                  })}
                  placeholder="29"
                />
                <span className="text-muted-foreground">€/mes</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Plan Pro</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={data.pricingHypothesis.middleTier || ''}
                  onChange={(e) => updateData({
                    pricingHypothesis: { ...data.pricingHypothesis, middleTier: parseFloat(e.target.value) || 0 }
                  })}
                  placeholder="79"
                />
                <span className="text-muted-foreground">€/mes</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Plan Enterprise</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={data.pricingHypothesis.highestTier || ''}
                  onChange={(e) => updateData({
                    pricingHypothesis: { ...data.pricingHypothesis, highestTier: parseFloat(e.target.value) || 0 }
                  })}
                  placeholder="199"
                />
                <span className="text-muted-foreground">€/mes</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Streams */}
      <Card>
        <CardHeader>
          <CardTitle>Fuentes de Ingreso</CardTitle>
          <CardDescription>¿De dónde vendrá el dinero?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.revenueStreams.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.revenueStreams.map((stream, index) => (
                <Badge key={index} variant="secondary" className="gap-2 px-3 py-1">
                  {stream}
                  <button onClick={() => removeRevenueStream(index)} className="text-destructive">×</button>
                </Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="Ej: Suscripciones, Consultoría, Add-ons..."
              value={newRevenueStream}
              onChange={(e) => setNewRevenueStream(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addRevenueStream()}
            />
            <Button onClick={addRevenueStream} disabled={!newRevenueStream.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Añadir
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cost Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Estructura de Costos</span>
            <Badge variant="outline">Total: €{totalMonthlyCost.toLocaleString()}/mes</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.costStructure.length > 0 && (
            <div className="space-y-2">
              {data.costStructure.map((cost, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-medium">{cost.category}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">€{cost.estimatedMonthlyCost.toLocaleString()}/mes</span>
                    <Button variant="ghost" size="sm" onClick={() => removeCost(index)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 p-4 border-2 border-dashed rounded-lg">
            <div className="flex flex-wrap gap-2 mb-3">
              {COMMON_COST_CATEGORIES.map((cat) => (
                <Badge
                  key={cat}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => setNewCost({ ...newCost, category: cat })}
                >
                  {cat}
                </Badge>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Categoría"
                value={newCost.category}
                onChange={(e) => setNewCost({ ...newCost, category: e.target.value })}
              />
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  placeholder="500"
                  value={newCost.estimatedMonthlyCost || ''}
                  onChange={(e) => setNewCost({ ...newCost, estimatedMonthlyCost: parseFloat(e.target.value) || 0 })}
                />
                <span className="text-muted-foreground text-sm">€/mes</span>
              </div>
            </div>
            <Button onClick={addCost} className="w-full" disabled={!newCost.category.trim() || newCost.estimatedMonthlyCost <= 0}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Costo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Unit Economics */}
      <Card className="border-2 border-blue-300 dark:border-blue-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Unit Economics (Estimados)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>CAC Estimado</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={data.unitEconomics.estimatedCAC || ''}
                  onChange={(e) => updateData({
                    unitEconomics: { ...data.unitEconomics, estimatedCAC: parseFloat(e.target.value) || 0 }
                  })}
                  placeholder="50"
                />
                <span className="text-muted-foreground">€</span>
              </div>
              <p className="text-xs text-muted-foreground">Costo de adquirir 1 cliente</p>
            </div>
            <div className="space-y-2">
              <Label>LTV Estimado</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={data.unitEconomics.estimatedLTV || ''}
                  onChange={(e) => updateData({
                    unitEconomics: { ...data.unitEconomics, estimatedLTV: parseFloat(e.target.value) || 0 }
                  })}
                  placeholder="500"
                />
                <span className="text-muted-foreground">€</span>
              </div>
              <p className="text-xs text-muted-foreground">Valor de por vida del cliente</p>
            </div>
            <div className="space-y-2">
              <Label>Ratio LTV:CAC</Label>
              <div className={`p-3 rounded-lg text-center font-bold text-2xl ${
                parseFloat(ltvCacRatio) >= 3 ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' :
                parseFloat(ltvCacRatio) >= 1 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300' :
                'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
              }`}>
                {ltvCacRatio}:1
              </div>
              <p className="text-xs text-muted-foreground">Ideal: 3:1 o superior</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">🎯 Tips para este paso:</h4>
        <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1 list-disc list-inside">
          <li>El pricing es una HIPÓTESIS - ajustarás con datos reales</li>
          <li>Ratio LTV:CAC de 3:1 = negocio saludable</li>
          <li>Si tus costos son mayores que ingresos proyectados, necesitas más capital o menos gastos</li>
        </ul>
      </div>
    </div>
  );
}
