import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Clé publique VAPID (à générer avec web-push)
// Tu dois générer une paire de clés VAPID et mettre la clé publique ici
// Commande: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

interface PushState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  loading: boolean;
  error: string | null;
}

// Convertir la clé VAPID base64 en Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [state, setState] = useState<PushState>({
    isSupported: false,
    isSubscribed: false,
    permission: 'default',
    loading: true,
    error: null,
  });

  // Vérifier le support et l'état actuel
  useEffect(() => {
    const checkSupport = async () => {
      // Vérifier si les notifications push sont supportées
      const isSupported = 
        'serviceWorker' in navigator && 
        'PushManager' in window && 
        'Notification' in window;

      if (!isSupported) {
        setState(prev => ({
          ...prev,
          isSupported: false,
          loading: false,
          error: 'Les notifications push ne sont pas supportées sur ce navigateur',
        }));
        return;
      }

      // Vérifier la permission actuelle
      const permission = Notification.permission;

      // Vérifier si déjà abonné
      let isSubscribed = false;
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        isSubscribed = !!subscription;
      } catch (e) {
        console.error('Erreur vérification subscription:', e);
      }

      setState({
        isSupported: true,
        isSubscribed,
        permission,
        loading: false,
        error: null,
      });
    };

    checkSupport();
  }, []);

  // S'abonner aux notifications push
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!user) {
      setState(prev => ({ ...prev, error: 'Vous devez être connecté' }));
      return false;
    }

    if (!VAPID_PUBLIC_KEY) {
      setState(prev => ({ ...prev, error: 'Configuration VAPID manquante' }));
      console.error('VITE_VAPID_PUBLIC_KEY non définie');
      return false;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Demander la permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        setState(prev => ({
          ...prev,
          permission,
          loading: false,
          error: 'Permission refusée',
        }));
        return false;
      }

      // Obtenir le service worker
      const registration = await navigator.serviceWorker.ready;

      // Créer la subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Extraire les clés
      const subscriptionJson = subscription.toJSON();
      const endpoint = subscriptionJson.endpoint!;
      const p256dh = subscriptionJson.keys!.p256dh;
      const auth = subscriptionJson.keys!.auth;

      // Sauvegarder dans Supabase
      const { error: dbError } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint,
          p256dh,
          auth,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,endpoint',
        });

      if (dbError) {
        console.error('Erreur sauvegarde subscription:', dbError);
        throw new Error('Erreur lors de la sauvegarde');
      }

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        permission: 'granted',
        loading: false,
        error: null,
      }));

      return true;
    } catch (error: any) {
      console.error('Erreur subscription push:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erreur lors de l\'abonnement',
      }));
      return false;
    }
  }, [user]);

  // Se désabonner
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Désabonner du push manager
        await subscription.unsubscribe();

        // Supprimer de la base de données
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint);
      }

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        loading: false,
        error: null,
      }));

      return true;
    } catch (error: any) {
      console.error('Erreur désabonnement:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erreur lors du désabonnement',
      }));
      return false;
    }
  }, [user]);

  // Envoyer une notification de test (via le SW)
  const sendTestNotification = useCallback(async () => {
    if (!state.isSubscribed) {
      console.warn('Non abonné aux notifications');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      registration.active?.postMessage({ type: 'TEST_NOTIFICATION' });
    } catch (error) {
      console.error('Erreur test notification:', error);
    }
  }, [state.isSubscribed]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}
