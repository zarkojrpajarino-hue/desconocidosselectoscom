import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle2, Zap, TrendingUp, Users, Target, BarChart3, ArrowRight, Clock, Shield, Building2, Rocket, Sparkles, Check, LogIn, User, Menu, X } from "lucide-react";
import { PLAN_PRICES } from "@/constants/subscriptionLimits";
const Landing = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const features = [{
    icon: <Target className="h-8 w-8" />,
    title: "Dashboard de Tareas",
    description: "Sistema semanal con tareas personalizadas por fase"
  }, {
    icon: <BarChart3 className="h-8 w-8" />,
    title: "OKRs Inteligentes",
    description: "Objetivos y Key Results alineados a tu negocio"
  }, {
    icon: <Users className="h-8 w-8" />,
    title: "CRM Completo",
    description: "Pipeline de ventas adaptado a tu proceso comercial"
  }, {
    icon: <TrendingUp className="h-8 w-8" />,
    title: "Métricas KPI",
    description: "Dashboard con las métricas que realmente importan"
  }, {
    icon: <Zap className="h-8 w-8" />,
    title: "Gamificación",
    description: "Sistema de puntos, rachas y badges para motivar al equipo"
  }, {
    icon: <Clock className="h-8 w-8" />,
    title: "Alertas Inteligentes",
    description: "Notificaciones automáticas para no perder oportunidades"
  }];
  const plans = [{
    name: "Starter",
    price: `€${PLAN_PRICES.starter}`,
    period: "/mes",
    features: ["10 usuarios", "1,000 leads/mes", "OKRs básicos", "CRM completo", "Dashboard de tareas", "Gamificación", "Soporte email (48h)"]
  }, {
    name: "Professional",
    price: `€${PLAN_PRICES.professional}`,
    period: "/mes",
    featured: true,
    features: ["25 usuarios", "5,000 leads/mes", "OKRs avanzados", "CRM + Automatizaciones", "Análisis competitivo IA", "Google Calendar sync", "Integraciones (Zapier)", "Soporte prioritario (24h)"]
  }, {
    name: "Enterprise",
    price: `€${PLAN_PRICES.enterprise}`,
    period: "/mes",
    features: ["Usuarios ilimitados", "Leads ilimitados", "Todo de Professional +", "White-label", "API access completo", "Soporte dedicado 24/7", "Account manager", "SLA 99.9%"]
  }];
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth'
    });
    setMobileMenuOpen(false);
  };
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* ===== HEADER PROFESIONAL CON LOGIN ===== */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.scrollTo({
          top: 0,
          behavior: 'smooth'
        })}>
            
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              OPTIMUS-K
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Button variant="ghost" onClick={() => scrollToSection('features')}>
              Características
            </Button>
            <Button variant="ghost" onClick={() => scrollToSection('how-it-works')}>
              Cómo Funciona
            </Button>
            <Button variant="ghost" onClick={() => scrollToSection('pricing')}>
              Precios
            </Button>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {user ?
          // Usuario YA logueado
          <Button onClick={() => navigate('/home')}>
                <User className="w-4 h-4 mr-2" />
                Ir a Dashboard
              </Button> :
          // Usuario NO logueado
          <>
                <Button variant="ghost" onClick={() => navigate('/login')} className="hidden sm:flex">
                  <LogIn className="w-4 h-4 mr-2" />
                  Iniciar Sesión
                </Button>
                <Button onClick={() => navigate('/signup')}>
                  Empezar Gratis
                </Button>
              </>}

            {/* Mobile Menu Toggle */}
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && <div className="md:hidden border-t bg-background/95 backdrop-blur">
            <nav className="container py-4 flex flex-col gap-2 px-4">
              <Button variant="ghost" className="justify-start" onClick={() => scrollToSection('features')}>
                Características
              </Button>
              <Button variant="ghost" className="justify-start" onClick={() => scrollToSection('how-it-works')}>
                Cómo Funciona
              </Button>
              <Button variant="ghost" className="justify-start" onClick={() => scrollToSection('pricing')}>
                Precios
              </Button>
              {!user && <Button variant="ghost" className="justify-start" onClick={() => {
            navigate('/login');
            setMobileMenuOpen(false);
          }}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Iniciar Sesión
                </Button>}
            </nav>
          </div>}
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-12 text-center">
        <Badge className="mb-4 text-sm px-4 py-1">
          🎁 14 días GRATIS
        </Badge>
        
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
          OPTIMUS-K
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto">
          Generador de Apps de Gestión Empresarial con IA
        </p>
        
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          ¿Tienes una empresa o una idea? Sea cual sea tu situación, 
          en <strong className="text-foreground">15 segundos</strong> tendrás tu workspace completo.
        </p>
      </div>

      {/* Trust badges */}
      <div className="container mx-auto px-4 pb-12">
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground flex-wrap">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>Sin permanencia</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span>Pago seguro</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span>Setup instantáneo</span>
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
          {features.map((feature, index) => <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className="text-primary mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>)}
        </div>
      </div>

      {/* Integrations Section */}
      <div className="container mx-auto px-4 py-16 bg-muted/20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Se Integra con tus Herramientas Favoritas
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Conecta OPTIMUS-K con las aplicaciones que ya usas y centraliza tu trabajo
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
              <svg className="w-10 h-10" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#FF7A59" d="M39.5,30.1c-1.3,0-2.5,0.4-3.5,1.1l-6.7-5.6c0.7-1.4,1.1-3,1.1-4.6c0-0.4,0-0.8-0.1-1.2l5.9-2.5 c1.1,1.1,2.6,1.8,4.3,1.8c3.3,0,6-2.7,6-6s-2.7-6-6-6s-6,2.7-6,6c0,0.4,0,0.8,0.1,1.2l-5.9,2.5c-1.1-1.1-2.6-1.8-4.3-1.8 c-1.7,0-3.2,0.7-4.3,1.8l-5.9-2.5c0.1-0.4,0.1-0.8,0.1-1.2c0-3.3-2.7-6-6-6s-6,2.7-6,6s2.7,6,6,6c1.7,0,3.2-0.7,4.3-1.8l5.9,2.5 c-0.1,0.4-0.1,0.8-0.1,1.2c0,1.7,0.4,3.2,1.1,4.6l-6.7,5.6c-1-0.7-2.2-1.1-3.5-1.1c-3.3,0-6,2.7-6,6s2.7,6,6,6s6-2.7,6-6 c0-1.3-0.4-2.5-1.1-3.5l6.7-5.6c1.4,0.7,3,1.1,4.6,1.1c1.7,0,3.2-0.4,4.6-1.1l6.7,5.6c-0.7,1-1.1,2.2-1.1,3.5c0,3.3,2.7,6,6,6 s6-2.7,6-6S42.8,30.1,39.5,30.1z"/>
              </svg>
            </div>
            <span className="text-sm font-medium text-center">HubSpot</span>
          </div>

          {/* Microsoft Outlook */}
          <div className="flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-background transition-colors group">
            <div className="w-16 h-16 bg-background rounded-xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform border">
              <svg className="w-10 h-10" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#0078D4" d="M24,4L6,10v13c0,9.9,6.8,19.2,18,22c11.2-2.8,18-12.1,18-22V10L24,4z"/>
                <path fill="#FFF" d="M24,13c-5,0-9,4-9,9s4,9,9,9s9-4,9-9S29,13,24,13z M24,27c-2.8,0-5-2.2-5-5s2.2-5,5-5s5,2.2,5,5 S26.8,27,24,27z"/>
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
                <circle cx="16" cy="24" r="8" fill="#F95858"/>
                <circle cx="32" cy="24" r="8" fill="#F95858"/>
                <circle cx="24" cy="12" r="8" fill="#F95858"/>
              </svg>
            </div>
            <span className="text-sm font-medium text-center">Asana</span>
          </div>

          {/* Zapier */}
          <div className="flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-background transition-colors group">
            <div className="w-16 h-16 bg-background rounded-xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform border">
              <svg className="w-10 h-10" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#FF4A00" d="M24,8l-6,6l6,6l6-6L24,8z M14,18l-6,6l6,6l6-6L14,18z M34,18l-6,6l6,6l6-6L34,18z M24,28l-6,6l6,6l6-6 L24,28z"/>
              </svg>
            </div>
            <span className="text-sm font-medium text-center">Zapier</span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            ¿Tu herramienta favorita no está? Tenemos API abierta para conectar cualquier sistema
          </p>
        </div>
      </div>

      {/* SELECTOR EMPRESA vs STARTUP */}
      <div id="how-it-works" className="container mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Empieza Ahora - Elige tu camino
          </h2>
          <p className="text-muted-foreground">
            Selecciona la opción que mejor describe tu situación
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
          {/* Opción 1: Empresa Existente */}
          <Card className="p-8 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary group" onClick={() => navigate('/onboarding')}>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">
                Tengo una Empresa
              </h3>
              <p className="text-muted-foreground mb-6">
                Ya tengo clientes, revenue, y operaciones activas.
                Quiero optimizar y crecer.
              </p>
              <ul className="text-sm text-left space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Genera OKRs basados en tu situación real</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Pipeline CRM adaptado a tu proceso</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Herramientas marketing personalizadas</span>
                </li>
              </ul>
              <Button className="w-full" size="lg">
                Empezar Onboarding Empresa
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>

          {/* Opción 2: Idea/Startup */}
          <Card className="p-8 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-accent group" onClick={() => navigate('/onboarding/startup')}>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/20 transition-colors">
                <Rocket className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-2xl font-bold mb-3">
                Tengo una Idea 🚀
              </h3>
              <p className="text-muted-foreground mb-6">
                Quiero validar mi idea y construir mi MVP.
                Necesito un plan de acción estructurado.
              </p>
              <ul className="text-sm text-left space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  <span>Roadmap de validación de hipótesis</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  <span>Plan de go-to-market estructurado</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  <span>Timeline de milestones pre-launch</span>
                </li>
              </ul>
              <Button className="w-full" size="lg" variant="outline">
                Empezar Onboarding Startup
                <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-sm text-muted-foreground max-w-2xl mx-auto">
          💡 Ambos tipos obtienen acceso completo a la plataforma.
          La diferencia es el enfoque del onboarding y el contenido inicial generado por IA.
        </p>
      </div>

      {/* How It Works */}
      <div className="container mx-auto px-4 py-16 bg-muted/30">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          ¿Cómo Funciona?
        </h2>

        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex gap-6">
            <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold">
              1
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Eliges tu tipo de negocio</h3>
              <p className="text-muted-foreground">
                Empresa existente (9 pasos) o Startup/Idea (8 pasos) - cada uno con preguntas específicas
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold">
              2
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Generamos tu Workspace con IA</h3>
              <p className="text-muted-foreground">
                Nuestro sistema crea una app personalizada con tareas, OKRs, métricas y herramientas adaptadas
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold">
              3
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Empiezas a trabajar inmediatamente</h3>
              <p className="text-muted-foreground">
                En segundos tienes tu dashboard listo con todo configurado para tu negocio específico
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Precios Simples y Transparentes
        </h2>
        <p className="text-center text-muted-foreground mb-4">
          14 días GRATIS · Sin permanencia · Cancela cuando quieras
        </p>
        <p className="text-center text-sm text-muted-foreground mb-12">
          <strong>Mismo precio para empresas y startups</strong> - El valor que obtienes es equivalente
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => <Card key={index} className={`p-8 ${plan.featured ? 'border-primary border-2 shadow-xl' : ''}`}>
              {plan.featured && <Badge className="mb-4">Más Popular</Badge>}
              
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>)}
              </ul>

              <Button className="w-full" variant={plan.featured ? "default" : "outline"} onClick={() => navigate('/onboarding')}>
                Empezar Prueba Gratis
              </Button>
            </Card>)}
        </div>
      </div>

      {/* CTA Final */}
      <div className="container mx-auto px-4 py-16 text-center">
        <Card className="p-12 bg-gradient-to-br from-primary/10 to-primary/5">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Listo para Empezar?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Ya sea que tengas una empresa o una idea, OPTIMUS-K te ayuda a gestionar mejor
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/onboarding')} className="text-lg px-8 py-6">
              <Building2 className="mr-2 h-5 w-5" />
              Soy Empresa
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/onboarding/startup')} className="text-lg px-8 py-6">
              <Rocket className="mr-2 h-5 w-5" />
              Soy Startup
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            No se requiere tarjeta de crédito para la prueba
          </p>
        </Card>
      </div>

      {/* Footer */}
      <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground border-t">
        <p>© 2024 OPTIMUS-K · soporte@optimus-k.com</p>
      </div>
    </div>;
};
export default Landing;