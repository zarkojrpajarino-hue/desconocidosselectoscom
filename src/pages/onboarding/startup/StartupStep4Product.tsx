import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Plus, Trash2, Code, Clock } from 'lucide-react';
import { Step4Props, CoreFeature, FeaturePriority, FeatureComplexity } from '@/types/startup-onboarding';

const COMMON_TECH_STACK = [
  'React', 'Next.js', 'Vue', 'Node.js', 'Python', 'Django', 'PostgreSQL', 
  'MongoDB', 'AWS', 'Supabase', 'Firebase', 'Stripe', 'TypeScript'
];

export default function StartupStep4Product({ data, updateData }: Step4Props) {
  const [newTech, setNewTech] = useState('');
  const [newFeature, setNewFeature] = useState<CoreFeature>({
    feature: '',
    priority: 'must-have',
    complexity: 'medium'
  });

  const addTech = (tech: string) => {
    if (tech.trim() && !data.technologyStack.includes(tech)) {
      updateData({ technologyStack: [...data.technologyStack, tech.trim()] });
      setNewTech('');
    }
  };

  const removeTech = (index: number) => {
    updateData({ technologyStack: data.technologyStack.filter((_, i) => i !== index) });
  };

  const addFeature = () => {
    if (newFeature.feature.trim()) {
      updateData({ coreFeatures: [...data.coreFeatures, { ...newFeature }] });
      setNewFeature({ feature: '', priority: 'must-have', complexity: 'medium' });
    }
  };

  const removeFeature = (index: number) => {
    updateData({ coreFeatures: data.coreFeatures.filter((_, i) => i !== index) });
  };

  const mustHaveCount = data.coreFeatures.filter(f => f.priority === 'must-have').length;
  const highComplexityCount = data.coreFeatures.filter(f => f.complexity === 'high').length;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2 pb-6 border-b">
        <Package className="w-12 h-12 text-primary mx-auto" />
        <h2 className="text-2xl font-bold">Producto y MVP</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Define qué vas a construir primero y cómo
        </p>
      </div>

      {/* MVP Description */}
      <Card className="border-2 border-primary/30">
        <CardHeader>
          <CardTitle>Descripción del MVP</CardTitle>
          <CardDescription>
            ¿Cuál es la versión mínima de tu producto que resuelve el problema principal?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Ej: Landing page con formulario de espera + dashboard básico que muestra 3 métricas principales + integración con 1 fuente de datos (Google Sheets). Sin login complejo, solo email magic link. Sin móvil, solo web."
            value={data.mvpDescription}
            onChange={(e) => updateData({ mvpDescription: e.target.value })}
            rows={5}
          />
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
            <strong>MVP = Mínimo Viable</strong>: El producto más simple que valida tu hipótesis principal.
          </div>
        </CardContent>
      </Card>

      {/* Core Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Features del MVP</span>
            <div className="flex gap-2">
              <Badge variant="outline">{mustHaveCount} must-have</Badge>
              <Badge variant="outline" className={highComplexityCount > 3 ? 'border-red-500' : ''}>
                {highComplexityCount} complejas
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.coreFeatures.length > 0 && (
            <div className="space-y-2">
              {data.coreFeatures.map((feature, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <span className="font-medium">{feature.feature}</span>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={feature.priority === 'must-have' ? 'default' : 'secondary'}>
                        {feature.priority}
                      </Badge>
                      <Badge variant="outline" className={
                        feature.complexity === 'high' ? 'border-red-500 text-red-600' :
                        feature.complexity === 'medium' ? 'border-yellow-500 text-yellow-600' :
                        'border-green-500 text-green-600'
                      }>
                        {feature.complexity}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeFeature(index)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 p-4 border-2 border-dashed rounded-lg">
            <Label className="font-semibold">➕ Agregar Feature</Label>
            <Input
              placeholder="Ej: Dashboard con métricas principales"
              value={newFeature.feature}
              onChange={(e) => setNewFeature({ ...newFeature, feature: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Prioridad</Label>
                <Select
                  value={newFeature.priority}
                  onValueChange={(value) => setNewFeature({ ...newFeature, priority: value as FeaturePriority })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="must-have">Must-have</SelectItem>
                    <SelectItem value="nice-to-have">Nice-to-have</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Complejidad</Label>
                <Select
                  value={newFeature.complexity}
                  onValueChange={(value) => setNewFeature({ ...newFeature, complexity: value as FeatureComplexity })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={addFeature} className="w-full" disabled={!newFeature.feature.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Feature
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Development Timeline */}
      <Card className="border-2 border-accent/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Timeline de Desarrollo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tiempo estimado para MVP (semanas)</Label>
            <Input
              type="number"
              min="1"
              max="52"
              value={data.developmentTimeline || ''}
              onChange={(e) => updateData({ developmentTimeline: parseInt(e.target.value) || 0 })}
              placeholder="8"
            />
          </div>
          {data.developmentTimeline > 0 && (
            <div className={`p-4 rounded-lg ${
              data.developmentTimeline <= 4 ? 'bg-green-50 dark:bg-green-950/20 border border-green-200' :
              data.developmentTimeline <= 8 ? 'bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200' :
              'bg-red-50 dark:bg-red-950/20 border border-red-200'
            }`}>
              <p className="font-semibold">
                {data.developmentTimeline <= 4 ? '✅ Timeline agresivo pero alcanzable' :
                 data.developmentTimeline <= 8 ? '⚠️ Timeline razonable' :
                 '❌ Considera reducir scope - 8+ semanas es mucho para un MVP'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Technology Stack */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Stack Tecnológico
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {COMMON_TECH_STACK.map((tech) => {
              const isSelected = data.technologyStack.includes(tech);
              return (
                <Badge
                  key={tech}
                  variant={isSelected ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    if (isSelected) {
                      updateData({ technologyStack: data.technologyStack.filter(t => t !== tech) });
                    } else {
                      addTech(tech);
                    }
                  }}
                >
                  {tech}
                </Badge>
              );
            })}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Otra tecnología..."
              value={newTech}
              onChange={(e) => setNewTech(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTech(newTech)}
            />
            <Button onClick={() => addTech(newTech)} disabled={!newTech.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {data.technologyStack.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground mr-2">Tu stack:</span>
              {data.technologyStack.map((tech, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {tech}
                  <button onClick={() => removeTech(index)} className="text-destructive ml-1">×</button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Technical Challenges */}
      <Card>
        <CardHeader>
          <CardTitle>Retos Técnicos</CardTitle>
          <CardDescription>¿Qué partes técnicas te preocupan o son más difíciles?</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Ej: Integración con APIs bancarias (seguridad, certificaciones). Procesamiento en tiempo real de datos. Escalabilidad si tenemos muchos usuarios. No tengo experiencia con infraestructura cloud..."
            value={data.technicalChallenges}
            onChange={(e) => updateData({ technicalChallenges: e.target.value })}
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">🎯 Tips para este paso:</h4>
        <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1 list-disc list-inside">
          <li>MVP debe tener máximo 3-5 features "must-have"</li>
          <li>Si timeline &gt; 8 semanas, tu MVP es demasiado grande</li>
          <li>Usa tecnologías que ya conoces - no es momento de aprender</li>
        </ul>
      </div>
    </div>
  );
}
