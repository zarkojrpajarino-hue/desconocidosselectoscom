import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, FileText } from "lucide-react";

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
  const [newValue, setNewValue] = useState(currentValue.toString());
  const [comment, setComment] = useState('');
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
      const parsedNewValue = parseFloat(newValue);
      
      if (isNaN(parsedNewValue)) {
        toast.error('Por favor ingresa un valor numérico válido');
        return;
      }

      if (!comment.trim() && files.length === 0) {
        toast.error('Debes agregar un comentario o una evidencia para actualizar el progreso');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('No estás autenticado');
        return;
      }

      // 1. Insertar el update en okr_updates
      const { data: updateData, error: updateError } = await supabase
        .from('okr_updates')
        .insert({
          key_result_id: keyResultId,
          previous_value: currentValue,
          new_value: parsedNewValue,
          comment: comment.trim() || null,
          updated_by: user.id
        })
        .select()
        .single();

      if (updateError) throw updateError;

      // 2. Subir archivos si hay
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

      // 3. Actualizar el current_value del key result
      const { error: krError } = await supabase
        .from('key_results')
        .update({ current_value: parsedNewValue })
        .eq('id', keyResultId);

      if (krError) throw krError;

      toast.success('Progreso actualizado exitosamente');
      onProgressUpdated();
      onClose();
      
      // Resetear form
      setNewValue(currentValue.toString());
      setComment('');
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Actualizar Progreso</DialogTitle>
          <DialogDescription>{keyResultTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
          </div>

          {/* Nuevo valor */}
          <div className="space-y-2">
            <Label htmlFor="newValue">Nuevo Valor *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="newValue"
                type="number"
                step="0.01"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Ingresa el nuevo valor"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">{unit}</span>
            </div>
          </div>

          {/* Comentario */}
          <div className="space-y-2">
            <Label htmlFor="comment">Comentario {files.length === 0 && '*'}</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Explica el progreso alcanzado, desafíos encontrados, o próximos pasos..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {files.length === 0 ? 'El comentario es obligatorio si no subes evidencias' : 'Opcional si subes evidencias'}
            </p>
          </div>

          {/* Evidencias */}
          <div className="space-y-2">
            <Label>Evidencias {comment.trim() === '' && '*'}</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  Sube capturas de pantalla, documentos o archivos que demuestren tu progreso
                </p>
                <Input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="cursor-pointer"
                  accept="image/*,.pdf,.doc,.docx"
                />
              </div>

              {/* Lista de archivos */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium">Archivos seleccionados:</p>
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
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
              {comment.trim() === '' ? 'Debes subir al menos una evidencia si no agregas comentario' : 'Opcional si agregas comentario'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Actualizando...' : 'Actualizar Progreso'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
