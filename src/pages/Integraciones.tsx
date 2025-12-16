/**
 * PÁGINA DE INTEGRACIONES - Catálogo Informativo
 * Página pública accesible desde landing con detalles de planes
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  MessageSquare,
  Link2,
  ListTodo,
  Mail,
  Zap,
  Search,
  Check,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Lock,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { PlanType } from '@/constants/subscriptionLimits';

interface Integration {
  id: string;
  name: string;
  description: string;
  detailedDescription: string;
  icon: React.ReactNode;
  requiredPlan: PlanType;
  category: 'calendar' | 'communication' | 'crm' | 'productivity' | 'automation';
  benefits: string[];
  useCases: string[];
  features: string[];
  isConnected?: boolean;
  isComingSoon?: boolean;
  connectUrl?: string;
  documentationUrl?: string;
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sincroniza tus tareas y eventos automáticamente',
    detailedDescription: 'Conecta tu Google Calendar para tener toda tu agenda sincronizada. Las tareas de OPTIMUS-K aparecen automáticamente en tu calendario.',
    icon: <Calendar className="h-8 w-8" />,
    requiredPlan: 'starter',
    category: 'calendar',
    benefits: [
      'Sincronización bidireccional automática',
      'Tareas visibles en tu calendario habitual',
      'Recordatorios nativos de Google',
      'Vista unificada de trabajo y vida personal',
    ],
    useCases: [
      'Ver todas tus tareas semanales en Google Calendar',
      'Recibir notificaciones de vencimientos en tu móvil',
      'Bloquear tiempo para tareas importantes',
    ],
    features: [
      'Sincronización en tiempo real',
      'Soporte para múltiples calendarios',
      'Gestión de conflictos automática',
    ],
    connectUrl: '/integraciones-dashboard',
  },
  {
    id: 'outlook',
    name: 'Microsoft Outlook',
    description: 'Integración con Outlook Calendar y Teams',
    detailedDescription: 'Perfecta integración con el ecosistema Microsoft 365. Sincroniza calendarios, tareas y conecta con Microsoft Teams.',
    icon: <Mail className="h-8 w-8" />,
    requiredPlan: 'professional',
    category: 'calendar',
    benefits: [
      'Integración nativa con Microsoft 365',
      'Compatible con entornos corporativos',
      'Sincronización con Outlook Tasks',
    ],
    useCases: [
      'Mantener sincronizada tu agenda corporativa',
      'Recibir alertas de OKRs en Teams',
      'Bloquear tiempo para deep work',
    ],
    features: [
      'Soporte para calendarios compartidos',
      'Integración con Microsoft Teams',
      'Compatibilidad con Azure AD',
    ],
    connectUrl: '/integraciones-dashboard',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Notificaciones y bot inteligente en tu workspace',
    detailedDescription: 'Recibe notificaciones importantes directamente en Slack. El bot de OPTIMUS-K puede responder preguntas y crear tareas.',
    icon: <MessageSquare className="h-8 w-8" />,
    requiredPlan: 'professional',
    category: 'communication',
    benefits: [
      'Notificaciones instantáneas donde trabajas',
      'Bot inteligente para acciones rápidas',
      'Celebraciones automáticas de logros',
    ],
    useCases: [
      'Recibir alerta cuando un lead caliente entra al CRM',
      'Notificar al equipo cuando se completa un OKR',
      'Celebrar automáticamente cuando alguien gana una insignia',
    ],
    features: [
      'Comandos slash personalizados',
      'Notificaciones configurables',
      'Bot interactivo',
    ],
    connectUrl: '/integraciones-dashboard',
  },
  {
    id: 'hubspot',
    name: 'HubSpot CRM',
    description: 'Sincroniza leads y deals bidireccionalmente',
    detailedDescription: 'Importa y exporta leads automáticamente entre OPTIMUS-K y HubSpot. Mantén ambos CRMs sincronizados.',
    icon: <Link2 className="h-8 w-8" />,
    requiredPlan: 'professional',
    category: 'crm',
    benefits: [
      'Sincronización bidireccional de leads',
      'Importación masiva de contactos',
      'Exportación automática de deals cerrados',
    ],
    useCases: [
      'Importar tu base de leads existente desde HubSpot',
      'Crear automáticamente deals en HubSpot cuando cierras en OPTIMUS-K',
      'Mantener métricas unificadas entre ambas plataformas',
    ],
    features: [
      'API bidireccional',
      'Mapeo de campos personalizado',
      'Sincronización programada',
    ],
    connectUrl: '/integraciones-dashboard',
  },
  {
    id: 'asana',
    name: 'Asana',
    description: 'Sincroniza tareas con tus proyectos de Asana',
    detailedDescription: 'Conecta OPTIMUS-K con Asana para tener visibilidad completa. Las tareas se sincronizan automáticamente.',
    icon: <ListTodo className="h-8 w-8" />,
    requiredPlan: 'professional',
    category: 'productivity',
    benefits: [
      'Sincronización bidireccional de tareas',
      'Mapping automático de estados',
      'Actualización en tiempo real',
    ],
    useCases: [
      'Usar Asana para planificación y OPTIMUS-K para ejecución',
      'Mantener equipos sincronizados entre plataformas',
      'Vista unificada de todos tus proyectos',
    ],
    features: [
      'Sincronización de tareas y subtareas',
      'Mapeo de custom fields',
      'Soporte para múltiples workspaces',
    ],
    connectUrl: '/integraciones-dashboard',
  },
  {
    id: 'trello',
    name: 'Trello',
    description: 'Sincroniza tableros Kanban con OPTIMUS-K',
    detailedDescription: 'Convierte tarjetas de Trello en tareas de OPTIMUS-K automáticamente.',
    icon: <ListTodo className="h-8 w-8" />,
    requiredPlan: 'professional',
    category: 'productivity',
    benefits: [
      'Sincronización de tableros completos',
      'Mapping de listas a fases',
      'Actualización bidireccional',
    ],
    useCases: [
      'Mantener Trello para brainstorming, OPTIMUS-K para ejecución',
      'Sincronizar equipos que usan diferentes herramientas',
      'Vista unificada de progreso',
    ],
    features: [
      'Sincronización de tableros múltiples',
      'Mapeo de custom fields',
      'Webhooks',
    ],
    connectUrl: '/integraciones-dashboard',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Conecta con 5000+ aplicaciones automáticamente',
    detailedDescription: 'Usa Zapier para crear automatizaciones personalizadas. Conecta OPTIMUS-K con cualquier herramienta.',
    icon: <Zap className="h-8 w-8" />,
    requiredPlan: 'professional',
    category: 'automation',
    benefits: [
      'Acceso a 5000+ integraciones',
      'Automatizaciones sin código',
      'Triggers y acciones personalizables',
    ],
    useCases: [
      'Crear lead cuando llega un form en tu web',
      'Enviar email cuando completas un OKR',
      'Añadir fila en Google Sheets con métricas diarias',
    ],
    features: [
      'Triggers configurables',
      'Acciones múltiples',
      'Filtros y transformaciones',
    ],
    connectUrl: '/integraciones-dashboard',
  },
  {
    id: 'api',
    name: 'API Rest',
    description: 'Construye integraciones personalizadas',
    detailedDescription: 'API Rest completa para desarrolladores. Crea integraciones custom con cualquier sistema.',
    icon: <Sparkles className="h-8 w-8" />,
    requiredPlan: 'enterprise',
    category: 'automation',
    benefits: [
      'API Rest completa',
      'Documentación detallada',
      'Webhooks configurables',
    ],
    useCases: [
      'Conectar con sistemas internos',
      'Crear dashboards personalizados',
      'Automatizar reportes',
    ],
    features: [
      'Autenticación OAuth2',
      'Webhooks en tiempo real',
      'SDK para JavaScript/Python',
    ],
    connectUrl: '/integraciones-dashboard',
  },
];

function canAccessIntegration(currentPlan: string, requiredPlan: PlanType): boolean {
  const planHierarchy: Record<string, number> = {
    free: 0,
    trial: 1,
    starter: 2,
    professional: 3,
    enterprise: 4,
  };
  return (planHierarchy[currentPlan] ?? 0) >= (planHierarchy[requiredPlan] ?? 0);
}

export default function IntegracionesPage() {
  const navigate = useNavigate();
  const { plan } = useSubscriptionLimits();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredIntegrations = INTEGRATIONS.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const availableIntegrations = filteredIntegrations.filter(
    int => canAccessIntegration(plan, int.requiredPlan)
  );
  const lockedIntegrations = filteredIntegrations.filter(
    int => !canAccessIntegration(plan, int.requiredPlan)
  );

  const handleConnect = (integration: Integration) => {
    if (integration.connectUrl) {
      navigate(integration.connectUrl);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header con botón volver */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inicio
        </Button>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Integraciones</h1>
        <p className="text-muted-foreground text-lg">
          Conecta OPTIMUS-K con tus herramientas favoritas
        </p>
      </div>

      {/* Búsqueda y filtros */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            placeholder="Buscar integraciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="calendar">Calendario</TabsTrigger>
            <TabsTrigger value="communication">Comunicación</TabsTrigger>
            <TabsTrigger value="crm">CRM</TabsTrigger>
            <TabsTrigger value="productivity">Productividad</TabsTrigger>
            <TabsTrigger value="automation">Automatización</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Integraciones disponibles */}
      {availableIntegrations.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-success" />
            Disponibles en tu plan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableIntegrations.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                onConnect={handleConnect}
              />
            ))}
          </div>
        </div>
      )}

      {/* Integraciones bloqueadas */}
      {lockedIntegrations.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Lock className="h-6 w-6 text-muted-foreground" />
            Desbloquea más integraciones
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lockedIntegrations.map((integration) => (
              <LockedIntegrationCard
                key={integration.id}
                integration={integration}
                onUpgrade={() => navigate('/select-plan')}
              />
            ))}
          </div>
        </div>
      )}

      {/* CTA Contacto */}
      <Card className="mt-12 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl">¿Necesitas una integración personalizada?</CardTitle>
          <CardDescription>
            Nuestro equipo puede desarrollar integraciones custom para tu empresa
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button size="lg" onClick={() => window.location.href = 'mailto:info@optimus-k.com'}>
            Contactar con Ventas
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function IntegrationCard({ 
  integration, 
  onConnect 
}: { 
  integration: Integration; 
  onConnect: (integration: Integration) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div className="p-3 rounded-lg bg-primary/10">
            {integration.icon}
          </div>
          <Badge variant="outline" className="text-xs">
            {integration.requiredPlan === 'starter' ? 'Starter+' : 
             integration.requiredPlan === 'professional' ? 'Professional+' : 'Enterprise'}
          </Badge>
        </div>
        <CardTitle>{integration.name}</CardTitle>
        <CardDescription>{integration.description}</CardDescription>
      </CardHeader>

      <CardContent>
        {showDetails ? (
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold mb-2">Casos de uso:</h4>
              <ul className="space-y-1">
                {integration.useCases.map((useCase, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">→</span>
                    <span>{useCase}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowDetails(true)}
            className="w-full"
          >
            Ver detalles
          </Button>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <Button onClick={() => onConnect(integration)} className="w-full">
          <ExternalLink className="h-4 w-4 mr-2" />
          Conectar
        </Button>
      </CardFooter>
    </Card>
  );
}

function LockedIntegrationCard({ 
  integration, 
  onUpgrade 
}: { 
  integration: Integration; 
  onUpgrade: () => void;
}) {
  return (
    <Card className="opacity-75 hover:opacity-100 transition-opacity">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div className="p-3 rounded-lg bg-muted">
            {integration.icon}
          </div>
          <Badge variant="outline" className="bg-muted/50">
            <Lock className="h-3 w-3 mr-1" />
            {integration.requiredPlan === 'enterprise' ? 'Enterprise' : 'Professional'}
          </Badge>
        </div>
        <CardTitle className="text-muted-foreground">{integration.name}</CardTitle>
        <CardDescription>{integration.description}</CardDescription>
      </CardHeader>

      <CardContent>
        <p className="text-xs text-muted-foreground mb-4">
          {integration.detailedDescription}
        </p>
        <div className="space-y-1">
          {integration.benefits.slice(0, 2).map((benefit, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Check className="h-3 w-3 text-primary" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter>
        <Button variant="outline" onClick={onUpgrade} className="w-full">
          <ArrowRight className="h-4 w-4 mr-2" />
          Upgrade a {integration.requiredPlan === 'enterprise' ? 'Enterprise' : 'Professional'}
        </Button>
      </CardFooter>
    </Card>
  );
}
