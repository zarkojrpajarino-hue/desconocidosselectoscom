import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  CheckCircle2, Zap, TrendingUp, Users, Target, BarChart3, 
  ArrowRight, Clock, Shield, Building2, Rocket, Sparkles, 
  Check, LogIn, User, Menu, X, Lightbulb, Bot, Link as LinkIcon,
  Gauge, Crown, Star, Gift
} from "lucide-react";
import { PLAN_PRICES } from "@/constants/subscriptionLimits";

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: <Target className="h-8 w-8" />,
      title: "Dashboard Personalizado",
      description: "Dashboard adaptado a TU negocio con métricas que importan"
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "OKRs Inteligentes",
      description: "Objetivos generados por IA alineados a tu industria"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "CRM Completo",
      description: "Pipeline de ventas con scoring y seguimiento automático"
    },
    {
      icon: <Bot className="h-8 w-8" />,
      title: "IA Generativa",
      description: "Crea buyer personas, contenido, emails y campañas con IA"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Gamificación Real",
      description: "Puntos, rachas y logros que motivan al equipo de verdad"
    },
    {
      icon: <LinkIcon className="h-8 w-8" />,
      title: "Integraciones",
      description: "Slack, HubSpot, Outlook, Trello, Asana, Zapier y más"
    }
  ];

  const plans = [
    {
      name: "Free Trial",
      price: "Gratis",
      period: "14 días",
      description: "Prueba sin compromiso",
      icon: <Gift className="h-6 w-6" />,
      limits: "3 usuarios · 500 leads/mes · 3 OKRs · 2 IA análisis/mes",
      features: [
        "Dashboard personalizado básico",
        "Hasta 3 tareas semanales",
        "3 OKRs con Key Results",
        "10 métricas KPI básicas",
        "Pipeline simple (3 stages)",
        "Lead scoring básico",
        "Import CSV (hasta 100 leads)",
        "Sistema de puntos y badges",
        "Leaderboard del equipo",
        "2 análisis IA/mes",
        "Generación de tareas IA",
        "Smart alerts básicas",
        "Exportación CSV",
        "Notificaciones in-app",
        "Email de bienvenida",
        "Login Google",
        "Onboarding guiado (30 preguntas)",
        "Workspace generado automáticamente",
        "Knowledge base",
        "Email support (72h)"
      ],
      cta: "Empezar Gratis",
      popular: false
    },
    {
      name: "Starter",
      price: `€${PLAN_PRICES.starter}`,
      period: "/mes",
      description: "Para equipos pequeños",
      icon: <Rocket className="h-6 w-6" />,
      limits: "10 usuarios · 1,000 leads/mes · 10 OKRs · 4 IA análisis/mes",
      features: [
        "🚀 Todo de Free Trial +",
        "━━━━━━━━━━━",
        "📊 Core ampliado:",
        "→ 10 usuarios incluidos",
        "→ Tareas semanales ilimitadas",
        "→ Hasta 10 OKRs",
        "→ 20+ métricas KPI",
        "━━━━━━━━━━━",
        "📧 CRM completo:",
        "→ Pipeline personalizable",
        "→ 1,000 leads/mes",
        "→ Scoring automático",
        "→ Lead activities tracking",
        "→ Asignación por usuario",
        "→ Import CSV ilimitado",
        "━━━━━━━━━━━",
        "🎮 Gamificación:",
        "→ 20+ badges",
        "→ Sistema de niveles",
        "→ Rachas de productividad",
        "→ Award points automático",
        "━━━━━━━━━━━",
        "🤖 IA avanzada:",
        "→ 4 análisis IA/mes",
        "→ Tareas IA ilimitadas",
        "→ Smart alerts avanzadas",
        "→ Alternativas sugeridas",
        "━━━━━━━━━━━",
        "📈 Dashboards:",
        "→ Dashboard personalizado",
        "→ Financial dashboard",
        "→ Progress tracking visual",
        "━━━━━━━━━━━",
        "📄 Exportación:",
        "→ Excel con fórmulas",
        "→ PDF profesionales",
        "→ CSV export",
        "━━━━━━━━━━━",
        "🔌 Integraciones:",
        "→ Google Calendar sync",
        "→ API REST (500 calls/mes)",
        "→ 5 webhooks activos",
        "━━━━━━━━━━━",
        "🔔 Notificaciones:",
        "→ Centro de notificaciones",
        "→ Email notifications",
        "→ Resumen semanal",
        "━━━━━━━━━━━",
        "👥 Colaboración:",
        "→ Roles (admin/manager/member)",
        "→ Asignación de tareas",
        "→ Work mode selector",
        "━━━━━━━━━━━",
        "⚙️ Automatizaciones:",
        "→ Workspace automático",
        "→ Schedules semanales",
        "→ Emails automáticos",
        "━━━━━━━━━━━",
        "📧 Soporte email 48h"
      ],
      cta: "Empezar con Starter",
      popular: false
    },
    {
      name: "Professional",
      price: `€${PLAN_PRICES.professional}`,
      period: "/mes",
      description: "Para empresas en crecimiento",
      icon: <Star className="h-6 w-6" />,
      featured: true,
      limits: "25 usuarios · 5,000 leads/mes · OKRs ilimitados · 8 IA análisis/mes",
      features: [
        "🚀 Todo de Starter +",
        "━━━━━━━━━━━",
        "📊 Core PRO:",
        "→ 25 usuarios incluidos",
        "→ 5,000 leads/mes",
        "→ OKRs ilimitados",
        "→ Todas las fases",
        "━━━━━━━━━━━",
        "🤖 IA Generativa:",
        "→ 8 análisis IA/mes",
        "→ Buyer personas",
        "→ Brand kits",
        "→ Análisis competitivo (5 max)",
        "━━━━━━━━━━━",
        "🎨 Recursos IA:",
        "→ Email sequences",
        "→ Social media posts",
        "→ Ad campaigns",
        "→ Video scripts",
        "→ Design briefs",
        "→ Influencer lists",
        "→ Outreach templates",
        "━━━━━━━━━━━",
        "📊 BI Dashboards:",
        "→ Executive Summary",
        "→ Revenue Analytics",
        "→ Sales Performance",
        "→ Customer Insights",
        "→ Operational Metrics",
        "━━━━━━━━━━━",
        "🧠 AI Analysis:",
        "→ Team performance",
        "→ Financial health",
        "→ Honest feedback IA",
        "━━━━━━━━━━━",
        "📈 Análisis avanzado:",
        "→ Scalability dashboard",
        "→ Proyecciones",
        "→ User metrics history",
        "→ Financial analytics",
        "━━━━━━━━━━━",
        "🔌 Integraciones Premium:",
        "→ Google Calendar",
        "→ Slack notifications",
        "→ HubSpot CRM sync",
        "→ Outlook Calendar",
        "→ Asana tasks sync",
        "→ Trello cards sync",
        "→ Zapier ilimitado",
        "→ API 5,000 calls/mes",
        "━━━━━━━━━━━",
        "🛠️ Herramientas:",
        "→ Calculadora de valor",
        "→ Hub de herramientas",
        "→ Herramientas práctica",
        "━━━━━━━━━━━",
        "🎓 Onboarding avanzado:",
        "→ Tradicional (30 preguntas)",
        "→ Startup (6 pasos)",
        "→ Vista previa personalizada",
        "━━━━━━━━━━━",
        "📄 Exportación avanzada:",
        "→ Excel avanzado",
        "→ PDF profesionales",
        "→ Reportes personalizados",
        "→ Bulk export",
        "━━━━━━━━━━━",
        "📧 Soporte prioritario 24h",
        "💬 Live chat incluido",
        "🎥 Video onboarding"
      ],
      cta: "Probar Professional",
      popular: true
    },
    {
      name: "Enterprise",
      price: `€${PLAN_PRICES.enterprise}`,
      period: "/mes",
      description: "Para grandes organizaciones",
      icon: <Crown className="h-6 w-6" />,
      limits: "♾️ TODO ILIMITADO",
      features: [
        "🚀 Todo de Professional +",
        "━━━━━━━━━━━",
        "♾️ ILIMITADO:",
        "→ Usuarios ilimitados",
        "→ Leads ilimitados",
        "→ OKRs ilimitados",
        "→ IA análisis ilimitados",
        "→ API calls ilimitadas",
        "━━━━━━━━━━━",
        "🏢 Enterprise:",
        "→ White-label completo",
        "→ SSO/SAML",
        "→ Multi-organización",
        "→ IP whitelisting",
        "→ Pipelines custom",
        "━━━━━━━━━━━",
        "🤖 IA Enterprise:",
        "→ Análisis datos v3",
        "→ Competitivo ilimitado",
        "→ Modelos personalizados",
        "→ Fine-tuning prompts",
        "→ ML forecasting",
        "━━━━━━━━━━━",
        "📊 Analytics Enterprise:",
        "→ Dashboards custom ilimitados",
        "→ Reportes personalizados",
        "→ Data warehouse access",
        "→ Real-time analytics",
        "━━━━━━━━━━━",
        "🔌 Integraciones:",
        "→ Todas disponibles",
        "→ Custom development",
        "→ SAP/Oracle/Dynamics",
        "→ EDI connectors",
        "→ API sin límites",
        "━━━━━━━━━━━",
        "🛡️ Seguridad:",
        "→ SLA 99.9% uptime",
        "→ Backups diarios",
        "→ Disaster recovery",
        "→ GDPR compliant",
        "→ SOC 2 (en proceso)",
        "→ Audit logs",
        "→ Encryption avanzado",
        "━━━━━━━━━━━",
        "👨‍💼 Soporte dedicado:",
        "→ Account manager",
        "→ Technical AM",
        "→ 24/7 support <1h",
        "→ Slack directo",
        "→ Onboarding presencial",
        "→ Training trimestral",
        "━━━━━━━━━━━",
        "🔧 Customizaciones:",
        "→ Custom workflows",
        "→ Custom fields ilimitados",
        "→ Custom automations",
        "→ Custom reports",
        "→ Code-level custom",
        "━━━━━━━━━━━",
        "📈 Escalabilidad:",
        "→ Infra dedicada",
        "→ Load balancing",
        "→ CDN global",
        "→ Performance optimization"
      ],
      cta: "Contactar Ventas",
      popular: false
    }
  ];

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              OPTIMUS-K
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Button variant="ghost" onClick={() => scrollToSection('features')}>
              Características
            </Button>
            <Button variant="ghost" onClick={() => scrollToSection('integrations')}>
              Integraciones
            </Button>
            <Button variant="ghost" onClick={() => scrollToSection('pricing')}>
              Precios
            </Button>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Button onClick={() => navigate('/home')}>
                <User className="w-4 h-4 mr-2" />
                Ir a Dashboard
              </Button>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/login')} 
                  className="hidden sm:flex"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Iniciar Sesión
                </Button>
                <Button onClick={() => navigate('/signup')}>
                  Empezar Gratis
                </Button>
              </>
            )}

            <Button 
              variant="ghost" 
              size="sm" 
              className="md:hidden" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background/95 backdrop-blur">
            <nav className="container py-4 flex flex-col gap-2 px-4">
              <Button 
                variant="ghost" 
                className="justify-start" 
                onClick={() => scrollToSection('features')}
              >
                Características
              </Button>
              <Button 
                variant="ghost" 
                className="justify-start" 
                onClick={() => scrollToSection('integrations')}
              >
                Integraciones
              </Button>
              <Button 
                variant="ghost" 
                className="justify-start" 
                onClick={() => scrollToSection('pricing')}
              >
                Precios
              </Button>
              {!user && (
                <Button 
                  variant="ghost" 
                  className="justify-start" 
                  onClick={() => {
                    navigate('/login');
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Iniciar Sesión
                </Button>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-12 text-center">
        <Badge className="mb-4 text-sm px-4 py-1">
          🎁 14 días GRATIS · Sin tarjeta
        </Badge>
        
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
          OPTIMUS-K
        </h1>
        
        <p className="text-xl md:text-2xl mb-4 max-w-3xl mx-auto">
          Tu empresa merece una app de gestión{" "}
          <strong className="text-primary">tan única como tu negocio</strong>
        </p>

        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          En <strong>2-3 horas</strong> tendrás una app completa que habla tu lenguaje:
          con TUS procesos, TUS métricas y TU forma de trabajar.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button 
            size="lg" 
            onClick={() => navigate('/signup')}
            className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            Empezar Ahora
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => scrollToSection('pricing')}
            className="text-lg px-8 py-6"
          >
            Ver Precios
          </Button>
        </div>

        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground flex-wrap">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Sin permanencia</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-500" />
            <span>Pago seguro</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-500" />
            <span>Setup en 2-3h</span>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          ¿Qué Incluye tu App?
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Todas las herramientas que necesitas para gestionar tu empresa en un solo lugar
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className="text-primary mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Integrations Section */}
      <div id="integrations" className="container mx-auto px-4 py-16 bg-muted/20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Se Integra con tus Herramientas Favoritas
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          <strong>OPTIMUS-K se adapta a tu forma de trabajar.</strong> Si tu equipo usa Slack, 
          recibirán notificaciones ahí. Si tienes HubSpot, todo se sincroniza automáticamente.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 max-w-5xl mx-auto mb-8">
          {[
            { name: "Slack", color: "#36C5F0" },
            { name: "HubSpot", color: "#FF7A59" },
            { name: "Outlook", color: "#0078D4" },
            { name: "Trello", color: "#0079BF" },
            { name: "Asana", color: "#F95858" },
            { name: "Zapier", color: "#FF4A00" }
          ].map((integration) => (
            <div key={integration.name} className="flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-background transition-colors group">
              <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <div 
                  className="w-10 h-10 rounded-lg" 
                  style={{ backgroundColor: integration.color }}
                />
              </div>
              <span className="text-sm font-medium text-center">{integration.name}</span>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            ¿Tu herramienta favorita no está? Tenemos API abierta para conectar cualquier sistema
          </p>
          <Button variant="outline" onClick={() => navigate('/settings/api-keys')}>
            Ver Todas las Integraciones
          </Button>
        </div>
      </div>

      {/* How it Works Section - Elige tu camino */}
      <div id="how-it-works" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Empieza Ahora - Elige tu Camino
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          OPTIMUS-K se adapta a tu situación. ¿Ya tienes un negocio funcionando o estás empezando con una idea?
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Opción 1: Tengo una Empresa */}
          <Card 
            className="p-8 hover:shadow-xl transition-all cursor-pointer group border-2 hover:border-primary"
            onClick={() => navigate('/onboarding')}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Building2 className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Tengo una Empresa</h3>
              <p className="text-muted-foreground mb-6">
                Ya tengo clientes, ventas y un equipo. Quiero optimizar mi gestión con IA y métricas personalizadas.
              </p>
              <ul className="text-sm text-left space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>30 preguntas sobre tu negocio</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Workspace generado en 2-3h</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>CRM, OKRs, KPIs adaptados</span>
                </li>
              </ul>
              <Button className="w-full group-hover:bg-primary/90">
                Empezar Onboarding Empresa
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>

          {/* Opción 2: Tengo una Idea */}
          <Card 
            className="p-8 hover:shadow-xl transition-all cursor-pointer group border-2 hover:border-accent"
            onClick={() => navigate('/onboarding/startup')}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Rocket className="h-10 w-10 text-accent" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-2xl font-bold">Tengo una Idea</h3>
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <p className="text-muted-foreground mb-6">
                Estoy empezando un proyecto o startup. Necesito validar mi idea y estructurar mi lanzamiento.
              </p>
              <ul className="text-sm text-left space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>6 pasos de validación</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Lean Canvas automático</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Roadmap y métricas de startup</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full group-hover:border-accent group-hover:text-accent">
                Empezar Onboarding Startup
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Precios Transparentes
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          Empieza gratis · Sin permanencia · Cancela cuando quieras
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`p-6 ${
                plan.featured 
                  ? 'border-primary border-2 shadow-2xl relative lg:scale-105' 
                  : 'hover:shadow-lg transition-shadow'
              }`}
            >
              {plan.featured && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                  ⭐ Más Popular
                </Badge>
              )}
              
              <div className="flex items-center gap-3 mb-4">
                <div className="text-primary">{plan.icon}</div>
                <div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>

              <p className="text-xs text-muted-foreground mb-6 border-b pb-4">
                {plan.limits}
              </p>

              <ul className="space-y-1.5 mb-6 max-h-[400px] overflow-y-auto text-sm">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    {feature.startsWith("━") || feature.startsWith("🚀") || feature.startsWith("📊") || feature.startsWith("📧") || feature.startsWith("🎮") || feature.startsWith("🤖") || feature.startsWith("🎨") || feature.startsWith("🧠") || feature.startsWith("📈") || feature.startsWith("🔌") || feature.startsWith("🛠️") || feature.startsWith("🎓") || feature.startsWith("📄") || feature.startsWith("♾️") || feature.startsWith("🏢") || feature.startsWith("🛡️") || feature.startsWith("👨‍💼") || feature.startsWith("🔧") || feature.startsWith("🔔") || feature.startsWith("👥") || feature.startsWith("⚙️") || feature.startsWith("💬") || feature.startsWith("🎥") ? (
                      <span className={`${feature.startsWith("━") ? 'text-muted-foreground' : 'font-semibold text-primary'} w-full text-xs`}>
                        {feature}
                      </span>
                    ) : (
                      <>
                        {feature.startsWith("→") ? (
                          <span className="text-muted-foreground ml-4 text-xs">{feature}</span>
                        ) : (
                          <>
                            <Check className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-xs">{feature}</span>
                          </>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ul>

              <Button 
                className="w-full" 
                variant={plan.featured ? "default" : "outline"}
                onClick={() => navigate('/signup')}
              >
                {plan.cta}
              </Button>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            ¿Necesitas algo más específico? ¿Más de 25 usuarios?
          </p>
          <Button 
            variant="link" 
            onClick={() => window.location.href = 'mailto:sales@optimus-k.com'}
          >
            Contáctanos para un plan personalizado →
          </Button>
        </div>
      </div>

      {/* CTA Final */}
      <div className="container mx-auto px-4 py-16 text-center bg-gradient-to-r from-primary/10 to-primary/5 rounded-3xl mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          ¿Listo para Gestionar Como un Pro?
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Únete a cientos de empresas que ya gestionan su negocio con OPTIMUS-K
        </p>
        <Button 
          size="lg" 
          onClick={() => navigate('/signup')}
          className="text-lg px-12 py-6"
        >
          Empezar Gratis 14 Días
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
        <p className="text-sm text-muted-foreground mt-4">
          No se requiere tarjeta de crédito
        </p>
      </div>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 OPTIMUS-K. Todos los derechos reservados.</p>
          <div className="flex justify-center gap-4 mt-4">
            <Button variant="link" size="sm">Términos</Button>
            <Button variant="link" size="sm">Privacidad</Button>
            <Button variant="link" size="sm">Contacto</Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
