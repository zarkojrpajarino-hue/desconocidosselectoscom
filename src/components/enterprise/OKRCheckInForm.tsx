import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Target, TrendingUp, Save, CheckCircle2,
  Calendar, MessageSquare 
} from 'lucide-react';
import { toast } from 'sonner';

interface OKRCheckInFormProps {
  type?: 'organizational' | 'weekly';
}

interface KeyResult {
  id: string;
  title: string;
  current_value: number;
  target_value: number;
  objective_title: string;
  quarter: string;
  new_value?: number;
  comment?: string;
}

export function OKRCheckInForm({ type = 'organizational' }: OKRCheckInFormProps) {
  const { organizationId } = useCurrentOrganization();
  const { user } = useAuth();
  const [data, setData] = useState<KeyResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchKeyResults() {
      if (!organizationId || !user?.id) return;
      try {
        setLoading(true);

        let query = supabase
          .from('objectives')
          .select(`
            id,
            title,
            quarter,
            key_results (*)
          `)
          .eq('organization_id', organizationId)
          .eq('owner_user_id', user.id)
          .eq('status', 'active');

        if (type === 'organizational') {
          // OKRs organizacionales: sin fase
          query = query.is('phase', null);
        } else {
          // OKRs semanales: quarter empieza con "Semana"
          query = query.ilike('quarter', 'Semana%');
        }

        const { data: objectives, error: objError } = await query;

        if (objError) throw objError;

        const keyResults: KeyResult[] = [];
        (objectives || []).forEach((obj: { 
          title: string; 
          quarter: string;
          key_results?: Array<{ 
            id: string; 
            title: string; 
            current_value?: number; 
            target_value?: number 
          }> 
        }) => {
          (obj.key_results || []).forEach((kr) => {
            keyResults.push({
              id: kr.id,
              title: kr.title,
              current_value: kr.current_value || 0,
              target_value: kr.target_value || 1,
              objective_title: obj.title,
              quarter: obj.quarter,
              new_value: kr.current_value || 0,
              comment: '',
            });
          });
        });

        setData(keyResults);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    fetchKeyResults();
  }, [organizationId, user?.id, type]);

  function handleValueChange(krId: string, value: number) {
    setData(prev => prev.map(kr => 
      kr.id === krId ? { ...kr, new_value: value } : kr
    ));
  }

  function handleCommentChange(krId: string, comment: string) {
    setData(prev => prev.map(kr => 
      kr.id === krId ? { ...kr, comment } : kr
    ));
  }

  async function handleSubmit() {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      const updates = data.filter(kr => kr.new_value !== kr.current_value || kr.comment);

      for (const kr of updates) {
        // Actualizar key result
        if (kr.new_value !== kr.current_value) {
          const { error: updateError } = await supabase
            .from('key_results')
            .update({ current_value: kr.new_value })
            .eq('id', kr.id);

          if (updateError) throw updateError;
        }

        // Registrar actualización
        const { error: logError } = await supabase
          .from('okr_updates')
          .insert({
            key_result_id: kr.id,
            previous_value: kr.current_value,
            new_value: kr.new_value,
            comment: kr.comment || null,
            updated_by: user.id,
          });

        if (logError) throw logError;
      }

      toast.success(`Check-in completado: ${updates.length} KRs actualizados`);
      
      // Actualizar datos locales
      setData(prev => prev.map(kr => ({
        ...kr,
        current_value: kr.new_value || kr.current_value,
        comment: '',
      })));
    } catch (err) {
      toast.error('Error al guardar check-in');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <p className="text-destructive text-center">Error cargando Key Results</p>
        </CardContent>
      </Card>
    );
  }

  const keyResults = data || [];
  const hasChanges = keyResults.some(kr => kr.new_value !== kr.current_value || kr.comment);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">
            Check-in de OKRs {type === 'weekly' ? 'Semanales' : 'Organizacionales'}
          </h2>
          <p className="text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Actualiza el progreso de tus Key Results
          </p>
        </div>
        <Button 
          onClick={handleSubmit} 
          disabled={!hasChanges || saving}
          className="gap-2"
        >
          {saving ? (
            <>Guardando...</>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Guardar Check-in
            </>
          )}
        </Button>
      </div>

      {/* Key Results List */}
      {keyResults.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {type === 'organizational' 
                ? 'No tienes Key Results organizacionales asignados'
                : 'No tienes Key Results semanales'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {type === 'organizational' 
                ? 'Contacta a tu administrador para asignarte objetivos'
                : 'Genera tus OKRs semanales desde la página principal de OKRs'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {keyResults.map((kr) => {
            const progress = Math.min(100, Math.round(((kr.new_value || 0) / kr.target_value) * 100));
            const hasValueChange = kr.new_value !== kr.current_value;

            return (
              <Card key={kr.id} className={hasValueChange ? 'border-primary' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        {kr.objective_title}
                        {type === 'weekly' && (
                          <Badge variant="secondary" className="text-xs">
                            {kr.quarter}
                          </Badge>
                        )}
                      </p>
                      <CardTitle className="text-lg">{kr.title}</CardTitle>
                    </div>
                    <Badge variant={progress >= 100 ? 'default' : 'outline'}>
                      {progress}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <Progress value={progress} className="h-2" />

                  {/* Value Input */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Valor Anterior</label>
                      <p className="text-lg font-medium">
                        {kr.current_value.toLocaleString('es-ES')}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Nuevo Valor</label>
                      <Input
                        type="number"
                        value={kr.new_value}
                        onChange={(e) => handleValueChange(kr.id, Number(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Meta</label>
                      <p className="text-lg font-medium">
                        {kr.target_value.toLocaleString('es-ES')}
                      </p>
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="text-sm text-muted-foreground flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      Comentario (opcional)
                    </label>
                    <Textarea
                      value={kr.comment}
                      onChange={(e) => handleCommentChange(kr.id, e.target.value)}
                      placeholder="¿Qué acciones tomaste? ¿Qué obstáculos encontraste?"
                      className="mt-1"
                      rows={2}
                    />
                  </div>

                  {/* Change Indicator */}
                  {hasValueChange && (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <TrendingUp className="h-4 w-4" />
                      <span>
                        Cambio: {kr.current_value} → {kr.new_value} 
                        {kr.current_value > 0 && (
                          <> ({kr.new_value! > kr.current_value ? '+' : ''}
                          {((kr.new_value! - kr.current_value) / kr.current_value * 100).toFixed(1)}%)</>
                        )}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}