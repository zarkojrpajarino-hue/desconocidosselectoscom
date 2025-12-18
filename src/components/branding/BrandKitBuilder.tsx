import { useState } from 'react';
import { useBrandKit, useGenerateBrandKit, ColorPalette, BrandKitInput } from '@/hooks/useBrandKit';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, Palette, Type, MessageSquare, Download, Wand2, Trash2, Copy, Check, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DEMO_BRAND_KIT } from '@/data/demo-herramientas-data';

const TONE_OPTIONS = [
  { value: 'professional', label: 'Profesional', description: 'Serio y corporativo' },
  { value: 'casual', label: 'Casual', description: 'Amigable y relajado' },
  { value: 'technical', label: 'Técnico', description: 'Especializado y preciso' },
  { value: 'friendly', label: 'Amigable', description: 'Cálido y cercano' },
  { value: 'luxury', label: 'Lujo', description: 'Exclusivo y sofisticado' },
];

const FONT_PAIRS = [
  { heading: 'Montserrat', body: 'Open Sans', style: 'Moderna y legible' },
  { heading: 'Playfair Display', body: 'Source Sans Pro', style: 'Elegante y profesional' },
  { heading: 'Poppins', body: 'Inter', style: 'Limpia y contemporánea' },
  { heading: 'Raleway', body: 'Lato', style: 'Versátil y amigable' },
  { heading: 'Oswald', body: 'Roboto', style: 'Fuerte y técnica' },
  { heading: 'Merriweather', body: 'Nunito', style: 'Clásica y legible' },
];

const INDUSTRIES = [
  { value: 'technology', label: 'Tecnología / SaaS' },
  { value: 'ecommerce', label: 'E-commerce / Retail' },
  { value: 'food_beverage', label: 'Alimentación / Bebidas' },
  { value: 'health_fitness', label: 'Salud / Fitness' },
  { value: 'finance', label: 'Finanzas / Seguros' },
  { value: 'education', label: 'Educación' },
  { value: 'creative', label: 'Creativo / Agencia' },
  { value: 'consulting', label: 'Consultoría / B2B' },
  { value: 'real_estate', label: 'Inmobiliaria' },
  { value: 'fashion', label: 'Moda / Belleza' },
];

interface BrandKitBuilderProps {
  organizationId: string;
  businessName?: string;
  industry?: string;
}

export const BrandKitBuilder = ({ organizationId, businessName = '', industry = '' }: BrandKitBuilderProps) => {
  const { brandKit, palettes, loading, createBrandKit, updateBrandKit, deleteBrandKit, applyPalette } = useBrandKit(organizationId);
  const { generateBrandKit, generating } = useGenerateBrandKit();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('colors');
  const [selectedIndustry, setSelectedIndustry] = useState(industry || 'technology');
  const [showDemo, setShowDemo] = useState(false);
  const [formData, setFormData] = useState({
    businessName: businessName,
    targetAudience: '',
    brandPersonality: ['profesional', 'confiable'],
  });
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const filteredPalettes = palettes.filter(p => p.industry === selectedIndustry);
  
  // Use demo data or real data
  const displayKit = showDemo ? DEMO_BRAND_KIT : brandKit;

  const handleGenerateWithAI = async () => {
    if (!formData.businessName) {
      toast({
        title: 'Nombre requerido',
        description: 'Ingresa el nombre de tu negocio para generar el Brand Kit',
        variant: 'destructive',
      });
      return;
    }

    const generated = await generateBrandKit({
      industry: selectedIndustry,
      businessName: formData.businessName,
      targetAudience: formData.targetAudience,
      brandPersonality: formData.brandPersonality,
    });

    if (generated) {
      if (brandKit) {
        await updateBrandKit(generated);
      } else {
        await createBrandKit(generated);
      }
    }
  };

  const handleCopyColor = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const handleExportBrandKit = () => {
    if (!brandKit) return;

    const brandGuide = `# BRAND KIT - ${formData.businessName || 'Mi Marca'}

## 🎨 Colores

| Nombre | Hex | Uso |
|--------|-----|-----|
| Primary | ${brandKit.primary_color} | Color principal de la marca |
| Secondary | ${brandKit.secondary_color} | Color secundario/complementario |
| Accent | ${brandKit.accent_color} | CTAs y elementos destacados |
| Light | ${brandKit.neutral_light} | Fondos claros |
| Dark | ${brandKit.neutral_dark} | Textos y fondos oscuros |

## 🔤 Tipografías

- **Headings:** ${brandKit.font_heading}
- **Body:** ${brandKit.font_body}

### Google Fonts Import
\`\`\`html
<link href="https://fonts.googleapis.com/css2?family=${brandKit.font_heading.replace(/\s+/g, '+')}:wght@400;500;600;700&family=${brandKit.font_body.replace(/\s+/g, '+')}:wght@400;500;600&display=swap" rel="stylesheet">
\`\`\`

## 💬 Tono de Voz

**Tipo:** ${brandKit.tone_of_voice}

${brandKit.tone_description || ''}

## 🎯 Concepto de Logo

${brandKit.logo_concept || 'Pendiente de definir'}

## 🏷️ Personalidad de Marca

${brandKit.brand_personality?.map(p => `- ${p}`).join('\n') || '- Profesional\n- Confiable'}

---

## CSS Variables

\`\`\`css
:root {
  /* Colores */
  --color-primary: ${brandKit.primary_color};
  --color-secondary: ${brandKit.secondary_color};
  --color-accent: ${brandKit.accent_color};
  --color-light: ${brandKit.neutral_light};
  --color-dark: ${brandKit.neutral_dark};
  
  /* Tipografías */
  --font-heading: '${brandKit.font_heading}', sans-serif;
  --font-body: '${brandKit.font_body}', sans-serif;
}
\`\`\`

## Tailwind Config

\`\`\`javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '${brandKit.primary_color}',
          secondary: '${brandKit.secondary_color}',
          accent: '${brandKit.accent_color}',
        }
      },
      fontFamily: {
        heading: ['${brandKit.font_heading}', 'sans-serif'],
        body: ['${brandKit.font_body}', 'sans-serif'],
      }
    }
  }
}
\`\`\`
`;

    const blob = new Blob([brandGuide], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brand-kit-${formData.businessName?.toLowerCase().replace(/\s+/g, '-') || 'export'}.md`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Brand Kit exportado',
      description: 'Se ha descargado el archivo Markdown',
    });
  };

  const ColorSwatch = ({ color, label, onClick }: { color: string; label: string; onClick?: () => void }) => (
    <div className="space-y-2">
      <div
        className="h-20 rounded-lg border-2 border-border cursor-pointer relative group transition-transform hover:scale-105"
        style={{ backgroundColor: color }}
        onClick={onClick}
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
          {copiedColor === color ? (
            <Check className="h-5 w-5 text-white" />
          ) : (
            <Copy className="h-5 w-5 text-white" />
          )}
        </div>
      </div>
      <p className="text-xs font-medium text-center">{label}</p>
      <p className="text-xs text-muted-foreground text-center font-mono">{color}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Demo Mode Banner */}
      {showDemo && (
        <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <Eye className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-medium">
            Modo Demo - Visualizando ejemplo de Brand Kit generado con IA
          </span>
        </div>
      )}

      {/* Header con AI Generator */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Brand Kit Generator
              </CardTitle>
              <CardDescription>
                Crea tu identidad de marca en minutos con IA
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 mr-2">
                <span className="text-xs text-muted-foreground">Demo</span>
                <Switch checked={showDemo} onCheckedChange={setShowDemo} />
              </div>
              {brandKit && !showDemo && (
                <Button
                  onClick={() => deleteBrandKit()}
                  variant="outline"
                  size="sm"
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>
              )}
              <Button
                onClick={handleExportBrandKit}
                variant="outline"
                size="sm"
                disabled={!brandKit && !showDemo}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!showDemo && (
            <>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del negocio</Label>
                  <Input
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="Mi Empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Industria</Label>
                  <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((ind) => (
                        <SelectItem key={ind.value} value={ind.value}>
                          {ind.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Público objetivo</Label>
                  <Input
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    placeholder="Ej: Profesionales 25-45 años"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleGenerateWithAI}
                  disabled={generating || !formData.businessName}
                  className="gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      Generar con IA
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="colors" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Colores</span>
          </TabsTrigger>
          <TabsTrigger value="typography" className="gap-2">
            <Type className="h-4 w-4" />
            <span className="hidden sm:inline">Tipografía</span>
          </TabsTrigger>
          <TabsTrigger value="tone" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Tono</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB: Colores */}
        <TabsContent value="colors" className="space-y-6">
          {/* Paleta actual */}
          {displayKit && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {showDemo ? 'Ejemplo de Paleta de Colores' : 'Tu Paleta de Colores'}
                </CardTitle>
                <CardDescription>Haz clic en un color para copiarlo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4">
                  <ColorSwatch 
                    color={displayKit.primary_color} 
                    label="Primary" 
                    onClick={() => handleCopyColor(displayKit.primary_color)}
                  />
                  <ColorSwatch 
                    color={displayKit.secondary_color} 
                    label="Secondary" 
                    onClick={() => handleCopyColor(displayKit.secondary_color)}
                  />
                  <ColorSwatch 
                    color={displayKit.accent_color} 
                    label="Accent" 
                    onClick={() => handleCopyColor(displayKit.accent_color)}
                  />
                  <ColorSwatch 
                    color={displayKit.neutral_light} 
                    label="Light" 
                    onClick={() => handleCopyColor(displayKit.neutral_light)}
                  />
                  <ColorSwatch 
                    color={displayKit.neutral_dark} 
                    label="Dark" 
                    onClick={() => handleCopyColor(displayKit.neutral_dark)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Paletas predefinidas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Paletas para {INDUSTRIES.find(i => i.value === selectedIndustry)?.label}</CardTitle>
              <CardDescription>
                Selecciona una paleta predefinida basada en psicología del color
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredPalettes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay paletas predefinidas para esta industria
                </p>
              ) : (
                filteredPalettes.map((palette) => (
                  <div
                    key={palette.id}
                    className="border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => applyPalette(palette)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{palette.name}</h4>
                        <p className="text-sm text-muted-foreground">{palette.description}</p>
                      </div>
                      <Badge variant="outline">{palette.industry}</Badge>
                    </div>

                    <div className="flex gap-2">
                      {[
                        palette.primary_color,
                        palette.secondary_color,
                        palette.accent_color,
                        palette.neutral_light,
                        palette.neutral_dark,
                      ].map((color, idx) => (
                        <div
                          key={idx}
                          className="h-10 w-10 rounded-lg border"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>

                    <p className="text-xs text-muted-foreground italic">
                      {palette.psychology}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Tipografía */}
        <TabsContent value="typography" className="space-y-6">
          {displayKit && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {showDemo ? 'Ejemplo de Tipografía' : 'Tu Tipografía'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div 
                  className="text-4xl font-bold"
                  style={{ fontFamily: displayKit.font_heading }}
                >
                  {displayKit.font_heading}
                </div>
                <div 
                  className="text-lg"
                  style={{ fontFamily: displayKit.font_body }}
                >
                  {displayKit.font_body} - Texto de ejemplo para ver cómo se ve el cuerpo del contenido.
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pares de Fuentes</CardTitle>
              <CardDescription>Combinaciones de Google Fonts que funcionan bien juntas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {FONT_PAIRS.map((pair, idx) => (
                <div
                  key={idx}
                  className="border rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => {
                    if (brandKit) {
                      updateBrandKit({
                        font_heading: pair.heading,
                        font_body: pair.body,
                      });
                    } else {
                      createBrandKit({
                        font_heading: pair.heading,
                        font_body: pair.body,
                        primary_color: '#0066FF',
                        secondary_color: '#00D4FF',
                        accent_color: '#FF6B35',
                        tone_of_voice: 'professional',
                      });
                    }
                  }}
                >
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold">{pair.heading}</span>
                      <span className="text-sm text-muted-foreground">títulos</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-base">{pair.body}</span>
                      <span className="text-sm text-muted-foreground">contenido</span>
                    </div>
                    <p className="text-xs text-muted-foreground italic">{pair.style}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Tono de Voz */}
        <TabsContent value="tone" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tono de Voz</CardTitle>
              <CardDescription>Define cómo se comunica tu marca</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showDemo && (
                <div className="space-y-2">
                  <Label>Tipo de tono</Label>
                  <Select
                    value={brandKit?.tone_of_voice || 'professional'}
                    onValueChange={(value) => {
                      if (brandKit) {
                        updateBrandKit({ tone_of_voice: value });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tono" />
                    </SelectTrigger>
                    <SelectContent>
                      {TONE_OPTIONS.map((tone) => (
                        <SelectItem key={tone.value} value={tone.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{tone.label}</span>
                            <span className="text-xs text-muted-foreground">{tone.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {displayKit && (
                <>
                  <div className="space-y-2">
                    <Label>Tipo de tono</Label>
                    <p className="font-medium">{displayKit.tone_of_voice}</p>
                  </div>
                  {displayKit.tone_description && (
                    <div className="space-y-2">
                      <Label>Descripción del tono</Label>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-sm">{displayKit.tone_description}</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {!showDemo && brandKit && (
                <div className="space-y-2">
                  <Label>Descripción del tono</Label>
                  <Textarea
                    value={brandKit.tone_description || ''}
                    onChange={(e) => updateBrandKit({ tone_description: e.target.value })}
                    placeholder="Describe cómo debe comunicarse tu marca..."
                    rows={3}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
