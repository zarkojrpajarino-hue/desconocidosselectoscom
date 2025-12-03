import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Plus, Trash2, Flag, Target } from 'lucide-react';
import { Step8Props, Milestone } from '@/types/startup-onboarding';

export default function StartupStep8Timeline({ data, updateData }: Step8Props) {
  const [newMilestone, setNewMilestone] = useState<Milestone>({
    milestone: '', deadline: '', successMetric: ''
  });

  const addMilestone = () => {
    if (newMilestone.milestone.trim() && newMilestone.deadline.trim()) {
      updateData({ milestones: [...data.milestones, { ...newMilestone }] });
      setNewMilestone({ milestone: '', deadline: '', successMetric: '' });
    }
  };

  const removeMilestone = (index: number) => {
    updateData({ milestones: data.milestones.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2 pb-6 border-b">
        <Calendar className="w-12 h-12 text-primary mx-auto" />
        <h2 className="text-2xl font-bold">Timeline y Objetivos</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Define tus hitos clave y hacia dónde quieres llegar
        </p>
      </div>

      {/* Milestones */}
      <Card className="border-2 border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5" />
            Hitos Clave
          </CardTitle>
          <CardDescription>
            Define los momentos críticos de tu journey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.milestones.length > 0 && (
            <div className="space-y-3">
              {data.milestones.map((milestone, index) => (
                <Card key={index} className="bg-muted/30">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                            {index + 1}
                          </span>
                          <h4 className="font-semibold">{milestone.milestone}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground ml-10">
                          📅 {milestone.deadline}
                        </p>
                        {milestone.successMetric && (
                          <p className="text-sm text-muted-foreground ml-10">
                            🎯 {milestone.successMetric}
                          </p>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeMilestone(index)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="space-y-3 p-4 border-2 border-dashed rounded-lg">
            <Label className="font-semibold">➕ Agregar Hito</Label>
            <Input placeholder="Ej: Lanzar MVP beta" value={newMilestone.milestone}
              onChange={(e) => setNewMilestone({ ...newMilestone, milestone: e.target.value })} />
            <Input type="date" value={newMilestone.deadline}
              onChange={(e) => setNewMilestone({ ...newMilestone, deadline: e.target.value })} />
            <Input placeholder="Métrica de éxito (Ej: 50 usuarios beta activos)"
              value={newMilestone.successMetric}
              onChange={(e) => setNewMilestone({ ...newMilestone, successMetric: e.target.value })} />
            <Button onClick={addMilestone} className="w-full"
              disabled={!newMilestone.milestone.trim() || !newMilestone.deadline.trim()}>
              <Plus className="w-4 h-4 mr-2" />Agregar Hito
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Goals by timeframe */}
      <Card className="border-2 border-green-300 dark:border-green-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Objetivos por Plazo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-base font-semibold flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">3</span>
              Objetivo a 3 meses
            </Label>
            <Textarea
              placeholder="Ej: MVP lanzado con 3 features core, 50 usuarios beta, primeras 10 entrevistas de validación completadas, estructura de costos validada"
              value={data.threeMonthGoal}
              onChange={(e) => updateData({ threeMonthGoal: e.target.value })}
              rows={3} />
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs">6</span>
              Objetivo a 6 meses
            </Label>
            <Textarea
              placeholder="Ej: Product-market fit validado, 200 usuarios activos, 30 clientes de pago, €5K MRR, primera contratación (developer)"
              value={data.sixMonthGoal}
              onChange={(e) => updateData({ sixMonthGoal: e.target.value })}
              rows={3} />
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">12</span>
              Objetivo a 12 meses
            </Label>
            <Textarea
              placeholder="Ej: €40K MRR, 500 clientes de pago, equipo de 5 personas, pre-seed cerrado de €500K, expansión a segundo mercado iniciada"
              value={data.twelveMonthGoal}
              onChange={(e) => updateData({ twelveMonthGoal: e.target.value })}
              rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* Exit Strategy */}
      <Card>
        <CardHeader>
          <CardTitle>Estrategia de Salida (Largo Plazo)</CardTitle>
          <CardDescription>
            ¿Cuál es tu visión a largo plazo? (No tiene que ser venta, puede ser lifestyle business)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Ej: Construir una empresa rentable y sostenible (lifestyle business) que genere €1M/año sin necesidad de inversión externa. O: Crecer rápido con VC para ser adquiridos por un player grande del sector en 5-7 años. O: IPO en 10 años como líder del mercado."
            value={data.exitStrategy}
            onChange={(e) => updateData({ exitStrategy: e.target.value })}
            rows={4} />
        </CardContent>
      </Card>

      {/* Summary Card */}
      {data.milestones.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/30">
          <CardHeader>
            <CardTitle>📍 Tu Roadmap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-primary/30" />
              <div className="space-y-4">
                {data.milestones
                  .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
                  .map((milestone, index) => (
                    <div key={index} className="flex items-start gap-4 ml-1">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold z-10">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{milestone.milestone}</p>
                        <p className="text-sm text-muted-foreground">{milestone.deadline}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">🎯 Tips para este paso:</h4>
        <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1 list-disc list-inside">
          <li>Define 5-8 hitos máximo para el primer año</li>
          <li>Cada hito debe tener una métrica de éxito clara</li>
          <li>Sé ambicioso pero realista - mejor cumplir que frustrarte</li>
          <li>Revisa y ajusta tu timeline cada mes</li>
        </ul>
      </div>

      <div className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-lg">
        <h3 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">
          🎉 ¡Ya casi terminas!
        </h3>
        <p className="text-green-700 dark:text-green-300">
          Has completado el onboarding. Al hacer clic en "Finalizar", generaremos tu workspace personalizado con tareas, herramientas y métricas adaptadas a tu startup.
        </p>
      </div>
    </div>
  );
}
