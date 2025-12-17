import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Users, User, Info, ArrowLeftRight, Shield, Lightbulb,
  HelpCircle, CheckCircle2, AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface WorkPreferencesModalProps {
  onPreferencesChange?: () => void;
}

export function WorkPreferencesModal({ onPreferencesChange }: WorkPreferencesModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [hasTeam, setHasTeam] = useState(false);
  const [collaborativePercentage, setCollaborativePercentage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadPreferences();
    }
  }, [user?.id]);

  const loadPreferences = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('user_global_agenda_settings')
        .select('has_team, collaborative_percentage')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setHasTeam(data.has_team ?? false);
        setCollaborativePercentage(data.collaborative_percentage ?? 0);
      }
    } catch (error) {
      console.error('Error loading work preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_global_agenda_settings')
        .upsert({
          user_id: user.id,
          has_team: hasTeam,
          collaborative_percentage: hasTeam ? collaborativePercentage : 0,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast.success('Preferencias guardadas', {
        description: hasTeam 
          ? `${collaborativePercentage}% colaborativas, ${100 - collaborativePercentage}% individuales`
          : 'Modo individual activado'
      });
      
      onPreferencesChange?.();
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Error al guardar preferencias');
    } finally {
      setSaving(false);
    }
  };

  const handleTeamToggle = (value: boolean) => {
    setHasTeam(value);
    if (!value) {
      setCollaborativePercentage(0);
    } else {
      setCollaborativePercentage(70); // Default 70% colaborativas
    }
  };

  const individualPercentage = 100 - collaborativePercentage;

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-8 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base md:text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Configuración de Trabajo
        </CardTitle>
        <CardDescription>
          Personaliza cómo se distribuyen tus tareas semanales
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Team Question */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${hasTeam ? 'bg-primary/20' : 'bg-muted'}`}>
              {hasTeam ? <Users className="w-5 h-5 text-primary" /> : <User className="w-5 h-5 text-muted-foreground" />}
            </div>
            <div>
              <Label className="text-sm font-medium">¿Cuentas con un equipo?</Label>
              <p className="text-xs text-muted-foreground">
                {hasTeam 
                  ? 'Trabajas con otras personas en tu organización' 
                  : 'Trabajas de forma individual (autónomo)'}
              </p>
            </div>
          </div>
          <Switch
            checked={hasTeam}
            onCheckedChange={handleTeamToggle}
          />
        </div>

        {/* Distribution Slider (only if has team) */}
        {hasTeam && (
          <div className="space-y-4 p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Distribución de tareas</Label>
              <Badge variant="outline" className="text-xs">
                Personalizable cada semana
              </Badge>
            </div>
            
            <div className="space-y-3">
              <Slider
                value={[collaborativePercentage]}
                onValueChange={(value) => setCollaborativePercentage(value[0])}
                max={100}
                step={10}
                className="w-full"
              />
              
              <div className="flex justify-between gap-4">
                <div className="flex-1 p-3 bg-primary/10 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary">{collaborativePercentage}%</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Users className="w-3 h-3" />
                    Colaborativas
                  </div>
                </div>
                <div className="flex-1 p-3 bg-accent/10 rounded-lg text-center">
                  <div className="text-2xl font-bold text-accent-foreground">{individualPercentage}%</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <User className="w-3 h-3" />
                    Individuales
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mode indicator for solo workers */}
        {!hasTeam && (
          <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <User className="w-4 h-4 text-accent-foreground" />
              Modo Individual Activado
            </div>
            <p className="text-xs text-muted-foreground">
              Todas tus tareas serán individuales, adaptadas a tu rol y objetivos.
              La IA generará tareas específicas para tu situación como autónomo o emprendedor individual.
            </p>
          </div>
        )}

        <Separator />

        {/* Explanations Accordion */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="collaborative">
            <AccordionTrigger className="text-sm hover:no-underline">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                ¿Qué son las tareas colaborativas?
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Las <strong>tareas colaborativas</strong> tienen un <strong>líder asignado</strong> de tu equipo 
                que es experto en esa área funcional.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>El líder te guía y valida tu trabajo</li>
                <li>Aprendes de expertos en cada área</li>
                <li>Fomenta el trabajo en equipo</li>
                <li>Mejora la calidad del resultado</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="individual">
            <AccordionTrigger className="text-sm hover:no-underline">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-accent-foreground" />
                ¿Qué son las tareas individuales?
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Las <strong>tareas individuales</strong> son completamente tuyas, sin supervisión de líder.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Trabajas a tu propio ritmo</li>
                <li>Total autonomía en la ejecución</li>
                <li>Ideal para tareas de tu especialidad</li>
                <li>Se marcan completas cuando tú decides</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="leaders">
            <AccordionTrigger className="text-sm hover:no-underline">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                ¿Cómo funcionan los líderes?
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Cada área funcional (Marketing, Ventas, Operaciones, etc.) puede tener un <strong>líder experto</strong>.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Los líderes validan tareas de su área</li>
                <li>Reciben notificaciones cuando completas tareas</li>
                <li>Pueden aprobar o solicitar mejoras</li>
                <li>Contribuyen a tu puntuación y progreso</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="swaps">
            <AccordionTrigger className="text-sm hover:no-underline">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-orange-500" />
                ¿Qué son los swaps de tareas?
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Los <strong>swaps</strong> te permiten intercambiar una tarea por otra si no puedes completarla.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Limita los swaps por semana según tu modo</li>
                <li>Debes indicar el motivo del cambio</li>
                <li>La IA te sugiere alternativas equivalentes</li>
                <li>Mantiene el equilibrio de tu carga de trabajo</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Save Button */}
        <Button
          onClick={savePreferences}
          disabled={saving}
          className="w-full bg-gradient-primary"
        >
          {saving ? 'Guardando...' : 'Guardar Preferencias'}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          <Info className="w-3 h-3 inline mr-1" />
          Puedes cambiar estas preferencias en cualquier momento
        </p>
      </CardContent>
    </Card>
  );
}
