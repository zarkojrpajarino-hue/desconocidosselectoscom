import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  CheckCircle2, 
  Zap, 
  TrendingUp, 
  Users, 
  Target, 
  BarChart3,
  ArrowRight,
  Clock,
  Shield
} from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Target className="h-8 w-8" />,
      title: "Dashboard de Tareas",
      description: "Sistema semanal con tareas personalizadas por fase"
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "OKRs Inteligentes",
      description: "Objetivos y Key Results alineados a tu negocio"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "CRM Completo",
      description: "Pipeline de ventas adaptado a tu proceso comercial"
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Métricas KPI",
      description: "Dashboard con las métricas que realmente importan"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Gamificación",
      description: "Sistema de puntos, rachas y badges para motivar al equipo"
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "Alertas Inteligentes",
      description: "Notificaciones automáticas para no perder oportunidades"
    }
  ];

  const plans = [
    {
      name: "Essential",
      price: "€99",
      period: "/mes",
      features: [
        "10 usuarios",
        "500 leads",
        "OKRs básicos",
        "CRM completo",
        "Dashboard de tareas",
        "Gamificación",
        "Soporte email"
      ]
    },
    {
      name: "Professional",
      price: "€249",
      period: "/mes",
      featured: true,
      features: [
        "30 usuarios",
        "Leads ilimitados",
        "OKRs avanzados",
        "CRM completo + Automatizaciones",
        "Dashboard de tareas",
        "Gamificación avanzada",
        "Reportes personalizados",
        "Integraciones (Zapier, etc.)",
        "Soporte prioritario"
      ]
    },
    {
      name: "Enterprise",
      price: "€449",
      period: "/mes",
      features: [
        "Usuarios ilimitados",
        "Leads ilimitados",
        "Todo de Professional +",
        "White-label",
        "API access",
        "Soporte dedicado",
        "Customizaciones",
        "SLA garantizado"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-16 text-center">
        <Badge className="mb-4 text-sm px-4 py-1">
          🎁 14 días GRATIS
        </Badge>
        
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
          OPTIMUS-K
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Generador de Apps de Gestión Empresarial
        </p>
        
        <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
          En <strong>2-3 horas</strong> tendrás una app completa adaptada a tu empresa:
          Tareas, OKRs, CRM, Métricas y Gamificación
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button 
            size="lg" 
            onClick={() => navigate('/onboarding')}
            className="text-lg px-8 py-6"
          >
            Empezar Ahora
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-lg px-8 py-6"
          >
            Ver Precios
          </Button>
        </div>

        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
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
      <div className="container mx-auto px-4 py-16">
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
              <h3 className="text-xl font-semibold mb-2">Completas el Onboarding (30 preguntas)</h3>
              <p className="text-muted-foreground">
                Nos cuentas sobre tu empresa, proceso comercial, productos, equipo y objetivos
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold">
              2
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Generamos tu App Personalizada</h3>
              <p className="text-muted-foreground">
                Nuestro sistema crea una app adaptada a tu negocio con tareas, métricas y procesos específicos
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold">
              3
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Empiezas a Usar tu App (2-3h después)</h3>
              <p className="text-muted-foreground">
                Recibes credenciales y ya puedes gestionar tu empresa de forma profesional
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Precios Transparentes
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          14 días GRATIS · Sin permanencia · Cancela cuando quieras
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`p-8 ${plan.featured ? 'border-primary border-2 shadow-xl' : ''}`}
            >
              {plan.featured && (
                <Badge className="mb-4">Más Popular</Badge>
              )}
              
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className="w-full" 
                variant={plan.featured ? "default" : "outline"}
                onClick={() => navigate('/onboarding')}
              >
                Empezar Prueba Gratis
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Final */}
      <div className="container mx-auto px-4 py-16 text-center">
        <Card className="p-12 bg-gradient-to-br from-primary/10 to-primary/5">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Listo para Optimizar tu Empresa?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Únete a empresas que ya están gestionando mejor con OPTIMUS-K
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/onboarding')}
            className="text-lg px-8 py-6"
          >
            Empezar Ahora Gratis
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            No se requiere tarjeta de crédito para la prueba
          </p>
        </Card>
      </div>

      {/* Footer */}
      <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground border-t">
        <p>© 2024 OPTIMUS-K · soporte@optimus-k.com</p>
      </div>
    </div>
  );
};

export default Landing;