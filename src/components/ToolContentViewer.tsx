import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { ToolType, useToolContent } from '@/hooks/useToolContent';

interface ToolContentViewerProps {
  toolType: ToolType;
  title: string;
  description: string;
  renderContent: (content: any) => React.ReactNode;
}

const ToolContentViewer = ({ toolType, title, description, renderContent }: ToolContentViewerProps) => {
  const { content, loading, generating, generateContent, hasContent, isAdmin } = useToolContent(toolType);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasContent) {
    return (
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
                  onClick={generateContent}
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
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {isAdmin && (
          <Button
            onClick={generateContent}
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
  );
};

export default ToolContentViewer;
