import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Settings, ChevronDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { WorkPreferencesModal } from './WorkPreferencesModal';

interface WorkPreferencesCollapsibleProps {
  onPreferencesChange?: () => void;
}

export function WorkPreferencesCollapsible({ onPreferencesChange }: WorkPreferencesCollapsibleProps) {
  const { currentOrganizationId } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentOrganizationId) {
      checkConfiguration();
    }
  }, [currentOrganizationId]);

  const checkConfiguration = async () => {
    if (!currentOrganizationId) return;
    
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('has_team, week_start_day')
        .eq('id', currentOrganizationId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orgData = data as any;
      // Consider configured if has_team AND week_start_day have been set
      const hasTeamConfigured = orgData?.has_team !== null && orgData?.has_team !== undefined;
      const weekStartConfigured = orgData?.week_start_day !== null && orgData?.week_start_day !== undefined;
      
      setIsConfigured(hasTeamConfigured && weekStartConfigured);
    } catch (error) {
      console.error('Error checking work preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesChange = () => {
    setIsConfigured(true);
    onPreferencesChange?.();
  };

  if (loading) {
    return (
      <div className="w-full h-16 bg-muted/50 animate-pulse rounded-lg" />
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button 
          variant="outline" 
          className={`w-full justify-between h-auto py-4 px-4 ${
            !isConfigured 
              ? 'bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30 hover:bg-orange-500/15' 
              : 'bg-gradient-to-r from-green-500/5 to-emerald-500/5 border-green-500/20 hover:bg-green-500/10'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              !isConfigured 
                ? 'bg-gradient-to-br from-orange-500 to-red-500' 
                : 'bg-gradient-to-br from-green-500 to-emerald-500'
            }`}>
              {!isConfigured ? (
                <AlertTriangle className="h-5 w-5 text-white" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-white" />
              )}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Configuración de Trabajo</span>
                {!isConfigured && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                    OBLIGATORIO
                  </Badge>
                )}
                {isConfigured && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-500/20 text-green-700">
                    Configurado
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {!isConfigured 
                  ? 'El admin debe configurar día de inicio y tipo de equipo' 
                  : 'Día de inicio de semana y distribución de tareas'}
              </span>
            </div>
          </div>
          <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <WorkPreferencesModal onPreferencesChange={handlePreferencesChange} />
      </CollapsibleContent>
    </Collapsible>
  );
}