import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Sparkles, Star, Clock, Wallet, TrendingUp, 
  ChevronDown, ChevronUp, ArrowRight, Loader2,
  CheckCircle, Target, Lightbulb
} from 'lucide-react';
import { ScoredIdea } from '@/types/discovery-onboarding';
import { cn } from '@/lib/utils';

const DiscoveryResults = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const profileId = searchParams.get('profile');
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [ideas, setIdeas] = useState<ScoredIdea[]>([]);
  const [expandedIdea, setExpandedIdea] = useState<string | null>(null);
  const [selectingIdea, setSelectingIdea] = useState<string | null>(null);

  useEffect(() => {
    if (profileId) {
      generateIdeas();
    }
  }, [profileId]);

  const generateIdeas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-discovery-ideas', {
        body: { profileId }
      });

      if (error) throw error;

      if (data?.ideas) {
        setIdeas(data.ideas);
        
        // Update profile with generated ideas
        await supabase
          .from('discovery_profiles')
          .update({ 
            generated_ideas: data.ideas,
            status: 'ideas_generated'
          })
          .eq('id', profileId);
      }
    } catch (error) {
      console.error('Error generating ideas:', error);
      toast.error('Error al generar ideas. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectIdea = async (idea: ScoredIdea) => {
    setSelectingIdea(idea.id);
    
    try {
      // Create organization with the selected idea
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: idea.name,
          industry: idea.category,
          company_size: '1-5',
          business_description: idea.description,
          target_customers: idea.target_audience,
          value_proposition: idea.problem_solved,
          sales_process: idea.revenue_model,
          main_objectives: `Validar y lanzar: ${idea.name}`,
          current_problems: 'Validación inicial del mercado',
          contact_name: user?.user_metadata?.full_name || '',
          contact_email: user?.email || '',
          plan: 'trial',
          subscription_status: 'trialing',
          business_type: 'discovery',
          business_stage: 'discovery',
          created_by: user?.id
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Create user role for the organization
      await supabase
        .from('user_roles')
        .insert({
          user_id: user?.id,
          organization_id: org.id,
          role: 'admin'
        });

      // Update discovery profile
      await supabase
        .from('discovery_profiles')
        .update({
          organization_id: org.id,
          selected_idea_id: idea.id,
          status: 'idea_selected',
          completed_at: new Date().toISOString()
        })
        .eq('id', profileId);

      // Register trial for discovery type
      await supabase.rpc('register_trial_email_by_type', {
        user_email: user?.email,
        onboard_type: 'discovery'
      });

      toast.success('¡Idea seleccionada! Vamos a configurar tu plan.');
      navigate('/select-plan');

    } catch (error) {
      console.error('Error selecting idea:', error);
      toast.error('Error al seleccionar la idea');
    } finally {
      setSelectingIdea(null);
    }
  };

  const getDifficultyColor = (level: number) => {
    if (level <= 2) return 'text-green-500';
    if (level <= 3) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getDifficultyLabel = (level: number) => {
    if (level <= 2) return 'Fácil';
    if (level <= 3) return 'Media';
    if (level <= 4) return 'Difícil';
    return 'Muy difícil';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <Lightbulb className="h-20 w-20 text-yellow-500 mx-auto animate-pulse" />
            <Sparkles className="h-8 w-8 text-primary absolute -top-2 -right-2 animate-bounce" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Generando tus ideas personalizadas...</h2>
            <p className="text-muted-foreground">Analizando tu perfil y encontrando las mejores oportunidades</p>
          </div>
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold">¡Hemos encontrado 3 ideas perfectas para ti!</h1>
          </div>
          <p className="text-muted-foreground">
            Basadas en tus habilidades, experiencia y preferencias
          </p>
        </div>

        {/* Ideas */}
        <div className="space-y-6">
          {ideas.map((idea, index) => (
            <Card 
              key={idea.id}
              className={cn(
                'overflow-hidden transition-all',
                index === 0 && 'border-2 border-primary shadow-lg'
              )}
            >
              {index === 0 && (
                <div className="bg-primary text-primary-foreground px-4 py-2 flex items-center gap-2">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm font-medium">Mejor match para ti</span>
                </div>
              )}
              
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{idea.name}</h3>
                    <p className="text-muted-foreground text-sm">{idea.description}</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-3xl font-bold text-primary">{idea.score}%</div>
                    <div className="text-xs text-muted-foreground">compatibilidad</div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Target className={cn('h-4 w-4', getDifficultyColor(idea.difficulty_level))} />
                    <span className="text-sm">{getDifficultyLabel(idea.difficulty_level)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">€{idea.min_capital.toLocaleString()}+</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{idea.time_to_first_revenue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{idea.min_hours_weekly}h/sem mín</span>
                  </div>
                </div>

                {/* Match Breakdown */}
                <div className="mb-4">
                  <div className="text-xs text-muted-foreground mb-2">Compatibilidad por área:</div>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(idea.matchBreakdown).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <Progress value={value} className="h-1 mb-1" />
                        <span className="text-[10px] text-muted-foreground capitalize">
                          {key.replace('Match', '')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expand/Collapse */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => setExpandedIdea(expandedIdea === idea.id ? null : idea.id)}
                >
                  {expandedIdea === idea.id ? (
                    <>Ver menos <ChevronUp className="ml-2 h-4 w-4" /></>
                  ) : (
                    <>Ver detalles <ChevronDown className="ml-2 h-4 w-4" /></>
                  )}
                </Button>

                {/* Expanded Content */}
                {expandedIdea === idea.id && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">🎯 Problema que resuelve</h4>
                      <p className="text-sm text-muted-foreground">{idea.problem_solved}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">💰 Modelo de ingresos</h4>
                      <p className="text-sm text-muted-foreground">{idea.revenue_model}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">👥 Cliente objetivo</h4>
                      <p className="text-sm text-muted-foreground">{idea.target_audience}</p>
                    </div>

                    {idea.examples.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">📚 Ejemplos reales</h4>
                        <div className="flex flex-wrap gap-2">
                          {idea.examples.map((ex, i) => (
                            <Badge key={i} variant="secondary">{ex}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {idea.first_steps.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">🚀 Primeros pasos</h4>
                        <ol className="list-decimal list-inside space-y-1">
                          {idea.first_steps.map((step, i) => (
                            <li key={i} className="text-sm text-muted-foreground">{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                )}

                {/* CTA */}
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    className="w-full gap-2"
                    size="lg"
                    onClick={() => handleSelectIdea(idea)}
                    disabled={selectingIdea !== null}
                  >
                    {selectingIdea === idea.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Configurando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Elegir esta idea
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            ¿No te convence ninguna? Puedes volver a empezar con otras respuestas.
          </p>
          <Button variant="outline" onClick={() => navigate('/onboarding?type=discovery')}>
            Volver a empezar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DiscoveryResults;
