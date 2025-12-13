import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { useToolContent, TOOL_PLAN_REQUIREMENTS } from '@/hooks/useToolContent';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Globe, Sparkles, Download, ExternalLink, Loader2, Lock, Code, Palette, Layout, Smartphone } from 'lucide-react';
import { LockedFeatureCard } from '@/components/plan/LockedFeatureCard';
import { useTranslation } from 'react-i18next';

const WebGeneratorPage = () => {
  const { t } = useTranslation();
  const { organizationId, organizationName } = useCurrentOrganization();
  const navigate = useNavigate();
  const { content, loading, generating, generateContent, hasContent, isAdmin } = useToolContent('web_generator');
  const { limits, plan } = useSubscriptionLimits();
  
  const requiredPlan = TOOL_PLAN_REQUIREMENTS['web_generator'];
  const hasAccess = limits?.web_generator || plan === 'enterprise';

  const handleDownloadHTML = () => {
    if (!content) return;
    
    const htmlContent = generateHTMLFromContent(content);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `landing-page-${organizationName?.toLowerCase().replace(/\s+/g, '-') || 'web'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateHTMLFromContent = (data: WebGeneratorContent): string => {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.meta?.title || organizationName}</title>
    <meta name="description" content="${data.meta?.description || ''}">
    <link href="https://fonts.googleapis.com/css2?family=${data.design?.font_heading?.replace(/\s+/g, '+') || 'Inter'}:wght@400;600;700;800&family=${data.design?.font_body?.replace(/\s+/g, '+') || 'Inter'}:wght@400;500;600&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        :root {
            --primary: ${data.design?.primary_color || '#3B82F6'};
            --secondary: ${data.design?.secondary_color || '#10B981'};
            --accent: ${data.design?.accent_color || '#8B5CF6'};
        }
        body { font-family: '${data.design?.font_body || 'Inter'}', sans-serif; }
        h1, h2, h3, h4, h5, h6 { font-family: '${data.design?.font_heading || 'Inter'}', sans-serif; }
        .btn-primary { background: var(--primary); }
        .btn-primary:hover { opacity: 0.9; }
        .text-primary { color: var(--primary); }
        .bg-primary { background: var(--primary); }
        .gradient-hero { background: linear-gradient(135deg, var(--primary), var(--secondary)); }
    </style>
</head>
<body class="bg-white">
    <!-- Hero Section -->
    <header class="gradient-hero text-white py-20 px-4">
        <div class="max-w-6xl mx-auto text-center">
            <h1 class="text-4xl md:text-6xl font-bold mb-6">${data.hero?.headline || ''}</h1>
            <p class="text-xl md:text-2xl opacity-90 mb-8 max-w-3xl mx-auto">${data.hero?.subheadline || ''}</p>
            <a href="${data.hero?.cta_url || '#contact'}" class="inline-block bg-white text-gray-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition">
                ${data.hero?.cta_text || 'Empezar Ahora'}
            </a>
        </div>
    </header>

    <!-- Features Section -->
    <section class="py-20 px-4 bg-gray-50">
        <div class="max-w-6xl mx-auto">
            <h2 class="text-3xl md:text-4xl font-bold text-center mb-12">${data.features?.title || 'Características'}</h2>
            <div class="grid md:grid-cols-3 gap-8">
                ${(data.features?.items || []).map((feature: { icon: string; title: string; description: string }) => `
                <div class="bg-white p-8 rounded-xl shadow-sm">
                    <div class="text-4xl mb-4">${feature.icon}</div>
                    <h3 class="text-xl font-bold mb-3">${feature.title}</h3>
                    <p class="text-gray-600">${feature.description}</p>
                </div>
                `).join('')}
            </div>
        </div>
    </section>

    <!-- Benefits Section -->
    <section class="py-20 px-4">
        <div class="max-w-6xl mx-auto">
            <h2 class="text-3xl md:text-4xl font-bold text-center mb-12">${data.benefits?.title || 'Beneficios'}</h2>
            <div class="grid md:grid-cols-2 gap-8">
                ${(data.benefits?.items || []).map((benefit: { title: string; description: string }) => `
                <div class="flex gap-4">
                    <div class="flex-shrink-0 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white text-xl">✓</div>
                    <div>
                        <h3 class="text-xl font-bold mb-2">${benefit.title}</h3>
                        <p class="text-gray-600">${benefit.description}</p>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
    </section>

    <!-- Testimonials Section -->
    ${data.testimonials?.items?.length ? `
    <section class="py-20 px-4 bg-gray-50">
        <div class="max-w-6xl mx-auto">
            <h2 class="text-3xl md:text-4xl font-bold text-center mb-12">${data.testimonials?.title || 'Testimonios'}</h2>
            <div class="grid md:grid-cols-3 gap-8">
                ${(data.testimonials?.items || []).map((testimonial: { quote: string; author: string; role: string }) => `
                <div class="bg-white p-8 rounded-xl shadow-sm">
                    <p class="text-gray-700 mb-6 italic">"${testimonial.quote}"</p>
                    <div>
                        <p class="font-bold">${testimonial.author}</p>
                        <p class="text-sm text-gray-500">${testimonial.role}</p>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
    </section>
    ` : ''}

    <!-- CTA Section -->
    <section class="gradient-hero text-white py-16 px-4">
        <div class="max-w-4xl mx-auto text-center">
            <h2 class="text-3xl md:text-4xl font-bold mb-6">${data.cta?.headline || '¿Listo para empezar?'}</h2>
            <p class="text-xl opacity-90 mb-8">${data.cta?.subheadline || ''}</p>
            <a href="${data.cta?.button_url || '#contact'}" class="inline-block bg-white text-gray-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition">
                ${data.cta?.button_text || 'Contactar'}
            </a>
        </div>
    </section>

    <!-- Footer -->
    <footer class="py-12 px-4 bg-gray-900 text-white">
        <div class="max-w-6xl mx-auto text-center">
            <p class="text-2xl font-bold mb-4">${organizationName || ''}</p>
            <p class="text-gray-400">${data.footer?.tagline || ''}</p>
            <p class="mt-8 text-sm text-gray-500">© ${new Date().getFullYear()} ${organizationName}. Todos los derechos reservados.</p>
        </div>
    </footer>
</body>
</html>`;
  };

  if (!organizationId) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay organización seleccionada</h3>
            <p className="text-muted-foreground text-center mb-4">
              Selecciona una organización para generar tu página web
            </p>
            <Button onClick={() => navigate('/select-organization')}>
              Seleccionar Organización
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto py-4 md:py-8 px-3 md:px-4 max-w-5xl pb-20 md:pb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/herramientas')}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <LockedFeatureCard
          title="Generador de Páginas Web"
          requiredPlan={requiredPlan}
          description="Genera landing pages profesionales con IA usando los datos de tu negocio"
          features={[
            'Landing page completa con Hero, Features, Testimonios',
            'Diseño 100% responsive para móvil',
            'Exportar HTML listo para publicar',
            'Colores y tipografías personalizadas'
          ]}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 md:py-8 px-3 md:px-4 max-w-5xl pb-20 md:pb-8">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/herramientas')}
          className="mb-3 md:mb-4 gap-2 h-8 md:h-9 text-xs md:text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden md:inline">Volver a Herramientas</span>
          <span className="md:hidden">Volver</span>
        </Button>
        
        <div className="flex items-center gap-2 md:gap-3 mb-2">
          <div className="p-1.5 md:p-2 rounded-lg bg-primary/10">
            <Globe className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold">Generador de Páginas Web</h1>
            <p className="text-xs md:text-sm text-muted-foreground truncate">
              {organizationName ? `Landing Page para ${organizationName}` : 'Crea tu página web con IA'}
            </p>
          </div>
        </div>
      </div>

      {/* Feature highlights */}
      <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            ¿Qué incluye el Generador Web?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Layout className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Landing Page</p>
                <p className="text-muted-foreground text-xs">Hero, features, CTA</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Palette className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Diseño Personalizado</p>
                <p className="text-muted-foreground text-xs">Colores y tipografías</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Smartphone className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="font-medium">100% Responsive</p>
                <p className="text-muted-foreground text-xs">Móvil optimizado</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Code className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Export HTML</p>
                <p className="text-muted-foreground text-xs">Listo para publicar</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Tu Landing Page</span>
            <div className="flex gap-2">
              {hasContent && (
                <Button variant="outline" size="sm" onClick={handleDownloadHTML}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar HTML
                </Button>
              )}
              {isAdmin && (
                <Button 
                  onClick={generateContent}
                  disabled={generating}
                  size="sm"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      {hasContent ? 'Regenerar' : 'Generar con IA'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardTitle>
          <CardDescription>
            Genera una landing page profesional basada en los datos de tu onboarding
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : hasContent ? (
            <div className="space-y-6">
              {/* Preview */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted p-2 flex items-center gap-2 border-b">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-destructive/50" />
                    <div className="w-3 h-3 rounded-full bg-warning/50" />
                    <div className="w-3 h-3 rounded-full bg-success/50" />
                  </div>
                  <span className="text-xs text-muted-foreground flex-1 text-center">
                    {organizationName?.toLowerCase().replace(/\s+/g, '-')}.com
                  </span>
                </div>
                <div className="aspect-video overflow-y-auto max-h-[500px]">
                  <iframe
                    srcDoc={generateHTMLFromContent(content)}
                    className="w-full h-full min-h-[800px]"
                    title="Web Preview"
                  />
                </div>
              </div>

              {/* Content Summary */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Hero Section</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">{content.hero?.headline}</p>
                    <p className="text-xs mt-1">{content.hero?.subheadline?.substring(0, 80)}...</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Features</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p>{content.features?.items?.length || 0} características incluidas</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Diseño</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-1">
                      <div 
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: content.design?.primary_color }}
                      />
                      <div 
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: content.design?.secondary_color }}
                      />
                      <div 
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: content.design?.accent_color }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay página generada</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Genera una landing page profesional basada en los datos de tu negocio
              </p>
              {isAdmin ? (
                <Button onClick={generateContent} disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generar Landing Page
                    </>
                  )}
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Solo el administrador puede generar la página web
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface WebGeneratorContent {
  meta?: {
    title?: string;
    description?: string;
  };
  design?: {
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
    font_heading?: string;
    font_body?: string;
  };
  hero?: {
    headline?: string;
    subheadline?: string;
    cta_text?: string;
    cta_url?: string;
  };
  features?: {
    title?: string;
    items?: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
  };
  benefits?: {
    title?: string;
    items?: Array<{
      title: string;
      description: string;
    }>;
  };
  testimonials?: {
    title?: string;
    items?: Array<{
      quote: string;
      author: string;
      role: string;
    }>;
  };
  cta?: {
    headline?: string;
    subheadline?: string;
    button_text?: string;
    button_url?: string;
  };
  footer?: {
    tagline?: string;
  };
}

export default WebGeneratorPage;
