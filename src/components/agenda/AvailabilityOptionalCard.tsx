import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar, ChevronDown, ChevronUp, Clock, Users } from 'lucide-react';
import AvailabilityQuestionnaire from '@/components/AvailabilityQuestionnaire';

interface AvailabilityOptionalCardProps {
  userId: string;
  weekStart: string;
  onComplete: () => void;
}

export function AvailabilityOptionalCard({ userId, weekStart, onComplete }: AvailabilityOptionalCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  if (showQuestionnaire) {
    return (
      <Card>
        <CardContent className="p-6">
          <Button 
            variant="ghost" 
            onClick={() => setShowQuestionnaire(false)}
            className="mb-4"
          >
            ← Volver
          </Button>
          <AvailabilityQuestionnaire
            userId={userId}
            weekStart={weekStart}
            onComplete={() => {
              setShowQuestionnaire(false);
              onComplete();
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed border-primary/30 bg-primary/5">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardContent className="p-4 cursor-pointer hover:bg-primary/10 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    💡 Optimiza tu agenda con disponibilidad (Opcional)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Indica tus horarios para mejor coordinación con el equipo
                  </p>
                </div>
              </div>
              {isOpen ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </CardContent>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-foreground">¿Por qué rellenar disponibilidad?</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <Users className="w-4 h-4 mt-0.5 text-primary" />
                  <span>La IA coordinará mejor las tareas colaborativas con tu equipo</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="w-4 h-4 mt-0.5 text-primary" />
                  <span>Tus tareas se programarán en tus horarios preferidos</span>
                </li>
                <li className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 mt-0.5 text-primary" />
                  <span>Evitarás conflictos de horarios con otros miembros</span>
                </li>
              </ul>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={() => setShowQuestionnaire(true)}
                className="flex-1"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Configurar Disponibilidad
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setIsOpen(false)}
              >
                Ahora no
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
