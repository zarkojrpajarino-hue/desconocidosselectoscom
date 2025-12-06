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
      limits: "3 usuarios · 500 leads · 3 OKRs",
      features: [
        "Dashboard personalizado",
        "CRM con pipeline básico",
        "3 OKRs con Key Results",
        "Sistema de puntos y badges",
        "2 análisis IA/mes",
        "Exportación CSV",
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
      limits: "10 usuarios · 1,000 leads · 10 OKRs",
      features: [
        "Todo de Free Trial +",
        "Tareas semanales ilimitadas",
        "Pipeline personalizable",
        "Scoring automático",
        "Gamificación completa",
        "Google Calendar sync",
        "Excel y PDF export",
        "Soporte email (48h)"
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
      limits: "25 usuarios · 5,000 leads · OKRs ilimitados",
      features: [
        "Todo de Starter +",
        "IA generativa (buyer personas, brand kit)",
        "Análisis competitivo",
        "5 BI Dashboards",
        "Slack, HubSpot, Outlook, Zapier",
        "Onboarding startup",
        "Soporte prioritario 24h"
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
      limits: "Todo ilimitado",
      features: [
        "Todo de Professional +",
        "White-label completo",
        "SSO/SAML",
        "SAP, Oracle, Dynamics",
        "SLA 99.9% uptime",
        "Account manager dedicado",
        "Soporte 24/7 (<1h)"
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
          {/* Slack */}
          <div className="flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-background transition-colors group">
            <div className="w-16 h-16 bg-background rounded-xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform border">
              <svg className="w-10 h-10" viewBox="0 0 54 54" xmlns="http://www.w3.org/2000/svg">
                <g fill="none" fillRule="evenodd">
                  <path d="M19.712.133a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386h5.376V5.52A5.381 5.381 0 0 0 19.712.133m0 14.365H5.376A5.381 5.381 0 0 0 0 19.884a5.381 5.381 0 0 0 5.376 5.387h14.336a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386" fill="#36C5F0"/>
                  <path d="M53.76 19.884a5.381 5.381 0 0 0-5.376-5.386 5.381 5.381 0 0 0-5.376 5.386v5.387h5.376a5.381 5.381 0 0 0 5.376-5.387m-14.336 0V5.52A5.381 5.381 0 0 0 34.048.133a5.381 5.381 0 0 0-5.376 5.387v14.364a5.381 5.381 0 0 0 5.376 5.387 5.381 5.381 0 0 0 5.376-5.387" fill="#2EB67D"/>
                  <path d="M34.048 54a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386h-5.376v5.386A5.381 5.381 0 0 0 34.048 54m0-14.365h14.336a5.381 5.381 0 0 0 5.376-5.386 5.381 5.381 0 0 0-5.376-5.387H34.048a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386" fill="#ECB22E"/>
                  <path d="M0 34.249a5.381 5.381 0 0 0 5.376 5.386 5.381 5.381 0 0 0 5.376-5.386v-5.387H5.376A5.381 5.381 0 0 0 0 34.25m14.336-.001v14.364A5.381 5.381 0 0 0 19.712 54a5.381 5.381 0 0 0 5.376-5.387V34.25a5.381 5.381 0 0 0-5.376-5.387 5.381 5.381 0 0 0-5.376 5.387" fill="#E01E5A"/>
                </g>
              </svg>
            </div>
            <span className="text-sm font-medium text-center">Slack</span>
          </div>

          {/* HubSpot */}
          <div className="flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-background transition-colors group">
            <div className="w-16 h-16 bg-background rounded-xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform border">
              <svg className="w-10 h-10" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                <path fill="#FF7A59" d="M378.7 243.4v-68.5c16.5-9.4 27.7-27.1 27.7-47.4 0-30.1-24.4-54.5-54.5-54.5-30.1 0-54.5 24.4-54.5 54.5 0 20.3 11.2 38 27.7 47.4v68.5c-23.4 5.3-44.9 16.3-62.5 31.8L104.4 149.7c1.6-6.3 2.5-12.9 2.5-19.7 0-44.2-35.8-80-80-80S-53 85.8-53 130s35.8 80 80 80c15.3 0 29.6-4.3 41.8-11.8l155.3 123.9c-7.8 16.1-12.2 34.1-12.2 53.1 0 67.8 55 122.8 122.8 122.8s122.8-55 122.8-122.8c0-55.5-36.9-102.4-87.5-117.8zM334.7 436c-34.1 0-61.8-27.7-61.8-61.8s27.7-61.8 61.8-61.8 61.8 27.7 61.8 61.8-27.7 61.8-61.8 61.8z"/>
              </svg>
            </div>
            <span className="text-sm font-medium text-center">HubSpot</span>
          </div>

          {/* Outlook */}
          <div className="flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-background transition-colors group">
            <div className="w-16 h-16 bg-background rounded-xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform border">
              <svg className="w-10 h-10" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#1976D2" d="M28 13h14v24H28z"/>
                <path fill="#1E88E5" d="M42 43H28V29h14z"/>
                <path fill="#1565C0" d="M42 19H28V5h14z"/>
                <path fill="#0D47A1" d="M28 5h-4v38h4z"/>
                <path fill="#1976D2" d="M2 11.5v25c0 1.9 1.6 3.5 3.5 3.5h15c1.9 0 3.5-1.6 3.5-3.5v-25c0-1.9-1.6-3.5-3.5-3.5h-15C3.6 8 2 9.6 2 11.5z"/>
                <path fill="#FFF" d="M13 17c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 13c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z"/>
              </svg>
            </div>
            <span className="text-sm font-medium text-center">Outlook</span>
          </div>

          {/* Trello */}
          <div className="flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-background transition-colors group">
            <div className="w-16 h-16 bg-background rounded-xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform border">
              <svg className="w-10 h-10" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                <rect width="256" height="256" fill="#0079BF" rx="25"/>
                <rect width="83.2" height="154.6" x="33.3" y="33.3" fill="#FFF" rx="12"/>
                <rect width="83.2" height="99.7" x="139.5" y="33.3" fill="#FFF" rx="12"/>
              </svg>
            </div>
            <span className="text-sm font-medium text-center">Trello</span>
          </div>

          {/* Asana */}
          <div className="flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-background transition-colors group">
            <div className="w-16 h-16 bg-background rounded-xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform border">
              <svg className="w-10 h-10" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <circle cx="24" cy="36" r="8" fill="#F06A6A"/>
                <circle cx="10" cy="20" r="8" fill="#F06A6A"/>
                <circle cx="38" cy="20" r="8" fill="#F06A6A"/>
              </svg>
            </div>
            <span className="text-sm font-medium text-center">Asana</span>
          </div>

          {/* Zapier */}
          <div className="flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-background transition-colors group">
            <div className="w-16 h-16 bg-background rounded-xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform border">
              <svg className="w-10 h-10" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#FF4A00" d="M24 4L4 24l20 20 20-20L24 4zm0 6.5L37.5 24 24 37.5 10.5 24 24 10.5z"/>
                <circle cx="24" cy="24" r="6" fill="#FF4A00"/>
              </svg>
            </div>
            <span className="text-sm font-medium text-center">Zapier</span>
          </div>
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

        <div className="flex flex-col lg:flex-row gap-4 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`p-5 flex flex-col ${
                plan.featured 
                  ? 'border-primary border-2 shadow-2xl relative' 
                  : 'hover:shadow-lg transition-shadow'
              }`}
            >
              {plan.featured && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-xs">
                  ⭐ Más Popular
                </Badge>
              )}
              
              <div className="flex items-center gap-2 mb-3">
                <div className="text-primary">{plan.icon}</div>
                <div>
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                </div>
              </div>
              
              <div className="mb-3">
                <span className="text-2xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground text-xs">{plan.period}</span>
              </div>

              <p className="text-xs text-muted-foreground mb-4 border-b pb-3">
                {plan.limits}
              </p>

              <ul className="space-y-1.5 mb-4 text-xs flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <Check className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className="w-full mt-auto" 
                size="sm"
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
