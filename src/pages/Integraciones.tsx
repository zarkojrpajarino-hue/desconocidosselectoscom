import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LanguageSelector } from "@/components/LanguageSelector";
import { 
  ArrowLeft, Check, MessageSquare, Link2, Calendar, 
  ListTodo, LayoutDashboard, Zap, Send, Loader2, Lock, Moon, Sun 
} from "lucide-react";
import { toast } from "sonner";
import { LockedFeatureCard } from "@/components/plan";

interface IntegrationInfo {
  id: string;
  nameKey: string;
  icon: React.ReactNode;
  descriptionKey: string;
  featuresKeys: string[];
  useCasesKeys: string[];
  plans: ('starter' | 'professional' | 'enterprise')[];
  minPlan: string;
}

const integrations: IntegrationInfo[] = [
  {
    id: 'google-calendar',
    nameKey: 'integrations.items.googleCalendar.name',
    icon: <Calendar className="h-6 w-6 md:h-8 md:w-8" />,
    descriptionKey: 'integrations.items.googleCalendar.description',
    featuresKeys: [
      'integrations.items.googleCalendar.features.sync',
      'integrations.items.googleCalendar.features.reminders',
      'integrations.items.googleCalendar.features.weeklyView',
      'integrations.items.googleCalendar.features.timeBlocking'
    ],
    useCasesKeys: [
      'integrations.items.googleCalendar.useCases.schedule',
      'integrations.items.googleCalendar.useCases.reminders',
      'integrations.items.googleCalendar.useCases.workload'
    ],
    plans: ['starter', 'professional', 'enterprise'],
    minPlan: 'Starter'
  },
  {
    id: 'slack',
    nameKey: 'integrations.items.slack.name',
    icon: <MessageSquare className="h-6 w-6 md:h-8 md:w-8" />,
    descriptionKey: 'integrations.items.slack.description',
    featuresKeys: [
      'integrations.items.slack.features.leads',
      'integrations.items.slack.features.okrs',
      'integrations.items.slack.features.celebrations',
      'integrations.items.slack.features.dailySummary'
    ],
    useCasesKeys: [
      'integrations.items.slack.useCases.hotLeads',
      'integrations.items.slack.useCases.okrAlerts',
      'integrations.items.slack.useCases.teamCelebrations'
    ],
    plans: ['professional', 'enterprise'],
    minPlan: 'Professional'
  },
  {
    id: 'hubspot',
    nameKey: 'integrations.items.hubspot.name',
    icon: <Link2 className="h-6 w-6 md:h-8 md:w-8" />,
    descriptionKey: 'integrations.items.hubspot.description',
    featuresKeys: [
      'integrations.items.hubspot.features.import',
      'integrations.items.hubspot.features.export',
      'integrations.items.hubspot.features.deals',
      'integrations.items.hubspot.features.mapping'
    ],
    useCasesKeys: [
      'integrations.items.hubspot.useCases.import',
      'integrations.items.hubspot.useCases.autoCreate',
      'integrations.items.hubspot.useCases.unifiedMetrics'
    ],
    plans: ['professional', 'enterprise'],
    minPlan: 'Professional'
  },
  {
    id: 'outlook',
    nameKey: 'integrations.items.outlook.name',
    icon: <Calendar className="h-6 w-6 md:h-8 md:w-8" />,
    descriptionKey: 'integrations.items.outlook.description',
    featuresKeys: [
      'integrations.items.outlook.features.sync365',
      'integrations.items.outlook.features.reminders',
      'integrations.items.outlook.features.corporate',
      'integrations.items.outlook.features.teams'
    ],
    useCasesKeys: [
      'integrations.items.outlook.useCases.microsoft',
      'integrations.items.outlook.useCases.syncWork',
      'integrations.items.outlook.useCases.unified'
    ],
    plans: ['professional', 'enterprise'],
    minPlan: 'Professional'
  },
  {
    id: 'trello',
    nameKey: 'integrations.items.trello.name',
    icon: <LayoutDashboard className="h-6 w-6 md:h-8 md:w-8" />,
    descriptionKey: 'integrations.items.trello.description',
    featuresKeys: [
      'integrations.items.trello.features.export',
      'integrations.items.trello.features.columns',
      'integrations.items.trello.features.labels',
      'integrations.items.trello.features.status'
    ],
    useCasesKeys: [
      'integrations.items.trello.useCases.teams',
      'integrations.items.trello.useCases.visualize',
      'integrations.items.trello.useCases.keepUpdated'
    ],
    plans: ['professional', 'enterprise'],
    minPlan: 'Professional'
  },
  {
    id: 'asana',
    nameKey: 'integrations.items.asana.name',
    icon: <ListTodo className="h-6 w-6 md:h-8 md:w-8" />,
    descriptionKey: 'integrations.items.asana.description',
    featuresKeys: [
      'integrations.items.asana.features.export',
      'integrations.items.asana.features.deadlines',
      'integrations.items.asana.features.assignees',
      'integrations.items.asana.features.subtasks'
    ],
    useCasesKeys: [
      'integrations.items.asana.useCases.teams',
      'integrations.items.asana.useCases.syncDeadlines',
      'integrations.items.asana.useCases.productTeam'
    ],
    plans: ['professional', 'enterprise'],
    minPlan: 'Professional'
  },
  {
    id: 'zapier',
    nameKey: 'integrations.items.zapier.name',
    icon: <Zap className="h-6 w-6 md:h-8 md:w-8" />,
    descriptionKey: 'integrations.items.zapier.description',
    featuresKeys: [
      'integrations.items.zapier.features.webhooks',
      'integrations.items.zapier.features.triggers',
      'integrations.items.zapier.features.apps',
      'integrations.items.zapier.features.unlimited'
    ],
    useCasesKeys: [
      'integrations.items.zapier.useCases.stripe',
      'integrations.items.zapier.useCases.discord',
      'integrations.items.zapier.useCases.mailchimp'
    ],
    plans: ['professional', 'enterprise'],
    minPlan: 'Professional'
  }
];

const Integraciones = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const planAccess = usePlanAccess();
  const [suggestionName, setSuggestionName] = useState('');
  const [suggestionEmail, setSuggestionEmail] = useState('');
  const [suggestionTool, setSuggestionTool] = useState('');
  const [suggestionReason, setSuggestionReason] = useState('');
  const [sending, setSending] = useState(false);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const hasAccess = planAccess.hasFeature('google_calendar');

  const handleSuggestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestionTool.trim()) {
      toast.error(t('integrations.suggestion.errorEmpty'));
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-tool-suggestion', {
        body: {
          name: suggestionName.trim() || undefined,
          email: suggestionEmail.trim() || undefined,
          toolName: suggestionTool.trim(),
          reason: suggestionReason.trim() || undefined,
        }
      });
      
      if (error) throw error;
      
      toast.success(t('integrations.suggestion.success'), {
        description: t('integrations.suggestion.successDescription')
      });
      setSuggestionName('');
      setSuggestionEmail('');
      setSuggestionTool('');
      setSuggestionReason('');
    } catch {
      toast.error(t('integrations.suggestion.error'));
    } finally {
      setSending(false);
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'Starter':
        return 'bg-info/10 text-info border-info/20';
      case 'Professional':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'Enterprise':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Show locked card for users without access (logged in users only)
  if (user && !hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24 md:pb-0">
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
          <div className="container flex h-14 md:h-16 items-center justify-between px-4 md:px-6 gap-3">
            <div className="flex items-center gap-3 md:gap-4 min-w-0">
              <Button variant="ghost" size="sm" onClick={() => navigate('/home')}>
                <ArrowLeft className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">{t('common.back')}</span>
              </Button>
              <span className="font-bold text-lg md:text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent truncate">
                {t('integrations.title')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSelector />
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
                {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </header>
        
        <div className="container mx-auto px-4 md:px-6 max-w-3xl pt-8 md:pt-12">
          <LockedFeatureCard
            icon="🔗"
            title={t('integrations.locked.title')}
            description={t('integrations.locked.description')}
            requiredPlan="professional"
            features={[
              t('integrations.locked.features.googleCalendar'),
              t('integrations.locked.features.slack'),
              t('integrations.locked.features.hubspot'),
              t('integrations.locked.features.outlook'),
              t('integrations.locked.features.zapier')
            ]}
            onUpgrade={() => navigate('/#pricing')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-14 md:h-16 items-center justify-between px-4 md:px-6 gap-3">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">{t('common.back')}</span>
            </Button>
            <span className="font-bold text-lg md:text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent truncate">
              {t('integrations.title')}
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <LanguageSelector />
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
              {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button size="sm" onClick={() => navigate('/signup')}>
              <span className="hidden sm:inline">{t('nav.startFree')}</span>
              <span className="sm:hidden">{t('common.start', 'Empezar')}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="container mx-auto px-4 md:px-8 lg:px-12 pt-10 md:pt-16 pb-8 md:pb-12 text-center">
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-foreground">
          {t('integrations.hero.title')}
        </h1>
        <p className="text-sm md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 md:mb-8">
          {t('integrations.hero.description')}
        </p>
        <div className="flex justify-center gap-3 md:gap-4 flex-wrap">
          <Badge variant="outline" className="text-xs md:text-sm py-1.5 px-3 md:px-4 bg-background">
            <Check className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 text-success" />
            {t('integrations.hero.badge1')}
          </Badge>
          <Badge variant="outline" className="text-xs md:text-sm py-1.5 px-3 md:px-4 bg-background">
            <Zap className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 text-warning" />
            {t('integrations.hero.badge2')}
          </Badge>
        </div>
      </div>

      {/* Integrations Grid - IMPROVED SPACING */}
      <div className="container mx-auto px-4 md:px-8 lg:px-12 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-10">
          {integrations.map(integration => (
            <Card 
              key={integration.id} 
              className="p-5 md:p-7 lg:p-8 hover:shadow-lg transition-shadow border-border bg-card"
            >
              <div className="flex items-start gap-4 md:gap-5 mb-5 md:mb-6">
                <div className="p-3 md:p-4 rounded-xl bg-primary/10 text-primary flex-shrink-0">
                  {integration.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                    <h3 className="text-lg md:text-xl font-bold text-foreground">
                      {t(integration.nameKey)}
                    </h3>
                    <Badge variant="outline" className={`text-xs ${getPlanBadgeColor(integration.minPlan)}`}>
                      {integration.minPlan === 'Starter' ? <Check className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                      {integration.minPlan}+
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm md:text-base">
                    {t(integration.descriptionKey)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                {/* Features */}
                <div>
                  <h4 className="font-semibold text-xs md:text-sm mb-3 text-muted-foreground uppercase tracking-wide">
                    {t('integrations.features')}
                  </h4>
                  <ul className="space-y-2 md:space-y-2.5">
                    {integration.featuresKeys.map((featureKey, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                        <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                        <span>{t(featureKey)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Use Cases */}
                <div>
                  <h4 className="font-semibold text-xs md:text-sm mb-3 text-muted-foreground uppercase tracking-wide">
                    {t('integrations.useCases')}
                  </h4>
                  <ul className="space-y-2 md:space-y-2.5">
                    {integration.useCasesKeys.map((useCaseKey, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                        <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{t(useCaseKey)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Plans Available */}
              <div className="mt-5 md:mt-6 pt-4 md:pt-5 border-t border-border flex items-center gap-2 md:gap-3 flex-wrap">
                <span className="text-xs text-muted-foreground">{t('integrations.availableIn')}:</span>
                {integration.plans.map(plan => (
                  <Badge key={plan} variant="secondary" className="text-xs capitalize">
                    {plan}
                  </Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Suggestion Form */}
      <div id="suggest" className="container mx-auto px-4 md:px-8 lg:px-12 py-10 md:py-16">
        <Card className="max-w-2xl mx-auto p-5 md:p-8 lg:p-10 bg-card border-border">
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 md:mb-3 text-foreground">
              {t('integrations.suggestion.title')}
            </h2>
            <p className="text-sm md:text-base text-muted-foreground">
              {t('integrations.suggestion.description')}
            </p>
          </div>

          <form onSubmit={handleSuggestionSubmit} className="space-y-4 md:space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              <div>
                <label className="text-sm font-medium mb-1.5 block text-foreground">
                  {t('integrations.suggestion.name')}
                </label>
                <Input 
                  placeholder={t('integrations.suggestion.namePlaceholder')} 
                  value={suggestionName} 
                  onChange={e => setSuggestionName(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block text-foreground">
                  {t('integrations.suggestion.email')}
                </label>
                <Input 
                  type="email" 
                  placeholder={t('integrations.suggestion.emailPlaceholder')} 
                  value={suggestionEmail} 
                  onChange={e => setSuggestionEmail(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">
                {t('integrations.suggestion.tool')} <span className="text-destructive">*</span>
              </label>
              <Input 
                placeholder={t('integrations.suggestion.toolPlaceholder')} 
                value={suggestionTool} 
                onChange={e => setSuggestionTool(e.target.value)} 
                required
                className="bg-background"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">
                {t('integrations.suggestion.reason')}
              </label>
              <Textarea 
                placeholder={t('integrations.suggestion.reasonPlaceholder')} 
                value={suggestionReason} 
                onChange={e => setSuggestionReason(e.target.value)} 
                rows={3}
                className="bg-background"
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={sending}>
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('integrations.suggestion.sending')}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {t('integrations.suggestion.submit')}
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 md:py-10">
        <div className="container mx-auto px-4 md:px-8 text-center text-sm text-muted-foreground">
          <p>{t('integrations.footer')}</p>
        </div>
      </footer>
    </div>
  );
};

export default Integraciones;
