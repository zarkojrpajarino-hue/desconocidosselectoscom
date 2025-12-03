import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Mail, MessageSquare, Phone, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import type { OutreachTemplate } from '@/types/ai-resources.types';

interface OutreachTemplatesDisplayProps {
  templates: OutreachTemplate[];
}

export const OutreachTemplatesDisplay = ({ templates }: OutreachTemplatesDisplayProps) => {
  const copyTemplate = (template: OutreachTemplate) => {
    let text = '';
    if (template.subject_line) {
      text += `Subject: ${template.subject_line}\n\n`;
    }
    text += template.message_body;
    
    navigator.clipboard.writeText(text);
    toast.success('Template copiado');
  };

  if (!templates?.length) {
    return <p className="text-muted-foreground">No hay templates de outreach generados.</p>;
  }
  
  const groupedByChannel = templates.reduce((acc, template) => {
    if (!acc[template.channel]) acc[template.channel] = [];
    acc[template.channel].push(template);
    return acc;
  }, {} as Record<string, OutreachTemplate[]>);
  
  const getChannelIcon = (channel: string) => {
    const icons: Record<string, React.ReactNode> = {
      'Email': <Mail className="w-4 h-4" />,
      'LinkedIn': <MessageSquare className="w-4 h-4" />,
      'Cold Call': <Phone className="w-4 h-4" />,
      'WhatsApp': <MessageSquare className="w-4 h-4" />,
    };
    return icons[channel] || <MessageSquare className="w-4 h-4" />;
  };
  
  const channels = Object.keys(groupedByChannel);
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold">📧 Templates de Outreach</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {templates.length} templates para diferentes canales
        </p>
      </div>
      
      <Tabs defaultValue={channels[0]} className="w-full">
        <TabsList className="w-full flex">
          {channels.map(channel => (
            <TabsTrigger key={channel} value={channel} className="flex-1 flex items-center gap-2">
              {getChannelIcon(channel)}
              {channel}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {channels.map(channel => (
          <TabsContent key={channel} value={channel} className="space-y-4 mt-4">
            {groupedByChannel[channel].map((template, idx) => (
              <Card key={idx} className="border-2">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getChannelIcon(template.channel)}
                        <CardTitle className="text-lg">{template.scenario}</CardTitle>
                      </div>
                      <Badge variant="secondary">{template.channel}</Badge>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => copyTemplate(template)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {template.subject_line && (
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                      <p className="text-xs font-medium text-primary mb-1">📨 SUBJECT LINE:</p>
                      <p className="font-medium">{template.subject_line}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm font-medium mb-2">💬 MENSAJE:</p>
                    <div className="bg-card border rounded-lg p-4">
                      <p className="text-sm whitespace-pre-line font-mono">{template.message_body}</p>
                    </div>
                  </div>
                  
                  {template.personalization_fields.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">🎯 Campos a personalizar:</p>
                      <div className="flex flex-wrap gap-2">
                        {template.personalization_fields.map((field, i) => (
                          <Badge key={i} variant="outline" className="font-mono">{field}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        Mejores Prácticas:
                      </p>
                    </div>
                    <ul className="space-y-2">
                      {template.best_practices.map((practice, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 mt-2 flex-shrink-0" />
                          <span>{practice}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
