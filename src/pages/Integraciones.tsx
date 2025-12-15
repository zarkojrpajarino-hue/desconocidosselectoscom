/**
 * PÁGINA DE INTEGRACIONES - Versión Profesional Mejorada
 * ✅ CORREGIDO: Tokens semánticos para dark mode
 * ✅ CORREGIDO: Type safety con error: unknown
 * ✅ CORREGIDO: Sin colores hardcodeados
 * ✅ CORREGIDO: Función canAccessIntegration implementada
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LockedFeature, LockedFeatureCompact } from '@/components/LockedFeature';
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
  
  // Beneficios clave
  benefits: string[];
  
  // Casos de uso específicos
  useCases: string[];
  
  // Características técnicas
  features: string[];
  
  // Estado
  isConnected?: boolean;
  isComingSoon?: boolean;
  
  // Acción
  connectUrl?: string;
  documentationUrl?: string;
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sincroniza tus tareas y eventos automáticamente',
    detailedDescription: 'Conecta tu Google Calendar para tener toda tu agenda sincronizada. Las tareas de OPTIMUS-K aparecen automáticamente en tu calendario, y los eventos se reflejan en la agenda global.',
    icon: <Calendar className="h-8 w-8" />,
    requiredPlan: 'professional',
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
      'Compartir tu disponibilidad con el equipo',
    ],
    features: [
      'Sincronización en tiempo real',
      'Soporte para múltiples calendarios',
      'Gestión de conflictos automática',
      'Sincronización de recordatorios',
    ],
    connectUrl: '/settings/integrations/google',
    documentationUrl: 'https://docs.optimus-k.com/integrations/google-calendar',
  },
  {
    id: 'outlook',
    name: 'Microsoft Outlook',
    description: 'Integración con Outlook Calendar y Teams',
    detailedDescription: 'Perfecta integración con el ecosistema Microsoft 365. Sincroniza calendarios, tareas y conecta con Microsoft Teams para notificaciones.',
    icon: <Mail className="h-8 w-8" />,
    requiredPlan: 'professional',
    category: 'calendar',
    benefits: [
      'Integración nativa con Microsoft 365',
      'Compatible con entornos corporativos',
      'Sincronización con Outlook Tasks',
      'Notificaciones en Microsoft Teams',
    ],
    useCases: [
      'Mantener sincronizada tu agenda corporativa',
      'Recibir alertas de OKRs en Teams',
      'Bloquear tiempo para deep work',
      'Sincronizar tareas con Outlook Tasks',
    ],
    features: [
      'Soporte para calendarios compartidos',
      'Integración con Microsoft Teams',
      'Compatibilidad con Azure AD',
      'Sincronización de contactos',
    ],
    connectUrl: '/settings/integrations/outlook',
    documentationUrl: 'https://docs.optimus-k.com/integrations/outlook',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Notificaciones y bot inteligente en tu workspace',
    detailedDescription: 'Recibe notificaciones importantes directamente en Slack. El bot de OPTIMUS-K puede responder preguntas, crear tareas y compartir actualizaciones de OKRs.',
    icon: <MessageSquare className="h-8 w-8" />,
    requiredPlan: 'professional',
    category: 'communication',
    benefits: [
      'Notificaciones instantáneas donde trabajas',
      'Bot inteligente para acciones rápidas',
      'Celebraciones automáticas de logros',
      'Resúmenes diarios del equipo',
    ],
    useCases: [
      'Recibir alerta cuando un lead caliente entra al CRM',
      'Notificar al equipo cuando se completa un OKR',
      'Celebrar automáticamente cuando alguien gana una insignia',
      'Recibir resumen diario de métricas en tu canal',
    ],
    features: [
      'Comandos slash personalizados',
      'Notificaciones configurables',
      'Bot interactivo',
      'Integraciones con canales específicos',
    ],
    connectUrl: '/settings/integrations/slack',
    documentationUrl: 'https://docs.optimus-k.com/integrations/slack',
  },
  {
    id: 'hubspot',
    name: 'HubSpot CRM',
    description: 'Sincroniza leads y deals bidireccionalmente',
    detailedDescription: 'Importa y exporta leads automáticamente entre OPTIMUS-K y HubSpot. Mantén ambos CRMs sincronizados sin duplicar trabajo.',
    icon: <Link2 className="h-8 w-8" />,
    requiredPlan: 'professional',
    category: 'crm',
    benefits: [
      'Sincronización bidireccional de leads',
      'Importación masiva de contactos',
      'Exportación automática de deals cerrados',
      'Mapping personalizable de campos',
    ],
    useCases: [
      'Importar tu base de leads existente desde HubSpot',
      'Crear automáticamente deals en HubSpot cuando cierras en OPTIMUS-K',
      'Mantener métricas unificadas entre ambas plataformas',
      'Migrar gradualmente de HubSpot a OPTIMUS-K',
    ],
    features: [
      'API bidireccional',
      'Mapeo de campos personalizado',
      'Sincronización programada',
      'Logs de sincronización',
    ],
    connectUrl: '/settings/integrations/hubspot',
    documentationUrl: 'https://docs.optimus-k.com/integrations/hubspot',
  },
  {
    id: 'asana',
    name: 'Asana',
    description: 'Sincroniza tareas con tus proyectos de Asana',
    detailedDescription: 'Conecta OPTIMUS-K con Asana para tener visibilidad completa. Las tareas creadas en cualquier plataforma se sincronizan automáticamente.',
    icon: <ListTodo className="h-8 w-8" />,
    requiredPlan: 'professional',
    category: 'productivity',
    benefits: [
      'Sincronización bidireccional de tareas',
      'Mapping automático de estados',
      'Actualización en tiempo real',
      'Soporte para proyectos y secciones',
    ],
    useCases: [
      'Usar Asana para planificación y OPTIMUS-K para ejecución',
      'Mantener equipos sincronizados entre plataformas',
      'Migrar gradualmente a OPTIMUS-K',
      'Vista unificada de todos tus proyectos',
    ],
    features: [
      'Sincronización de tareas y subtareas',
      'Mapeo de custom fields',
      'Soporte para múltiples workspaces',
      'Webhooks en tiempo real',
    ],
    connectUrl: '/settings/integrations/asana',
    documentationUrl: 'https://docs.optimus-k.com/integrations/asana',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Conecta con 5000+ aplicaciones automáticamente',
    detailedDescription: 'Usa Zapier para crear automatizaciones personalizadas. Conecta OPTIMUS-K con cualquier herramienta que uses.',
    icon: <Zap className="h-8 w-8" />,
    requiredPlan: 'professional',
    category: 'automation',
    benefits: [
      'Acceso a 5000+ integraciones',
      'Automatizaciones sin código',
      'Triggers y acciones personalizables',
      'Templates pre-construidos',
    ],
    useCases: [
      'Crear lead en OPTIMUS-K cuando llegas un form en tu web',
      'Enviar email cuando completas un OKR',
      'Añadir fila en Google Sheets con métricas diarias',
      'Publicar en Twitter cuando ganas una insignia',
    ],
    features: [
      'Triggers configurables',
      'Acciones múltiples',
      'Filtros y transformaciones',
      'Multi-step Zaps',
    ],
    connectUrl: '/settings/integrations/zapier',
    documentationUrl: 'https://docs.optimus-k.com/integrations/zapier',
  },
  {
    id: 'trello',
    name: 'Trello',
    description: 'Sincroniza tableros Kanban con OPTIMUS-K',
    detailedDescription: 'Convierte tarjetas de Trello en tareas de OPTIMUS-K automáticamente. Perfecto para equipos que aman los tableros visuales.',
    icon: <ListTodo className="h-8 w-8" />,
    requiredPlan: 'enterprise',
    category: 'productivity',
    benefits: [
      'Sincronización de tableros completos',
      'Mapping de listas a fases',
      'Actualización bidireccional',
      'Soporte para etiquetas y miembros',
    ],
    useCases: [
      'Mantener Trello para brainstorming, OPTIMUS-K para ejecución',
      'Sincronizar equipos que usan diferentes herramientas',
      'Vista unificada de progreso',
      'Migración gradual a OPTIMUS-K',
    ],
    features: [
      'Sincronización de tableros múltiples',
      'Mapeo de custom fields',
      'Power-Ups compatibles',
      'Webhooks',
    ],
    isComingSoon: true,
    documentationUrl: 'https://docs.optimus-k.com/integrations/trello',
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
      'Rate limits generosos',
    ],
    useCases: [
      'Conectar con sistemas internos',
      'Crear dashboard personalizados',
      'Automatizar reportes',
      'Integrar con ERP o CRM propietario',
    ],
    features: [
      'Autenticación OAuth2',
      'Webhooks en tiempo real',
      'GraphQL endpoint',
      'SDK para JavaScript/Python',
    ],
    connectUrl: '/settings/api',
    documentationUrl: 'https://docs.optimus-k.com/api',
  },
];

// ✅ CORREGIDO: Función canAccessIntegration implementada correctamente
function canAccessIntegration(currentPlan: string, requiredPlan: PlanType): boolean {
  const planHierarchy: Record<string, number> = {
    free: 0,
    trial: 0,
    starter: 1,
    professional: 2,
    enterprise: 3,
  };

  return (planHierarchy[currentPlan] ?? 0) >= (planHierarchy[requiredPlan] ?? 0);
}

export default function IntegracionesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plan, limits } = useSubscriptionLimits();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filtrar integraciones
  const filteredIntegrations = INTEGRATIONS.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Separar disponibles y bloqueadas
  const availableIntegrations = filteredIntegrations.filter(
    int => canAccessIntegration(plan, int.requiredPlan)
  );
  const lockedIntegrations = filteredIntegrations.filter(
    int => !canAccessIntegration(plan, int.requiredPlan)
  );

  const handleConnect = (integration: Integration) => {
    if (integration.isComingSoon) {
      toast.info('Próximamente', {
        description: 'Esta integración estará disponible pronto',
      });
      return;
    }

    if (!canAccessIntegration(plan, integration.requiredPlan)) {
      navigate('/select-plan');
      return;
    }

    if (integration.connectUrl) {
      toast.success(`Conectando con ${integration.name}...`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Integraciones</h1>
        <p className="text-muted-foreground text-lg">
          Conecta OPTIMUS-K con tus herramientas favoritas
        </p>
      </div>

      {/* Search and filters */}
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="calendar">Calendario</TabsTrigger>
            <TabsTrigger value="communication">Comunicación</TabsTrigger>
            <TabsTrigger value="crm">CRM</TabsTrigger>
            <TabsTrigger value="productivity">Productividad</TabsTrigger>
            <TabsTrigger value="automation">Automatización</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Integrations available */}
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

      {/* Locked integrations */}
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

      {/* Contact sales CTA */}
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

// Helper component for available integrations
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
          {integration.isComingSoon && (
            <Badge variant="secondary">Próximamente</Badge>
          )}
          {integration.isConnected && (
            <Badge className="bg-success text-success-foreground">
              <Check className="h-3 w-3 mr-1" />
              Conectado
            </Badge>
          )}
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
                {integration.useCases.slice(0, 3).map((useCase, i) => (
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

      <CardFooter className="flex gap-2">
        <Button 
          onClick={() => onConnect(integration)}
          className="flex-1"
          disabled={integration.isComingSoon}
        >
          {integration.isConnected ? 'Configurar' : 'Conectar'}
        </Button>
        {integration.documentationUrl && (
          <Button variant="outline" size="icon" asChild>
            <a href={integration.documentationUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// Helper component for locked integrations
function LockedIntegrationCard({ 
  integration, 
  onUpgrade 
}: { 
  integration: Integration; 
  onUpgrade: () => void;
}) {
  return (
    <LockedFeatureCompact
      featureName={integration.name}
      description={integration.description}
      requiredPlan={integration.requiredPlan}
      icon={integration.icon}
      onClick={onUpgrade}
    />
  );
}
