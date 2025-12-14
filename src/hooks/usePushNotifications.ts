import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { organizationId } = useCurrentOrganization();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      throw new Error('Este navegador no soporta notificaciones');
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push notifications no soportadas');
    }

    setIsLoading(true);

    try {
      // Request permission first
      const permission = await requestPermission();
      if (permission !== 'granted') {
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // For demo purposes, we'll use a placeholder VAPID key
      // In production, this should come from environment variables
      const vapidPublicKey = 'BLBx-hf2WrL2qEa0XYsZ9E4G3UpfPBj3K4XdV-qb9yHN7zPEAljL8kVKFxjJ5QE2DLMvBhLVN3';
      
      // Convert VAPID key to Uint8Array
      const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
          .replace(/-/g, '+')
          .replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      };

      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      // Save subscription to database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const subscriptionJson = subscription.toJSON();
      
      const insertData: {
        user_id: string;
        endpoint: string;
        subscription: Record<string, unknown>;
        organization_id?: string;
      } = {
        user_id: user.id,
        endpoint: subscription.endpoint,
        subscription: subscriptionJson as unknown as Record<string, unknown>,
      };
      
      if (organizationId) {
        insertData.organization_id = organizationId;
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('push_subscriptions') as any)
        .upsert(insertData, {
          onConflict: 'endpoint',
        });

      if (error) throw error;

      setIsSubscribed(true);
      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, requestPermission]);

  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!('serviceWorker' in navigator)) return;

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove from database
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subscription.endpoint);
      }

      setIsSubscribed(false);
    } catch (error) {
      console.error('Error unsubscribing:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendTestNotification = useCallback(async (): Promise<void> => {
    if (Notification.permission !== 'granted') {
      throw new Error('Permisos de notificación no concedidos');
    }

    // Send local notification for testing
    const notification = new Notification('OPTIMUS-K', {
      body: '¡Las notificaciones están funcionando!',
      icon: '/pwa-192x192.svg',
      badge: '/pwa-192x192.svg',
      tag: 'test-notification',
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }, []);

  return {
    permission,
    isSubscribed,
    isLoading,
    isSupported: 'Notification' in window && 'serviceWorker' in navigator,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}
