import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  related_type?: string;
  related_id?: string;
  read: boolean;
  created_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadMatchNotifications();
    }
  }, [user]);

  const loadMatchNotifications = async () => {
    try {
      setLoading(true);
      
      // Récupérer toutes les correspondances récentes via la vue détaillée
      const { data: allMatches, error } = await supabase
        .from('parcel_matches_detailed')
        .select('*')
        .or(`parcel_user_id.eq.${user!.id},trip_user_id.eq.${user!.id}`)
        .eq('status', 'pending')
        .gte('match_score', 50)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        // Ne pas logger les erreurs 400 (bad request) - souvent dues à des paramètres invalides
        if (error.code !== 'PGRST116' && error.status !== 400) {
          console.error('Error loading match notifications:', error);
        }
        return;
      }

      const allNotifications: Notification[] = [];

      // Convertir les correspondances en notifications
      if (allMatches) {
        allMatches.forEach((match: any) => {
          const isParcelOwner = match.parcel_user_id === user!.id;
          
          if (isParcelOwner) {
            // Notification pour le propriétaire du colis
            allNotifications.push({
              id: match.id,
              type: 'match',
              title: 'Nouveau trajet disponible',
              message: `Un trajet ${match.trip_from_city} → ${match.trip_to_city} correspond à votre colis (${match.match_score}%)`,
              related_type: 'trip',
              related_id: match.trip_id,
              read: false,
              created_at: match.created_at,
            });
          } else {
            // Notification pour le propriétaire du trajet
            allNotifications.push({
              id: match.id,
              type: 'match',
              title: 'Nouveau colis disponible',
              message: `Un colis ${match.parcel_from_city} → ${match.parcel_to_city} (${match.weight_kg}kg) correspond à votre trajet (${match.match_score}%)`,
              related_type: 'parcel',
              related_id: match.parcel_id,
              read: false,
              created_at: match.created_at,
            });
          }
        });
      }

      // Trier par date
      allNotifications.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifications(allNotifications);
      setUnreadCount(allNotifications.length);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    // Marquer la correspondance comme vue (acceptée ou rejetée)
    setNotifications(prev =>
      prev.filter(n => n.id !== notificationId)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications: loadMatchNotifications,
  };
};
