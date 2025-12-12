import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useLocation } from 'react-router-dom';

// Détecter si on est sur iOS
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Détecter si on est en mode PWA (standalone)
const isPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
};

/**
 * Hook pour recevoir des notifications locales quand un nouveau message arrive
 * Utilise Supabase Realtime pour écouter les nouveaux messages
 * et affiche une notification native si l'utilisateur n'est pas dans la conversation
 */
export function useMessageNotifications() {
  const { user } = useAuth();
  const location = useLocation();
  const currentThreadRef = useRef<string | null>(null);

  // Mettre à jour le thread actuel basé sur l'URL
  useEffect(() => {
    const match = location.pathname.match(/\/messages\/([^/]+)/);
    currentThreadRef.current = match ? match[1] : null;
  }, [location.pathname]);

  useEffect(() => {
    if (!user) {
      console.log('[MessageNotifications] Pas d\'utilisateur connecté');
      return;
    }

    // Vérifier si les notifications sont supportées
    const isSupported = 'Notification' in window;
    const onIOS = isIOS();
    const inPWA = isPWA();
    
    console.log('[MessageNotifications] Configuration:', {
      isSupported,
      isIOS: onIOS,
      isPWA: inPWA,
      serviceWorker: 'serviceWorker' in navigator,
      swController: navigator.serviceWorker?.controller ? 'yes' : 'no'
    });
    
    if (!isSupported) {
      console.log('[MessageNotifications] Notifications non supportées par ce navigateur');
      return;
    }

    console.log('[MessageNotifications] Permission actuelle:', Notification.permission);
    console.log('[MessageNotifications] Démarrage de l\'écoute des messages pour', user.id);

    // Écouter tous les nouveaux messages
    const channel = supabase
      .channel(`user-messages-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          console.log('[MessageNotifications] 📨 Nouveau message reçu:', payload);
          
          const newMessage = payload.new as {
            id: string;
            thread_id: string;
            sender_id: string;
            content: string;
            created_at: string;
          };

          // Ignorer si c'est notre propre message
          if (newMessage.sender_id === user.id) {
            console.log('[MessageNotifications] Message de nous-même, ignoré');
            return;
          }

          // Vérifier si on est destinataire de ce thread
          const { data: thread, error: threadError } = await supabase
            .from('threads')
            .select('created_by, other_user_id')
            .eq('id', newMessage.thread_id)
            .single();

          if (threadError) {
            console.error('[MessageNotifications] Erreur récupération thread:', threadError);
            return;
          }

          if (!thread) {
            console.log('[MessageNotifications] Thread non trouvé');
            return;
          }

          // Vérifier si l'utilisateur fait partie de ce thread
          const isRecipient = 
            thread.created_by === user.id || 
            thread.other_user_id === user.id;

          if (!isRecipient) {
            console.log('[MessageNotifications] Pas destinataire de ce thread');
            return;
          }

          // Ne pas notifier si on est déjà dans cette conversation
          if (currentThreadRef.current === newMessage.thread_id) {
            console.log('[MessageNotifications] Déjà dans la conversation, pas de notification');
            return;
          }

          // Récupérer le nom de l'expéditeur
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', newMessage.sender_id)
            .single();

          const senderName = senderProfile?.full_name || 'Quelqu\'un';
          const messagePreview = newMessage.content.length > 50 
            ? newMessage.content.substring(0, 47) + '...'
            : newMessage.content;

          console.log('[MessageNotifications] 🔔 Affichage notification pour message de', senderName);

          // Vérifier la permission - NE PAS demander ici (doit être fait via geste utilisateur)
          if (Notification.permission !== 'granted') {
            console.log('[MessageNotifications] Permission non accordée:', Notification.permission);
            console.log('[MessageNotifications] L\'utilisateur doit activer les notifications depuis son profil');
            return;
          }

          // Afficher la notification
          try {
            // Sur iOS PWA, on doit utiliser le Service Worker
            const swReady = 'serviceWorker' in navigator;
            let notificationShown = false;
            
            if (swReady) {
              try {
                const registration = await navigator.serviceWorker.ready;
                console.log('[MessageNotifications] SW ready, showing notification via SW');
                
                await registration.showNotification(senderName, {
                  body: messagePreview,
                  icon: '/icon-192.png',
                  badge: '/icon-192.png',
                  tag: `message-${newMessage.thread_id}`,
                  data: {
                    url: `/messages/${newMessage.thread_id}`,
                    thread_id: newMessage.thread_id,
                    type: 'message'
                  },
                  vibrate: [200, 100, 200],
                  requireInteraction: false,
                } as NotificationOptions);
                
                notificationShown = true;
                console.log('[MessageNotifications] ✅ Notification affichée via SW');
              } catch (swError) {
                console.error('[MessageNotifications] Erreur SW notification:', swError);
              }
            }
            
            // Fallback: notification via l'API Notification standard (ne fonctionne pas sur iOS PWA)
            if (!notificationShown && !isIOS()) {
              console.log('[MessageNotifications] Fallback: Notification API standard');
              new Notification(senderName, {
                body: messagePreview,
                icon: '/icon-192.png',
                tag: `message-${newMessage.thread_id}`,
              });
              console.log('[MessageNotifications] ✅ Notification affichée via Notification API');
            }
          } catch (error) {
            console.error('[MessageNotifications] Erreur affichage notification:', error);
          }
        }
      )
      .subscribe((status, err) => {
        console.log('[MessageNotifications] 📡 Subscription status:', status);
        if (err) {
          console.error('[MessageNotifications] ❌ Subscription error:', err);
        }
        if (status === 'SUBSCRIBED') {
          console.log('[MessageNotifications] ✅ Connecté à Realtime, prêt à recevoir des messages');
        }
      });

    return () => {
      console.log('[MessageNotifications] Nettoyage du channel');
      supabase.removeChannel(channel);
    };
  }, [user]);
}
