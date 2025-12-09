import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, ExternalLink, Mail, Phone, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Submission {
  id: string;
  created_at: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  industry: string;
  company_size: string;
  status: string;
  ai_prompt_generated: string | null;
  business_description: string;
  main_objectives: string;
}

const AdminOnboardings = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('onboarding_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error: unknown) {
      console.error('Error fetching submissions:', error);
      toast.error("Error al cargar submissions");
    } finally {
      setLoading(false);
    }
  };

  const copyPromptToClipboard = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    toast.success("Mega-prompt copiado al portapapeles");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'processing':
        return 'En Proceso';
      case 'completed':
        return 'Completado';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Cargando submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 md:p-6 pb-24 md:pb-6">
      <div className="mb-4 md:mb-8">
        <h1 className="text-xl md:text-3xl font-bold mb-1 md:mb-2">Onboardings Recibidos</h1>
        <p className="text-xs md:text-base text-muted-foreground">
          {submissions.length} cliente(s) han completado el onboarding
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        {submissions.map((submission) => (
          <Card key={submission.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{submission.company_name}</h3>
                  <p className="text-sm text-muted-foreground">{submission.industry}</p>
                </div>
                <Badge className={getStatusColor(submission.status)}>
                  {getStatusLabel(submission.status)}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{submission.contact_email}</span>
                </div>
                {submission.contact_phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{submission.contact_phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {formatDistanceToNow(new Date(submission.created_at), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setSelectedSubmission(submission)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{submission.company_name}</DialogTitle>
                      <DialogDescription>
                        Contacto: {submission.contact_name} ({submission.contact_email})
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 mt-4">
                      <div>
                        <h4 className="font-semibold mb-2">Descripción del Negocio</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {submission.business_description.substring(0, 500)}...
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Objetivos Principales</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {submission.main_objectives}
                        </p>
                      </div>

                      {submission.ai_prompt_generated && (
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold">Mega-Prompt Generado</h4>
                            <Button
                              size="sm"
                              onClick={() => copyPromptToClipboard(submission.ai_prompt_generated!)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copiar
                            </Button>
                          </div>
                          <div className="bg-muted p-4 rounded-lg max-h-[300px] overflow-y-auto">
                            <pre className="text-xs whitespace-pre-wrap font-mono">
                              {submission.ai_prompt_generated}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                {submission.ai_prompt_generated && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => copyPromptToClipboard(submission.ai_prompt_generated!)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {submissions.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground text-lg">
            No hay submissions todavía. Comparte el link del onboarding con clientes potenciales.
          </p>
        </Card>
      )}
    </div>
  );
};

export default AdminOnboardings;