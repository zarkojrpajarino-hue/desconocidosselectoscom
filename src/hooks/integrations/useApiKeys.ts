/**
 * @fileoverview useApiKeys - Hook para gestión de API Keys
 * 
 * Proporciona funcionalidades CRUD para las API keys de la organización,
 * incluyendo creación con hash seguro, activación/desactivación y eliminación.
 * 
 * @module hooks/integrations/useApiKeys
 * 
 * @example
 * ```tsx
 * const { apiKeys, createApiKey, deleteApiKey, loading } = useApiKeys(organizationId);
 * 
 * // Crear nueva API Key
 * const key = await createApiKey('Mi integración');
 * 
 * // Eliminar API Key
 * await deleteApiKey(keyId);
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ApiKey } from '@/types/integrations';

export function useApiKeys(organizationId: string | null) {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showNewKey, setShowNewKey] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const loadApiKeys = useCallback(async () => {
    if (!organizationId) return;
    
    try {
      const { data } = await supabase
        .from('api_keys')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      setApiKeys((data as ApiKey[]) || []);
    } catch (error) {
      toast.error('Error al cargar API keys');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (organizationId) {
      loadApiKeys();
    }
  }, [organizationId, loadApiKeys]);

  const createApiKey = async (name: string) => {
    if (!name.trim() || !organizationId) {
      toast.error('Por favor, introduce un nombre para la API Key');
      return null;
    }

    setIsCreating(true);
    try {
      // Generate random API key
      const randomBytes = new Uint8Array(32);
      crypto.getRandomValues(randomBytes);
      const apiKey = 'sk_live_' + Array.from(randomBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Hash API key for storage
      const encoder = new TextEncoder();
      const data = encoder.encode(apiKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Store in database
      const { error } = await supabase
        .from('api_keys')
        .insert({
          organization_id: organizationId,
          name,
          key_prefix: 'sk_live_',
          key_hash: keyHash,
          scopes: ['read', 'write'],
          created_by: user?.id
        });

      if (error) throw error;

      setNewKey(apiKey);
      setShowNewKey(true);
      await loadApiKeys();
      toast.success('API Key creada correctamente');
      return apiKey;

    } catch (error) {
      toast.error('Error al crear la API Key');
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  const deleteApiKey = async (id: string) => {
    if (!confirm('¿Estás seguro? Esta acción no se puede deshacer.')) return;

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Error al eliminar la API Key');
    } else {
      toast.success('API Key eliminada');
      await loadApiKeys();
    }
  };

  const dismissNewKey = () => {
    setShowNewKey(false);
    setNewKey(null);
  };

  return {
    apiKeys,
    loading,
    newKey,
    showNewKey,
    isCreating,
    createApiKey,
    deleteApiKey,
    dismissNewKey,
    refresh: loadApiKeys
  };
}
