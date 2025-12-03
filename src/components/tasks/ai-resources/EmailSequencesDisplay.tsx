import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Calendar, TrendingUp, MousePointer } from 'lucide-react';
import { toast } from 'sonner';
import type { EmailSequence } from '@/types/ai-resources.types';

interface EmailSequencesDisplayProps {
  sequences: EmailSequence[];
}

export const EmailSequencesDisplay = ({ sequences }: EmailSequencesDisplayProps) => {
  const copySequence = (sequence: EmailSequence) => {
    const text = `
SECUENCIA: ${sequence.sequence_name}
OBJETIVO: ${sequence.goal}

═══════════════════════════════════════

${sequence.emails.map((email, idx) => `
EMAIL ${idx + 1} (Día ${email.day})
─────────────────────────────

Subject: ${email.subject}

${email.body}

CTA: ${email.cta}
`).join('\n')}

═══════════════════════════════════════
Expected Open Rate: ${sequence.expected_open_rate}
Expected Click Rate: ${sequence.expected_click_rate}
    `.trim();
    
    navigator.clipboard.writeText(text);
    toast.success('Secuencia copiada');
  };

  if (!sequences?.length) {
    return <p className="text-muted-foreground">No hay secuencias de email generadas.</p>;
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold">📧 Secuencias de Email</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {sequences.length} secuencias automatizadas listas
        </p>
      </div>
      
      {sequences.map((sequence, seqIdx) => (
        <Card key={seqIdx} className="border-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">{sequence.sequence_name}</CardTitle>
                <p className="text-sm text-muted-foreground mb-3">{sequence.goal}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{sequence.emails.length} emails</Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Open: {sequence.expected_open_rate}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <MousePointer className="w-3 h-3" />
                    Click: {sequence.expected_click_rate}
                  </Badge>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => copySequence(sequence)}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="relative pl-8 space-y-6">
              <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-border" />
              
              {sequence.emails.map((email, emailIdx) => (
                <div key={emailIdx} className="relative">
                  <div className="absolute -left-8 top-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                    {emailIdx + 1}
                  </div>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            Día {email.day}
                            {email.day === 0 && ' (Inmediato)'}
                          </span>
                        </div>
                        <Badge variant="outline">Email {emailIdx + 1}</Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                        <p className="text-xs font-medium text-primary mb-1">📨 SUBJECT:</p>
                        <p className="font-medium">{email.subject}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs font-medium mb-2">💬 BODY:</p>
                        <div className="bg-card border rounded-lg p-4 max-h-60 overflow-y-auto">
                          <p className="text-sm whitespace-pre-line">{email.body}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between bg-muted rounded-lg p-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">🎯 CTA:</p>
                          <p className="text-sm font-medium">{email.cta}</p>
                        </div>
                        <Button size="sm" className="pointer-events-none">{email.cta}</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <Card className="bg-green-500/10 border-green-500/20">
                <CardContent className="pt-6 text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
                  <p className="text-sm text-muted-foreground mb-1">Open Rate Esperado</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {sequence.expected_open_rate}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-blue-500/10 border-blue-500/20">
                <CardContent className="pt-6 text-center">
                  <MousePointer className="w-8 h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                  <p className="text-sm text-muted-foreground mb-1">Click Rate Esperado</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {sequence.expected_click_rate}
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
