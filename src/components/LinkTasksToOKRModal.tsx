import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Link as LinkIcon, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface Task {
  id: string;
  title: string;
  description: string;
  area: string;
  phase: number;
  isLinked: boolean;
}

interface LinkTasksToOKRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  keyResultId: string;
  keyResultTitle: string;
  objectivePhase: number;
}

const LinkTasksToOKRModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  keyResultId, 
  keyResultTitle,
  objectivePhase 
}: LinkTasksToOKRModalProps) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchTasks();
    }
  }, [isOpen, keyResultId, objectivePhase]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      // Obtener tareas del usuario en la fase del objetivo
      const { data: userTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user?.id)
        .eq('phase', objectivePhase)
        .order('title');

      if (tasksError) throw tasksError;

      // Obtener tareas ya vinculadas a este KR
      const { data: linkedTasks, error: linksError } = await supabase
        .from('okr_task_links')
        .select('task_id')
        .eq('key_result_id', keyResultId);

      if (linksError) throw linksError;

      const linkedTaskIds = new Set((linkedTasks || []).map(lt => lt.task_id));
      
      const tasksWithLinkStatus = (userTasks || []).map(task => ({
        ...task,
        isLinked: linkedTaskIds.has(task.id)
      }));

      setTasks(tasksWithLinkStatus);
      
      // Pre-seleccionar tareas ya vinculadas
      setSelectedTasks(linkedTaskIds);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Error al cargar tareas');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Obtener vínculos actuales
      const { data: currentLinks } = await supabase
        .from('okr_task_links')
        .select('task_id')
        .eq('key_result_id', keyResultId);

      const currentTaskIds = new Set((currentLinks || []).map(l => l.task_id));
      
      // Determinar qué agregar y qué eliminar
      const toAdd = Array.from(selectedTasks).filter(id => !currentTaskIds.has(id));
      const toRemove = Array.from(currentTaskIds).filter(id => !selectedTasks.has(id));

      // Eliminar vínculos
      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('okr_task_links')
          .delete()
          .eq('key_result_id', keyResultId)
          .in('task_id', toRemove);

        if (deleteError) throw deleteError;
      }

      // Agregar nuevos vínculos
      if (toAdd.length > 0) {
        const linksToInsert = toAdd.map(taskId => ({
          key_result_id: keyResultId,
          task_id: taskId,
          contribution_weight: 1.0
        }));

        const { error: insertError } = await supabase
          .from('okr_task_links')
          .insert(linksToInsert);

        if (insertError) throw insertError;
      }

      toast.success(`${toAdd.length} tareas vinculadas, ${toRemove.length} desvinculadas`);
      onSuccess();
    } catch (error) {
      console.error('Error saving task links:', error);
      toast.error('Error al guardar vínculos');
    } finally {
      setSaving(false);
    }
  };

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.area?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            Vincular Tareas al Key Result
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <p className="font-medium">{keyResultTitle}</p>
            <p className="text-xs bg-primary/10 text-primary p-2 rounded-md">
              💡 El progreso se actualizará automáticamente cuando las tareas vinculadas sean completadas y validadas por el líder
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar tareas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando tareas...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No se encontraron tareas' : `No hay tareas disponibles en Fase ${objectivePhase}`}
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${
                    selectedTasks.has(task.id) ? 'bg-muted/50 border-primary' : ''
                  }`}
                  onClick={() => handleToggleTask(task.id)}
                >
                  <Checkbox
                    checked={selectedTasks.has(task.id)}
                    onCheckedChange={() => handleToggleTask(task.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{task.title}</h4>
                      {task.isLinked && (
                        <span className="text-xs text-muted-foreground">(vinculada)</span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    {task.area && (
                      <span className="text-xs text-primary mt-1 inline-block">
                        {task.area}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedTasks.size} tarea{selectedTasks.size !== 1 ? 's' : ''} seleccionada{selectedTasks.size !== 1 ? 's' : ''}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar Vínculos'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LinkTasksToOKRModal;
