import { Calendar, Lock, Sparkles, Building2, RefreshCw, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

const features = [
  'Ver tareas de todas tus organizaciones',
  'Sincronizar con Google Calendar',
  'Sincronizar con Outlook Calendar',
  'Crear tareas personales',
  'Detectar conflictos automáticamente',
  'Colores por organización',
];

export function GlobalAgendaLockedCard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full border-primary/20 bg-gradient-to-br from-primary/5 via-background to-violet-500/5">
        <CardContent className="pt-8 pb-8 px-6 space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-lg">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-2xl font-bold text-foreground">Agenda Global</h2>
                <Badge variant="outline" className="text-primary border-primary/50">
                  <Lock className="w-3 h-3 mr-1" />
                  PRO
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Gestiona tareas de <strong>todas tus organizaciones</strong> en una sola vista sincronizada con tus calendarios
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3 py-4 border-y border-border">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                <span className="text-foreground">{feature}</span>
              </div>
            ))}
          </div>

          {/* Visual Preview */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="w-4 h-4" />
              <span>Vista previa</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <div className="h-8 bg-primary/10 rounded flex-1 flex items-center px-3 text-xs text-primary">
                  Org 1 - Tarea Marketing
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-violet-500" />
                <div className="h-8 bg-violet-500/10 rounded flex-1 flex items-center px-3 text-xs text-violet-600 dark:text-violet-400">
                  Org 2 - Reunión Ventas
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div className="h-8 bg-emerald-500/10 rounded flex-1 flex items-center px-3 text-xs text-emerald-600 dark:text-emerald-400">
                  Personal - Revisión KPIs
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/#pricing')} 
              className="w-full bg-gradient-to-r from-primary to-violet-600 hover:opacity-90"
              size="lg"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade a Professional - €249/mes
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Incluye Google Calendar, Outlook, IA avanzada y más
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
