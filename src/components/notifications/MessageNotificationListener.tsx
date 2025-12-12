import { useMessageNotifications } from '@/hooks/useMessageNotifications';

/**
 * Composant invisible qui gère les notifications de messages en temps réel
 * Doit être placé dans un composant qui a accès au Router (useLocation)
 */
export function MessageNotificationListener() {
  useMessageNotifications();
  return null;
}
