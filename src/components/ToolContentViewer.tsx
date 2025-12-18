import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, Sparkles, Lock, Eye, Settings2 } from 'lucide-react';
import { ToolType, useToolContent } from '@/hooks/useToolContent';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { UpgradeModal } from '@/components/UpgradeModal';
import { ToolDataReviewModal } from '@/components/ToolDataReviewModal';

interface ToolContentViewerProps {
  toolType: ToolType;
  title: string;
  description: string;
  renderContent: (content: Record<string, unknown>) => React.ReactNode;
  demoData?: Record<string, unknown>;
}

const ToolContentViewer = ({ toolType, title, description, renderContent, demoData }: ToolContentViewerProps) => {
  const { content, loading, generating, generateContent, hasContent, isAdmin } = useToolContent(toolType);
  const { canUseAiTool, plan } = useSubscriptionLimits();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDataReviewModal, setShowDataReviewModal] = useState(false);
  // Show demo by default if no content exists
  const [showDemo, setShowDemo] = useState(!hasContent && !!demoData);

  // Update showDemo when hasContent changes
  useEffect(() => {
    if (!hasContent && demoData) {
      setShowDemo(true);
    }
  }, [hasContent, demoData]);

  const { allowed: hasToolAccess, message: toolMessage } = canUseAiTool(toolType);

  const handleUpdateData = () => {
    if (!hasToolAccess) {
      setShowUpgradeModal(true);
      return;
    }
    setShowDataReviewModal(true);
  };

  const handleRegenerate = () => {
    generateContent();
  };

  // Show loading state only briefly, then fall back to demo
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Determine what data to show
  const displayContent = showDemo && demoData ? demoData : content;
  const shouldShowContent = hasContent || (showDemo && demoData);

  // Si no tiene acceso y no hay contenido
  if (!hasToolAccess && !hasContent && !demoData) {
    return (
      <>
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {title}
              </CardTitle>
              <Badge variant="secondary" className="gap-1">
                <Lock className="w-3 h-3" />
                Plan Superior
              </Badge>
            </div>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-muted-foreground">
                Esta herramienta no está disponible en tu plan actual
              </div>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {toolMessage || 'Mejora tu plan para acceder a todas las herramientas estratégicas con IA'}
              </p>
              <Button
                onClick={() => setShowUpgradeModal(true)}
                size="lg"
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Mejorar Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          currentPlan={plan}
          limitType="ai_tools"
          featureName={title}
        />
      </>
    );
  }

  // Show demo toggle + empty state if no content but has demo data
  if (!hasContent && demoData) {
    return (
      <>
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Ver Demo</span>
                <Switch checked={showDemo} onCheckedChange={setShowDemo} />
              </div>
            </div>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {showDemo ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <Eye className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary font-medium">
                    Modo Demo - Datos de ejemplo para visualizar la herramienta
                  </span>
                </div>
                {renderContent(demoData)}
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                </div>
                <div className="font-medium text-foreground">
                  Generando herramienta automáticamente...
                </div>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Esta herramienta se genera automáticamente con los datos de tu onboarding. Activa el modo Demo mientras se completa el proceso.
                </p>
                <Button
                  onClick={() => setShowDemo(true)}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Ver Demo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          currentPlan={plan}
          limitType="ai_tools"
          featureName={title}
        />
      </>
    );
  }

  // No content and no demo data - show generation option
  if (!hasContent) {
    return (
      <>
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
              </div>
              <div className="font-medium text-foreground">
                Generando herramienta automáticamente...
              </div>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Esta herramienta se genera automáticamente con los datos de tu onboarding. Espera unos minutos y recarga la página.
              </p>
            </div>
          </CardContent>
        </Card>

        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          currentPlan={plan}
          limitType="ai_tools"
          featureName={title}
        />

        <ToolDataReviewModal
          open={showDataReviewModal}
          onOpenChange={setShowDataReviewModal}
          toolType={toolType}
          toolName={title}
          onRegenerate={handleRegenerate}
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-4 pb-20 md:pb-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
          <div className="min-w-0">
            <h2 className="text-lg md:text-xl font-semibold truncate">{title}</h2>
            <p className="text-xs md:text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {demoData && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Demo</span>
                <Switch checked={showDemo} onCheckedChange={setShowDemo} />
              </div>
            )}
            {isAdmin && hasToolAccess && (
              <Button
                onClick={handleUpdateData}
                disabled={generating}
                variant="outline"
                size="sm"
                className="gap-2 h-8 md:h-9 text-xs md:text-sm"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                    <span className="hidden md:inline">Actualizando...</span>
                    <span className="md:hidden">...</span>
                  </>
                ) : (
                  <>
                    <Settings2 className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="hidden md:inline">Actualizar Datos</span>
                    <span className="md:hidden">Actualizar</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
        
        {showDemo && demoData && (
          <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg border border-primary/20">
            <Eye className="w-4 h-4 text-primary" />
            <span className="text-xs text-primary font-medium">
              Modo Demo activo - Mostrando datos de ejemplo
            </span>
          </div>
        )}
        
        {displayContent && renderContent(displayContent)}
      </div>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        currentPlan={plan}
        limitType="ai_tools"
        featureName={title}
      />

      <ToolDataReviewModal
        open={showDataReviewModal}
        onOpenChange={setShowDataReviewModal}
        toolType={toolType}
        toolName={title}
        onRegenerate={handleRegenerate}
      />
    </>
  );
};

export default ToolContentViewer;
