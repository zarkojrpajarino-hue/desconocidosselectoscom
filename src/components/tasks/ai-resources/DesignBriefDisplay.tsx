import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Download, Palette, Type, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { DesignBrief } from '@/types/ai-resources.types';

interface DesignBriefDisplayProps {
  brief: DesignBrief;
}

export const DesignBriefDisplay = ({ brief }: DesignBriefDisplayProps) => {
  const downloadBrief = () => {
    const text = `
DESIGN BRIEF: ${brief.project_name}
═══════════════════════════════════════════

📦 ENTREGABLES:
${brief.deliverables.map((d, i) => `${i + 1}. ${d}`).join('\n')}

🎨 BRAND GUIDELINES:

Colores Principales: ${brief.brand_guidelines.primary_colors.join(', ')}
Colores Secundarios: ${brief.brand_guidelines.secondary_colors.join(', ')}
Tipografías: ${brief.brand_guidelines.fonts.join(', ')}
Tono: ${brief.brand_guidelines.tone}

📐 DIMENSIONES:
${brief.dimensions_by_platform.map(d => `${d.platform}: ${d.width}x${d.height}px`).join('\n')}

💡 REFERENCIAS:
${brief.inspiration_references.map((r, i) => `${i + 1}. ${r}`).join('\n')}

🎯 MENSAJE CLAVE:
${brief.key_message}

✅ DO's:
${brief.dos_and_donts.dos.map((d, i) => `${i + 1}. ${d}`).join('\n')}

❌ DON'Ts:
${brief.dos_and_donts.donts.map((d, i) => `${i + 1}. ${d}`).join('\n')}
    `.trim();
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `design-brief-${brief.project_name.toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Brief descargado');
  };
  
  const copyColors = () => {
    const colors = [
      ...brief.brand_guidelines.primary_colors,
      ...brief.brand_guidelines.secondary_colors
    ].join(', ');
    navigator.clipboard.writeText(colors);
    toast.success('Colores copiados');
  };

  if (!brief?.project_name) {
    return <p className="text-muted-foreground">No hay brief de diseño generado.</p>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">🎨 Brief de Diseño</h3>
          <p className="text-lg font-medium text-muted-foreground mt-1">{brief.project_name}</p>
        </div>
        <Button onClick={downloadBrief} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Descargar Brief
        </Button>
      </div>
      
      <Card className="border-2 bg-secondary/10">
        <CardContent className="pt-6">
          <p className="text-sm font-medium text-primary mb-2">🎯 MENSAJE CLAVE:</p>
          <p className="text-lg font-semibold">{brief.key_message}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📦 Entregables</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {brief.deliverables.map((deliverable, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-primary">{idx + 1}</span>
                </div>
                <span className="text-sm">{deliverable}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="w-5 h-5" />
            Brand Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Colores Principales</p>
              <Button size="sm" variant="ghost" onClick={copyColors}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-3">
              {brief.brand_guidelines.primary_colors.map((color, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <div
                    className="w-16 h-16 rounded-lg border-2 shadow-md"
                    style={{ backgroundColor: color }}
                  />
                  <p className="text-xs font-mono font-medium">{color}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium mb-3">Colores Secundarios</p>
            <div className="flex gap-3">
              {brief.brand_guidelines.secondary_colors.map((color, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <div
                    className="w-16 h-16 rounded-lg border-2 shadow-md"
                    style={{ backgroundColor: color }}
                  />
                  <p className="text-xs font-mono font-medium">{color}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Type className="w-4 h-4" />
              <p className="text-sm font-medium">Tipografías</p>
            </div>
            <div className="space-y-2">
              {brief.brand_guidelines.fonts.map((font, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm">{font}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium mb-2">Tono de Marca</p>
            <p className="text-sm bg-muted p-3 rounded">{brief.brand_guidelines.tone}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📐 Dimensiones por Plataforma</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {brief.dimensions_by_platform.map((dim, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">{dim.platform}</span>
                <Badge variant="secondary">{dim.width} × {dim.height}px</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">💡 Referencias de Inspiración</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {brief.inspiration_references.map((ref, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
                <span className="text-sm">{ref}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-5 h-5" />
              Qué SÍ Hacer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {brief.dos_and_donts.dos.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        <Card className="border-red-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-red-600 dark:text-red-400">
              <XCircle className="w-5 h-5" />
              Qué NO Hacer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {brief.dos_and_donts.donts.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
