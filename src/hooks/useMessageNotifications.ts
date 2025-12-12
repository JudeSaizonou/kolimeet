import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useLocation } from 'react-router-dom';

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
    if (!user) return;

    // Vérifier si les notifications sont supportées et autorisées
    const canNotify = 
      'Notification' in window && 
      Notification.permission === 'granted';

    if (!canNotify) {
      console.log('[MessageNotifications] Notifications non disponibles ou non autorisées');
      return;
    }

    console.log('[MessageNotifications] Démarrage de l\'écoute des messages pour', user.id);

    // Écouter tous les nouveaux messages
    const channel = supabase
      .channel('message-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMessage = payload.new as {
            id: string;
            thread_id: string;
            sender_id: string;
            content: string;
            created_at: string;
          };

          // Ignorer si c'est notre propre message
          if (newMessage.sender_id === user.id) {
            return;
          }

          // Vérifier si on est destinataire de ce thread
          const { data: thread } = await supabase
            .from('threads')
            .select('created_by, other_user_id')
            .eq('id', newMessage.thread_id)
            .single();

          if (!thread) return;

          // Vérifier si l'utilisateur fait partie de ce thread
          const isRecipient = 
            thread.created_by === user.id || 
            thread.other_user_id === user.id;

          if (!isRecipient) return;

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

          console.log('[MessageNotifications] 🔔 Nouveau message de', senderName);

          // Afficher la notification via le Service Worker
          try {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(senderName, {
              body: messagePreview,
              icon: senderProfile?.avatar_url || '/icon-192.png',
              badge: '/icon-192.png',
              tag: `message-${newMessage.thread_id}`,
              data: {
                url: `/messages/${newMessage.thread_id}`,
                thread_id: newMessage.thread_id,
                type: 'message'
              },
              vibrate: [200, 100, 200],
              requireInteraction: false,
              silent: false,
            } as NotificationOptions);
          } catch (error) {
            console.error('[MessageNotifications] Erreur affichage notification:', error);
            
            // Fallback: notification via l'API Notification standard
            try {
              new Notification(senderName, {
                body: messagePreview,
                icon: '/icon-192.png',
                tag: `message-${newMessage.thread_id}`,
              });
            } catch (fallbackError) {
              console.error('[MessageNotifications] Fallback échoué:', fallbackError);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('[MessageNotifications] 📡 Subscription status:', status);
      });

    return () => {
      console.log('[MessageNotifications] Nettoyage du channel');
      supabase.removeChannel(channel);
    };
  }, [user]);
}
