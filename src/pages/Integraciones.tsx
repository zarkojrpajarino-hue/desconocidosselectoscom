import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Check, X, MessageSquare, Link2, Calendar, ListTodo, LayoutDashboard, Zap, Send, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { LockedFeatureCard } from "@/components/plan";

interface IntegrationInfo {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  features: string[];
  useCases: string[];
  plans: ('starter' | 'professional' | 'enterprise')[];
  minPlan: string;
}

const integrations: IntegrationInfo[] = [{
  id: 'google-calendar',
  name: 'Google Calendar',
  icon: <Calendar className="h-8 w-8" />,
  color: 'text-blue-500',
  description: 'Sincroniza automáticamente tus tareas con Google Calendar. Nunca olvides una deadline.',
  features: ['Sincronización automática de tareas', 'Eventos con recordatorios', 'Vista de agenda semanal unificada', 'Bloqueo de tiempo para trabajo profundo'],
  useCases: ['Agenda tus tareas semanales automáticamente', 'Recibe recordatorios antes de cada deadline', 'Visualiza tu carga de trabajo en el calendario'],
  plans: ['starter', 'professional', 'enterprise'],
  minPlan: 'Starter'
}, {
  id: 'slack',
  name: 'Slack',
  icon: <MessageSquare className="h-8 w-8" />,
  color: 'text-purple-500',
  description: 'Recibe notificaciones en tiempo real sobre leads, tareas y OKRs directamente en Slack.',
  features: ['Notificaciones de nuevos leads', 'Alertas de OKRs en riesgo', 'Celebración de tareas completadas', 'Resumen diario automático'],
  useCases: ['El equipo de ventas recibe alertas cuando llega un lead caliente', 'Los managers ven alertas cuando un OKR está en riesgo', 'Celebra logros del equipo automáticamente en el canal'],
  plans: ['professional', 'enterprise'],
  minPlan: 'Professional'
}, {
  id: 'hubspot',
  name: 'HubSpot',
  icon: <Link2 className="h-8 w-8" />,
  color: 'text-orange-500',
  description: 'Sincronización bidireccional con HubSpot CRM. Tus contactos y deals siempre actualizados.',
  features: ['Importación automática de contactos', 'Exportación de leads a HubSpot', 'Sincronización de deals y valores', 'Mapeo de campos personalizado'],
  useCases: ['Importa todos tus contactos de HubSpot con un clic', 'Los leads que ganes en OPTIMUS-K se crean en HubSpot automáticamente', 'El equipo de marketing ve métricas unificadas'],
  plans: ['professional', 'enterprise'],
  minPlan: 'Professional'
}, {
  id: 'outlook',
  name: 'Outlook Calendar',
  icon: <Calendar className="h-8 w-8" />,
  color: 'text-sky-600',
  description: 'Para equipos Microsoft. Sincroniza tareas y eventos con Outlook Calendar.',
  features: ['Sincronización con Outlook 365', 'Eventos con recordatorios', 'Soporte para cuentas corporativas', 'Integración con Teams (próximamente)'],
  useCases: ['Empresas que usan Microsoft 365', 'Sincroniza tu agenda de trabajo con OPTIMUS-K', 'Ve todas tus reuniones y tareas en un solo lugar'],
  plans: ['professional', 'enterprise'],
  minPlan: 'Professional'
}, {
  id: 'trello',
  name: 'Trello',
  icon: <LayoutDashboard className="h-8 w-8" />,
  color: 'text-sky-500',
  description: 'Exporta tareas a tableros de Trello. Ideal si tu equipo ya usa Trello.',
  features: ['Exportación de tareas como tarjetas', 'Mapeo de fases a columnas', 'Etiquetas automáticas', 'Sincronización de estados'],
  useCases: ['Equipos que ya usan Trello para gestión de proyectos', 'Visualiza tareas de OPTIMUS-K en tu tablero favorito', 'Mantén Trello actualizado sin trabajo manual'],
  plans: ['professional', 'enterprise'],
  minPlan: 'Professional'
}, {
  id: 'asana',
  name: 'Asana',
  icon: <ListTodo className="h-8 w-8" />,
  color: 'text-rose-500',
  description: 'Conecta con Asana para gestión de proyectos avanzada.',
  features: ['Exportación de tareas a proyectos', 'Sincronización de deadlines', 'Asignación de responsables', 'Subtareas automáticas'],
  useCases: ['Equipos que usan Asana para gestión de proyectos', 'Sincroniza deadlines entre plataformas', 'El equipo de producto ve todo en Asana'],
  plans: ['professional', 'enterprise'],
  minPlan: 'Professional'
}, {
  id: 'zapier',
  name: 'Zapier',
  icon: <Zap className="h-8 w-8" />,
  color: 'text-orange-600',
  description: 'Conecta OPTIMUS-K con +5000 aplicaciones mediante Zapier.',
  features: ['Webhooks personalizados', 'Triggers para eventos', 'Conexión con +5000 apps', 'Automatizaciones ilimitadas'],
  useCases: ['Cuando ganas un lead → crea factura en Stripe', 'Cuando completas tarea → notifica en Discord', 'Nuevo lead → añade a Mailchimp'],
  plans: ['professional', 'enterprise'],
  minPlan: 'Professional'
}];
const Integraciones = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const planAccess = usePlanAccess();
  const [suggestionName, setSuggestionName] = useState('');
  const [suggestionEmail, setSuggestionEmail] = useState('');
  const [suggestionTool, setSuggestionTool] = useState('');
  const [suggestionReason, setSuggestionReason] = useState('');
  const [sending, setSending] = useState(false);

  // Check plan access for integrations
  const hasAccess = planAccess.hasFeature('google_calendar');

  const handleSuggestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestionTool.trim()) {
      toast.error('Por favor indica qué herramienta echas en falta');
      return;
    }
    setSending(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('¡Gracias por tu sugerencia!', {
        description: 'Evaluaremos añadir esta integración pronto.'
      });
      setSuggestionName('');
      setSuggestionEmail('');
      setSuggestionTool('');
      setSuggestionReason('');
    } catch (error) {
      toast.error('Error al enviar sugerencia');
    } finally {
      setSending(false);
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'Starter':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Professional':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'Enterprise':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Show locked card for users without access (logged in users only)
  if (user && !hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20 md:pb-0">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
          <div className="container flex h-14 md:h-16 items-center justify-between px-3 md:px-4 gap-2">
            <div className="flex items-center gap-2 md:gap-4 min-w-0">
              <Button variant="ghost" size="sm" onClick={() => navigate('/home')}>
                <ArrowLeft className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Volver</span>
              </Button>
              <span className="font-bold text-lg md:text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent truncate">
                Integraciones
              </span>
            </div>
          </div>
        </header>
        
        <div className="container mx-auto p-6 max-w-3xl pt-12">
          <LockedFeatureCard
            icon="🔗"
            title="Integraciones Avanzadas"
            description="Conecta OPTIMUS-K con tus herramientas favoritas para automatizar flujos de trabajo."
            requiredPlan="professional"
            features={[
              'Google Calendar - Sincroniza tareas automáticamente',
              'Slack - Notificaciones en tiempo real',
              'HubSpot - CRM bidireccional',
              'Outlook - Para equipos Microsoft',
              'Zapier - +5000 aplicaciones'
            ]}
            onUpgrade={() => navigate('/#pricing')}
          />
        </div>
      </div>
    );
  }
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 md:h-16 items-center justify-between px-3 md:px-4 gap-2">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
            <span className="font-bold text-lg md:text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent truncate">
              Integraciones
            </span>
          </div>
          <Button size="sm" onClick={() => navigate('/signup')}>
            <span className="hidden sm:inline">Empezar Gratis</span>
            <span className="sm:hidden">Empezar</span>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <div className="container mx-auto px-3 md:px-4 pt-8 md:pt-16 pb-6 md:pb-12 text-center">
        <h1 className="text-2xl md:text-5xl font-bold mb-3 md:mb-4">
          Conecta con tus Herramientas Favoritas
        </h1>
        <p className="text-sm md:text-xl text-muted-foreground max-w-2xl mx-auto mb-4 md:mb-8">
          OPTIMUS-K se integra con las herramientas que ya usas. 
          Automatiza flujos y elimina el trabajo manual.
        </p>
        <div className="flex justify-center gap-2 md:gap-4 flex-wrap">
          <Badge variant="outline" className="text-xs md:text-sm py-1 px-2 md:px-3">
            <Check className="h-3 w-3 md:h-4 md:w-4 mr-1 text-green-500" />
            7 integraciones
          </Badge>
          <Badge variant="outline" className="text-xs md:text-sm py-1 px-2 md:px-3">
            <Zap className="h-3 w-3 md:h-4 md:w-4 mr-1 text-orange-500" />
            +5000 apps via Zapier
          </Badge>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {integrations.map(integration => <Card key={integration.id} className="p-4 md:p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                <div className={`p-2 md:p-3 rounded-lg md:rounded-xl bg-muted ${integration.color} flex-shrink-0`}>
                  <div className="w-6 h-6 md:w-8 md:h-8">{integration.icon}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1 md:gap-2 mb-1">
                    <h3 className="text-lg md:text-xl font-bold">{integration.name}</h3>
                    <Badge variant="outline" className={`text-xs ${getPlanBadgeColor(integration.minPlan)}`}>
                      {integration.minPlan === 'Starter' ? <Check className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                      {integration.minPlan}+
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs md:text-sm">{integration.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {/* Features */}
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wide">
                    Características
                  </h4>
                  <ul className="space-y-1">
                    {integration.features.map((feature, i) => <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>)}
                  </ul>
                </div>

                {/* Use Cases */}
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wide">
                    Ejemplos de Uso
                  </h4>
                  <ul className="space-y-1">
                    {integration.useCases.map((useCase, i) => <li key={i} className="flex items-start gap-2 text-sm">
                        <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{useCase}</span>
                      </li>)}
                  </ul>
                </div>
              </div>

              {/* Plans Available */}
              <div className="mt-4 pt-4 border-t flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Disponible en:</span>
                {integration.plans.map(plan => <Badge key={plan} variant="secondary" className="text-xs capitalize">
                    {plan}
                  </Badge>)}
              </div>
            </Card>)}
        </div>
      </div>

      {/* API Section */}
      

      {/* Suggestion Form */}
      <div id="suggest" className="container mx-auto px-3 md:px-4 py-6 md:py-12">
        <Card className="max-w-2xl mx-auto p-4 md:p-8">
          <div className="text-center mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold mb-2">¿Echas en falta alguna herramienta?</h2>
            <p className="text-sm md:text-base text-muted-foreground">
              Cuéntanos qué integración te gustaría ver.
            </p>
          </div>

          <form onSubmit={handleSuggestionSubmit} className="space-y-3 md:space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Tu nombre (opcional)</label>
                <Input placeholder="Juan García" value={suggestionName} onChange={e => setSuggestionName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Tu email (opcional)</label>
                <Input type="email" placeholder="juan@empresa.com" value={suggestionEmail} onChange={e => setSuggestionEmail(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                ¿Qué herramienta echas en falta? <span className="text-destructive">*</span>
              </label>
              <Input placeholder="Ej: Notion, Monday.com, Pipedrive..." value={suggestionTool} onChange={e => setSuggestionTool(e.target.value)} required />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                ¿Para qué la usarías? (opcional)
              </label>
              <Textarea placeholder="Describe cómo te ayudaría esta integración..." value={suggestionReason} onChange={e => setSuggestionReason(e.target.value)} rows={3} />
            </div>

            <Button type="submit" className="w-full" disabled={sending}>
              {sending ? <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </> : <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Sugerencia
                </>}
            </Button>
          </form>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 OPTIMUS-K. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>;
};
export default Integraciones;