import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, RefreshCw, Lock } from 'lucide-react';
import { ToolType, useToolContent } from '@/hooks/useToolContent';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { UpgradeModal } from '@/components/UpgradeModal';

interface ToolContentViewerProps {
  toolType: ToolType;
  title: string;
  description: string;
  renderContent: (content: any) => React.ReactNode;
}

const ToolContentViewer = ({ toolType, title, description, renderContent }: ToolContentViewerProps) => {
  const { content, loading, generating, generateContent, hasContent, isAdmin } = useToolContent(toolType);
  const { canUseAiTool, plan } = useSubscriptionLimits();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const { allowed: hasToolAccess, message: toolMessage } = canUseAiTool(toolType);

  const handleGenerate = () => {
    // Verificar acceso a la herramienta
    if (!hasToolAccess) {
      setShowUpgradeModal(true);
      return;
    }
    generateContent();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Si no tiene acceso y no hay contenido
  if (!hasToolAccess && !hasContent) {
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
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8 text-amber-600" />
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
              <div className="text-muted-foreground">
                Esta herramienta aún no ha sido personalizada para tu empresa
              </div>
              {isAdmin ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Genera contenido personalizado basado en los datos de tu organización usando IA
                  </p>
                  <Button
                    onClick={handleGenerate}
                    disabled={generating}
                    size="lg"
                    className="gap-2"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generar con IA
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Contacta al administrador para generar el contenido personalizado
                </p>
              )}
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

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {isAdmin && hasToolAccess && (
            <Button
              onClick={handleGenerate}
              disabled={generating}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Regenerando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Regenerar
                </>
              )}
            </Button>
          )}
        </div>
        {renderContent(content)}
      </div>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        currentPlan={plan}
        limitType="ai_tools"
        featureName={title}
      />
    </>
  );
};

export default ToolContentViewer;
