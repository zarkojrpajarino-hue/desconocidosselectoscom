import { useState } from "react";
import DOMPurify from "dompurify";
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  CheckCircle2, Zap, TrendingUp, Users, Target, BarChart3, 
  ArrowRight, Clock, Shield, Building2, Rocket, Sparkles, 
  Check, LogIn, User, Menu, X, Lightbulb, Bot, Link as LinkIcon,
  Gauge, Crown, Star, Gift, Moon, Sun
} from "lucide-react";
import { PLAN_PRICES } from "@/constants/subscriptionLimits";
import { LanguageSelector } from "@/components/LanguageSelector";

// Integration logos
import slackLogo from "@/assets/integrations/slack-logo.png";
import hubspotLogo from "@/assets/integrations/hubspot-logo.png";
import outlookLogo from "@/assets/integrations/outlook-logo.png";
import trelloLogo from "@/assets/integrations/trello-logo.png";
import asanaLogo from "@/assets/integrations/asana-logo.png";
import zapierLogo from "@/assets/integrations/zapier-logo.png";

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const features = [
    {
      icon: <Target className="h-8 w-8" />,
      title: t('landing.features.dashboard.title'),
      description: t('landing.features.dashboard.description')
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: t('landing.features.okrs.title'),
      description: t('landing.features.okrs.description')
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: t('landing.features.crm.title'),
      description: t('landing.features.crm.description')
    },
    {
      icon: <Bot className="h-8 w-8" />,
      title: t('landing.features.ai.title'),
      description: t('landing.features.ai.description')
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: t('landing.features.gamification.title'),
      description: t('landing.features.gamification.description')
    },
    {
      icon: <LinkIcon className="h-8 w-8" />,
      title: t('landing.features.integrations.title'),
      description: t('landing.features.integrations.description')
    }
  ];

  const plans = [
    {
      name: t('landing.pricing.plans.free.name'),
      price: t('landing.pricing.plans.free.price'),
      period: t('landing.pricing.plans.free.period'),
      description: t('landing.pricing.plans.free.description'),
      icon: <Gift className="h-6 w-6" />,
      limits: t('landing.pricing.plans.free.limits'),
      features: t('landing.pricing.plans.free.features', { returnObjects: true }) as string[],
      cta: t('landing.pricing.plans.free.cta'),
      popular: false
    },
    {
      name: t('landing.pricing.plans.starter.name'),
      price: `€${PLAN_PRICES.starter}`,
      period: t('landing.pricing.perMonth'),
      description: t('landing.pricing.plans.starter.description'),
      icon: <Rocket className="h-6 w-6" />,
      limits: t('landing.pricing.plans.starter.limits'),
      features: t('landing.pricing.plans.starter.features', { returnObjects: true }) as string[],
      cta: t('landing.pricing.plans.starter.cta'),
      popular: false
    },
    {
      name: t('landing.pricing.plans.professional.name'),
      price: `€${PLAN_PRICES.professional}`,
      period: t('landing.pricing.perMonth'),
      description: t('landing.pricing.plans.professional.description'),
      icon: <Star className="h-6 w-6" />,
      featured: true,
      limits: t('landing.pricing.plans.professional.limits'),
      features: t('landing.pricing.plans.professional.features', { returnObjects: true }) as string[],
      cta: t('landing.pricing.plans.professional.cta'),
      popular: true
    },
    {
      name: t('landing.pricing.plans.enterprise.name'),
      price: `€${PLAN_PRICES.enterprise}`,
      period: t('landing.pricing.perMonth'),
      description: t('landing.pricing.plans.enterprise.description'),
      icon: <Crown className="h-6 w-6" />,
      limits: t('landing.pricing.plans.enterprise.limits'),
      features: t('landing.pricing.plans.enterprise.features', { returnObjects: true }) as string[],
      cta: t('landing.pricing.plans.enterprise.cta'),
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
              {t('nav.features')}
            </Button>
            <Button variant="ghost" onClick={() => scrollToSection('integrations')}>
              {t('nav.integrations')}
            </Button>
            <Button variant="ghost" onClick={() => scrollToSection('pricing')}>
              {t('nav.pricing')}
            </Button>
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSelector />
            
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground"
            >
              {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {user ? (
              <Button onClick={() => navigate('/home')}>
                <User className="w-4 h-4 mr-2" />
                {t('nav.goToDashboard')}
              </Button>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/login')} 
                  className="hidden sm:flex"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  {t('nav.login')}
                </Button>
                <Button onClick={() => scrollToSection('how-it-works')}>
                  {t('nav.startFree')}
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
              <Button variant="ghost" className="justify-start" onClick={() => scrollToSection('features')}>
                {t('nav.features')}
              </Button>
              <Button variant="ghost" className="justify-start" onClick={() => scrollToSection('integrations')}>
                {t('nav.integrations')}
              </Button>
              <Button variant="ghost" className="justify-start" onClick={() => scrollToSection('pricing')}>
                {t('nav.pricing')}
              </Button>
              {!user && (
                <Button variant="ghost" className="justify-start" onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}>
                  <LogIn className="w-4 h-4 mr-2" />
                  {t('nav.login')}
                </Button>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-12 text-center">
        <Badge className="mb-4 text-sm px-4 py-1">{t('landing.badge')}</Badge>
        
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
          {t('landing.hero.title')}
        </h1>
        
        <p className="text-xl md:text-2xl mb-4 max-w-3xl mx-auto">
          {t('landing.hero.subtitle')}{" "}
          <strong className="text-primary">{t('landing.hero.subtitleHighlight')}</strong>
        </p>

        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t('landing.hero.description')) }} />

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button size="lg" onClick={() => scrollToSection('how-it-works')} className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
            {t('landing.hero.cta')}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => scrollToSection('pricing')} className="text-lg px-8 py-6">
            {t('landing.hero.viewPricing')}
          </Button>
        </div>

        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground flex-wrap">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>{t('landing.trust.noCommitment')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-500" />
            <span>{t('landing.trust.securePayment')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-500" />
            <span>{t('landing.trust.quickSetup')}</span>
          </div>
        </div>
      </div>

      {/* Choose Path Section - AHORA JUSTO DESPUÉS DEL HERO */}
      <div id="how-it-works" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">{t('landing.choosePath.title')}</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">{t('landing.choosePath.subtitle')}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="p-8 hover:shadow-xl transition-all cursor-pointer group border-2 hover:border-primary" onClick={() => navigate('/onboarding')}>
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Building2 className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">{t('landing.choosePath.business.title')}</h3>
              <p className="text-muted-foreground mb-6">{t('landing.choosePath.business.description')}</p>
              <ul className="text-sm text-left space-y-2 mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /><span>{t('landing.choosePath.business.feature1')}</span></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /><span>{t('landing.choosePath.business.feature2')}</span></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /><span>{t('landing.choosePath.business.feature3')}</span></li>
              </ul>
              <Button className="w-full group-hover:bg-primary/90">{t('landing.choosePath.business.cta')}<ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </Card>

          <Card className="p-8 hover:shadow-xl transition-all cursor-pointer group border-2 hover:border-accent" onClick={() => navigate('/onboarding?type=startup')}>
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Rocket className="h-10 w-10 text-accent" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-2xl font-bold">{t('landing.choosePath.startup.title')}</h3>
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <p className="text-muted-foreground mb-6">{t('landing.choosePath.startup.description')}</p>
              <ul className="text-sm text-left space-y-2 mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /><span>{t('landing.choosePath.startup.feature1')}</span></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /><span>{t('landing.choosePath.startup.feature2')}</span></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /><span>{t('landing.choosePath.startup.feature3')}</span></li>
              </ul>
              <Button variant="outline" className="w-full group-hover:border-accent group-hover:text-accent">{t('landing.choosePath.startup.cta')}<ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">{t('landing.features.title')}</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">{t('landing.features.subtitle')}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">{t('landing.integrations.title')}</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t('landing.integrations.subtitle')) }} />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 max-w-5xl mx-auto mb-8">
          {[
            { name: 'Slack', logo: slackLogo },
            { name: 'HubSpot', logo: hubspotLogo },
            { name: 'Outlook', logo: outlookLogo },
            { name: 'Trello', logo: trelloLogo },
            { name: 'Asana', logo: asanaLogo },
            { name: 'Zapier', logo: zapierLogo }
          ].map((integration) => (
            <div key={integration.name} className="flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-background transition-colors group">
              <div className="w-20 h-20 bg-background rounded-xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform border p-3">
                <img 
                  src={integration.logo} 
                  alt={`${integration.name} logo`} 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-sm font-medium text-center">{integration.name}</span>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">{t('landing.integrations.apiNote')}</p>
          <Button variant="outline" onClick={() => navigate('/integraciones')}>{t('landing.integrations.viewAll')}</Button>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="container mx-auto px-3 md:px-4 py-8 md:py-16">
        <h2 className="text-2xl md:text-4xl font-bold text-center mb-3 md:mb-4">{t('landing.pricing.title')}</h2>
        <p className="text-sm md:text-base text-center text-muted-foreground mb-6 md:mb-12">{t('landing.pricing.subtitle')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 px-0 md:px-4">
          {plans.map((plan, index) => (
            <Card key={index} className={`p-4 flex flex-col min-w-0 ${plan.featured ? 'border-primary border-2 shadow-2xl relative' : 'hover:shadow-lg transition-shadow'}`}>
              {plan.featured && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-xs whitespace-nowrap">
                  {t('landing.pricing.mostPopular')}
                </Badge>
              )}
              
              <div className="flex items-center gap-2 mb-2">
                <div className="text-primary flex-shrink-0">{plan.icon}</div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold truncate">{plan.name}</h3>
                  <p className="text-[10px] text-muted-foreground truncate">{plan.description}</p>
                </div>
              </div>
              
              <div className="mb-2">
                <span className="text-xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground text-[10px]">{plan.period}</span>
              </div>

              <p className="text-[10px] text-muted-foreground mb-3 border-b pb-2 truncate">{plan.limits}</p>

              <ul className="space-y-1 mb-3 text-[11px] flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <Check className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button className="w-full mt-auto text-xs" size="sm" variant={plan.featured ? "default" : "outline"} onClick={() => scrollToSection('how-it-works')}>
                {t('landing.pricing.startOnboarding')}
              </Button>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">{t('landing.pricing.customPlan')}</p>
          <Button variant="link" onClick={() => window.location.href = 'mailto:sales@optimus-k.com'}>
            {t('landing.pricing.contactUs')}
          </Button>
        </div>
      </div>

      {/* CTA Final */}
      <div className="container mx-auto px-4 py-16 text-center bg-gradient-to-r from-primary/10 to-primary/5 rounded-3xl mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('landing.cta.title')}</h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">{t('landing.cta.subtitle')}</p>
        <Button size="lg" onClick={() => scrollToSection('how-it-works')} className="text-lg px-12 py-6">
          {t('landing.cta.button')}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
        <p className="text-sm text-muted-foreground mt-4">{t('landing.cta.noCreditCard')}</p>
      </div>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>{t('landing.footer.copyright')}</p>
          <div className="flex justify-center gap-4 mt-4">
            <Button variant="link" size="sm">{t('landing.footer.terms')}</Button>
            <Button variant="link" size="sm">{t('landing.footer.privacy')}</Button>
            <Button variant="link" size="sm">{t('landing.footer.contact')}</Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
