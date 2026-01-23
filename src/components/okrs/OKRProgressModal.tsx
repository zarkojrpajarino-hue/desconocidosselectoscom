import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, FileText, AlertCircle } from "lucide-react";

interface OKRProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  keyResultId: string;
  keyResultTitle: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  onProgressUpdated: () => void;
}

export const OKRProgressModal = ({
  isOpen,
  onClose,
  keyResultId,
  keyResultTitle,
  currentValue,
  targetValue,
  unit,
  onProgressUpdated
}: OKRProgressModalProps) => {
  const [progressPercent, setProgressPercent] = useState<number[]>([
    Math.round(((currentValue - 0) / (targetValue - 0)) * 100)
  ]);
  const [achievements, setAchievements] = useState('');
  const [challenges, setChallenges] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Validar que haya al menos achievements O evidencias
      if (!achievements.trim() && files.length === 0) {
        toast.error('Debes describir tus logros o subir evidencias');
        return;
      }

      // Calcular nuevo valor basado en el porcentaje
      const newValue = (progressPercent[0] / 100) * targetValue;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('No estás autenticado');
        return;
      }

      // 1. Construir comentario completo
      const fullComment = [
        achievements.trim() && `✅ Logros: ${achievements.trim()}`,
        challenges.trim() && `⚠️ Desafíos: ${challenges.trim()}`,
        nextSteps.trim() && `➡️ Próximos pasos: ${nextSteps.trim()}`
      ].filter(Boolean).join('\n\n');

      // 2. Insertar el update en okr_updates
      const { data: updateData, error: updateError } = await supabase
        .from('okr_updates')
        .insert({
          key_result_id: keyResultId,
          previous_value: currentValue,
          new_value: newValue,
          comment: fullComment || null,
          updated_by: user.id
        })
        .select()
        .single();

      if (updateError) throw updateError;

      // 3. Subir archivos si hay
      if (files.length > 0) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('okr-evidences')
            .upload(fileName, file);

          if (uploadError) {
            console.error('Error uploading file:', uploadError);
            continue;
          }

          // Obtener URL pública
          const { data: urlData } = supabase.storage
            .from('okr-evidences')
            .getPublicUrl(fileName);

          // Guardar referencia en okr_evidences
          await supabase
            .from('okr_evidences')
            .insert({
              okr_update_id: updateData.id,
              file_url: urlData.publicUrl,
              file_name: file.name,
              file_type: file.type,
              uploaded_by: user.id
            });
        }
      }

      // 4. Actualizar el current_value del key result
      const { error: krError } = await supabase
        .from('key_results')
        .update({ current_value: newValue })
        .eq('id', keyResultId);

      if (krError) throw krError;

      toast.success('Resultados actualizados exitosamente');
      onProgressUpdated();
      onClose();
      
      // Resetear form
      setProgressPercent([Math.round(((currentValue - 0) / (targetValue - 0)) * 100)]);
      setAchievements('');
      setChallenges('');
      setNextSteps('');
      setFiles([]);
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Error al actualizar el progreso');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dejar Resultados del Key Result</DialogTitle>
          <DialogDescription>{keyResultTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Alerta informativa */}
          <div className="flex items-start gap-3 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Refleja sobre tu progreso</p>
              <p className="text-xs text-muted-foreground">
                Describe tus logros y aprendizajes, o sube evidencias que demuestren tu avance hacia este Key Result.
              </p>
            </div>
          </div>

          {/* Valor actual y objetivo */}
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Valor Actual</p>
              <p className="text-2xl font-bold">{currentValue} {unit}</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Objetivo</p>
              <p className="text-2xl font-bold">{targetValue} {unit}</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Progreso</p>
              <p className="text-2xl font-bold text-primary">{progressPercent[0]}%</p>
            </div>
          </div>

          {/* Slider de progreso */}
          <div className="space-y-3">
            <Label>Indica tu progreso general</Label>
            <div className="px-2">
              <Slider
                value={progressPercent}
                onValueChange={setProgressPercent}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Progreso: <span className="font-bold text-primary">{progressPercent[0]}%</span>
            </p>
          </div>

          {/* ¿Qué lograste? */}
          <div className="space-y-2">
            <Label htmlFor="achievements" className="flex items-center gap-2">
              ✅ ¿Qué lograste esta semana? {files.length === 0 && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="achievements"
              value={achievements}
              onChange={(e) => setAchievements(e.target.value)}
              placeholder="Describe los avances concretos que hiciste hacia este resultado clave..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {files.length === 0 ? 'Obligatorio si no subes evidencias' : 'Opcional si subes evidencias'}
            </p>
          </div>

          {/* ¿Qué desafíos enfrentaste? */}
          <div className="space-y-2">
            <Label htmlFor="challenges" className="flex items-center gap-2">
              ⚠️ ¿Qué desafíos enfrentaste? <span className="text-muted-foreground text-xs">(Opcional)</span>
            </Label>
            <Textarea
              id="challenges"
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              placeholder="Obstáculos, dificultades o aprendizajes del proceso..."
              rows={2}
            />
          </div>

          {/* ¿Cuáles son tus próximos pasos? */}
          <div className="space-y-2">
            <Label htmlFor="nextSteps" className="flex items-center gap-2">
              ➡️ ¿Cuáles son tus próximos pasos? <span className="text-muted-foreground text-xs">(Opcional)</span>
            </Label>
            <Textarea
              id="nextSteps"
              value={nextSteps}
              onChange={(e) => setNextSteps(e.target.value)}
              placeholder="Qué harás la próxima semana para seguir avanzando..."
              rows={2}
            />
          </div>

          {/* Evidencias */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              📎 Evidencias {achievements.trim() === '' && <span className="text-destructive">*</span>}
            </Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  Sube capturas, documentos o archivos que respalden tu progreso
                </p>
                <Input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="cursor-pointer"
                  accept="image/*,.pdf,.doc,.docx,.xlsx"
                />
              </div>

              {/* Lista de archivos */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium">Archivos adjuntos:</p>
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-background rounded border"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm">{file.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {achievements.trim() === '' ? 'Obligatorio si no describes logros' : 'Opcional si describes logros'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Dejar Resultados'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
