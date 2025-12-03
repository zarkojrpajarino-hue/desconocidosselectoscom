import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Download } from 'lucide-react';
import { toast } from 'sonner';
import type { VideoScript } from '@/types/ai-resources.types';

interface VideoScriptsDisplayProps {
  scripts: VideoScript[];
}

export const VideoScriptsDisplay = ({ scripts }: VideoScriptsDisplayProps) => {
  const copyScript = (script: VideoScript) => {
    const text = `
📹 ${script.title}
⏱️ ${script.duration_seconds}s | 📱 ${script.platform}

🎣 HOOK (0-3s):
${script.hook}

📝 BODY:
${script.body}

🎯 CTA:
${script.cta}

💡 MENSAJES CLAVE:
${script.key_messages.map((m, i) => `${i + 1}. ${m}`).join('\n')}

🎬 VISUAL:
${script.visual_suggestions.map((v, i) => `${i + 1}. ${v}`).join('\n')}

🎵 MÚSICA: ${script.music_style}

📌 CAPTION:
${script.caption}

🏷️ HASHTAGS:
${script.hashtags.join(' ')}
    `.trim();
    
    navigator.clipboard.writeText(text);
    toast.success('Guión copiado al portapapeles');
  };
  
  const downloadAll = () => {
    const text = scripts.map((script, idx) => `
═══════════════════════════════════════
GUIÓN ${idx + 1}: ${script.title}
═══════════════════════════════════════

⏱️ Duración: ${script.duration_seconds}s
📱 Plataforma: ${script.platform}

🎣 HOOK (Primeros 3 segundos):
${script.hook}

📝 DESARROLLO:
${script.body}

🎯 CALL TO ACTION:
${script.cta}

💡 MENSAJES CLAVE:
${script.key_messages.map((m, i) => `  ${i + 1}. ${m}`).join('\n')}

🎬 SUGERENCIAS VISUALES:
${script.visual_suggestions.map((v, i) => `  ${i + 1}. ${v}`).join('\n')}

🎵 MÚSICA: ${script.music_style}

📌 CAPTION:
${script.caption}

🏷️ HASHTAGS:
${script.hashtags.join(' ')}

    `).join('\n\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guiones-video.txt';
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Guiones descargados');
  };
  
  if (!scripts?.length) {
    return <p className="text-muted-foreground">No hay guiones generados.</p>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">🎬 Guiones de Video Generados</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {scripts.length} guiones listos para grabar
          </p>
        </div>
        <Button onClick={downloadAll} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Descargar Todos
        </Button>
      </div>
      
      {scripts.map((script, idx) => (
        <Card key={idx} className="border-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg mb-2">{script.title}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{script.duration_seconds}s</Badge>
                  <Badge variant="outline">{script.platform}</Badge>
                  <Badge>{script.music_style}</Badge>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => copyScript(script)}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="bg-accent/50 border-l-4 border-accent p-4 rounded">
              <p className="text-xs font-medium text-accent-foreground mb-2">
                🎣 HOOK (Primeros 3 segundos)
              </p>
              <p className="font-medium">{script.hook}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2">📝 Desarrollo:</p>
              <p className="text-sm whitespace-pre-line">{script.body}</p>
            </div>
            
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
              <p className="text-xs font-medium text-primary mb-1">🎯 CALL TO ACTION:</p>
              <p className="text-sm font-medium">{script.cta}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2">💡 Mensajes Clave:</p>
              <ul className="list-disc list-inside space-y-1">
                {script.key_messages.map((msg, i) => (
                  <li key={i} className="text-sm text-muted-foreground">{msg}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2">🎬 Qué Mostrar Visualmente:</p>
              <ul className="list-decimal list-inside space-y-1">
                {script.visual_suggestions.map((visual, i) => (
                  <li key={i} className="text-sm text-muted-foreground">{visual}</li>
                ))}
              </ul>
            </div>
            
            <div className="border-t pt-4 space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">📌 Caption para el Post:</p>
                <p className="text-sm bg-muted p-3 rounded">{script.caption}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">🏷️ Hashtags:</p>
                <div className="flex flex-wrap gap-2">
                  {script.hashtags.map((tag, i) => (
                    <Badge key={i} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
