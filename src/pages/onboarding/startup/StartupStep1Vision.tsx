import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Target, Sparkles } from 'lucide-react';
import { Step1Props } from '@/types/startup-onboarding';

export default function StartupStep1Vision({ data, updateData }: Step1Props) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2 pb-6 border-b">
        <Lightbulb className="w-12 h-12 text-primary mx-auto" />
        <h2 className="text-2xl font-bold">Tu Visión</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Cuéntanos sobre tu idea de negocio y el problema que quieres resolver
        </p>
      </div>

      <Card className="border-2 border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Información Básica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Nombre del Negocio *</Label>
            <Input
              id="businessName"
              placeholder="Ej: TechFlow, GrowthOS, Automatiza..."
              value={data.businessName}
              onChange={(e) => updateData({ businessName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline / Eslogan</Label>
            <Input
              id="tagline"
              placeholder="Ej: Automatiza tu negocio en minutos"
              value={data.tagline}
              onChange={(e) => updateData({ tagline: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Una frase corta que capture la esencia de tu producto</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            El Problema
          </CardTitle>
          <CardDescription>
            ¿Qué problema real estás resolviendo? Sé específico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Ej: Las PyMEs españolas pierden +10 horas/semana en tareas manuales repetitivas (facturación, seguimiento de clientes, reportes) porque las herramientas existentes son caras, complejas o no están adaptadas a sus necesidades..."
            value={data.problemStatement}
            onChange={(e) => updateData({ problemStatement: e.target.value })}
            rows={5}
            className="resize-none"
          />
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg text-sm">
            <strong>Tip:</strong> Un buen problema es específico, cuantificable y afecta a muchas personas.
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-green-300 dark:border-green-700">
        <CardHeader>
          <CardTitle>Tu Solución</CardTitle>
          <CardDescription>
            ¿Cómo resuelve tu producto el problema anterior?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Ej: Una plataforma todo-en-uno que automatiza facturación, seguimiento de clientes y reportes con una interfaz simple en español. Integra con las herramientas que ya usan (bancarias, email) sin configuración compleja..."
            value={data.solutionDescription}
            onChange={(e) => updateData({ solutionDescription: e.target.value })}
            rows={5}
            className="resize-none"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Propuesta de Valor Única (UVP)</CardTitle>
          <CardDescription>
            ¿Por qué tu solución es diferente/mejor que las alternativas?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Ej: Somos los únicos que combinamos automatización + simplicidad + precio accesible para PyMEs españolas. La competencia (Salesforce, HubSpot) es demasiado cara y compleja. Nosotros ofrecemos el 80% de funcionalidad por el 20% del precio."
            value={data.uniqueValueProposition}
            onChange={(e) => updateData({ uniqueValueProposition: e.target.value })}
            rows={4}
            className="resize-none"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>¿Por qué ahora?</CardTitle>
          <CardDescription>
            ¿Qué ha cambiado que hace este el momento perfecto para tu solución?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Ej: La pandemia aceleró la digitalización de PyMEs, pero muchas adoptaron herramientas a medias. Ahora buscan consolidar y optimizar. Además, la IA generativa permite automatizaciones que antes eran imposibles..."
            value={data.whyNow}
            onChange={(e) => updateData({ whyNow: e.target.value })}
            rows={4}
            className="resize-none"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inspiración Personal</CardTitle>
          <CardDescription>
            ¿Por qué TÚ? ¿Qué te motiva a resolver este problema?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Ej: Trabajé 5 años como consultor para PyMEs y vi el mismo problema en 100+ empresas. Mi familia tiene una PyME y sufren esto cada día. Tengo experiencia técnica para construir la solución..."
            value={data.inspiration}
            onChange={(e) => updateData({ inspiration: e.target.value })}
            rows={4}
            className="resize-none"
          />
        </CardContent>
      </Card>

      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          🎯 Tips para este paso:
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
          <li>Sé específico - "ayudar a empresas" es vago, "automatizar facturación para PyMEs" es concreto</li>
          <li>El problema debe ser REAL y DOLOROSO - si no duele, no pagarán</li>
          <li>Tu UVP debe ser clara en 1 frase - si necesitas explicar mucho, simplifícalo</li>
        </ul>
      </div>
    </div>
  );
}
