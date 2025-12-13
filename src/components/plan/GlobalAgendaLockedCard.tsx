import { useTranslation } from 'react-i18next';
import { Calendar, Lock, Sparkles, Building2, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

export function GlobalAgendaLockedCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const features = [
    t('globalAgenda.locked.features.viewAll'),
    t('globalAgenda.locked.features.googleCalendar'),
    t('globalAgenda.locked.features.outlookCalendar'),
    t('globalAgenda.locked.features.personalTasks'),
    t('globalAgenda.locked.features.conflictDetection'),
    t('globalAgenda.locked.features.orgColors'),
  ];

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-3 md:p-4">
      <Card className="max-w-lg w-full border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <CardContent className="pt-6 pb-6 px-4 md:pt-8 md:pb-8 md:px-6 space-y-4 md:space-y-6">
          {/* Header */}
          <div className="text-center space-y-3 md:space-y-4">
            <div className="mx-auto w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Calendar className="w-7 h-7 md:w-8 md:h-8 text-primary-foreground" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <h2 className="text-xl md:text-2xl font-bold text-foreground">
                  {t('globalAgenda.locked.title')}
                </h2>
                <Badge variant="outline" className="text-primary border-primary/50">
                  <Lock className="w-3 h-3 mr-1" />
                  PRO
                </Badge>
              </div>
              <p className="text-sm md:text-base text-muted-foreground">
                {t('globalAgenda.locked.description')}
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2 md:space-y-3 py-3 md:py-4 border-y border-border">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 md:gap-3 text-xs md:text-sm">
                <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-primary" />
                </div>
                <span className="text-foreground">{feature}</span>
              </div>
            ))}
          </div>

          {/* Visual Preview */}
          <div className="bg-muted/50 rounded-lg p-3 md:p-4 space-y-2 md:space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="w-4 h-4" />
              <span>{t('globalAgenda.locked.preview')}</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <div className="h-7 md:h-8 bg-primary/10 rounded flex-1 flex items-center px-2 md:px-3 text-xs text-primary">
                  {t('globalAgenda.locked.previewOrg1')}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <div className="h-7 md:h-8 bg-accent/10 rounded flex-1 flex items-center px-2 md:px-3 text-xs text-accent-foreground">
                  {t('globalAgenda.locked.previewOrg2')}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success" />
                <div className="h-7 md:h-8 bg-success/10 rounded flex-1 flex items-center px-2 md:px-3 text-xs text-success">
                  {t('globalAgenda.locked.previewPersonal')}
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-2 md:space-y-3">
            <Button 
              onClick={() => navigate('/#pricing')} 
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
              size="lg"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {t('globalAgenda.locked.cta')}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {t('globalAgenda.locked.ctaSubtext')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
