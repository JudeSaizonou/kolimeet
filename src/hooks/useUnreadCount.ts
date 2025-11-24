import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Hook pour gérer le compteur global de messages non lus
 * Se met à jour en temps réel via Supabase Realtime
 */
export const useUnreadCount = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        // Compter tous les messages non lus dans toutes les conversations de l'utilisateur
        const { count, error } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .is("read_at", null)
          .neq("sender_id", user.id);

        if (error) {
          console.error("[useUnreadCount] Error fetching unread count:", error);
          return;
        }

        console.log("[useUnreadCount] 📬 Total unread messages:", count);
        setUnreadCount(count || 0);
      } catch (error) {
        console.error("[useUnreadCount] Exception:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnreadCount();

    // S'abonner aux changements en temps réel
    const channel = supabase
      .channel("unread-count-global")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMessage = payload.new as any;
          // Si le message n'est pas de moi, incrémenter le compteur
          if (newMessage.sender_id !== user.id) {
            console.log("[useUnreadCount] 📨 New message received, incrementing count");
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const oldMessage = payload.old as any;
          const newMessage = payload.new as any;
          
          // Si le message a été marqué comme lu et ce n'était pas mon message
          if (
            oldMessage.sender_id !== user.id &&
            oldMessage.read_at === null &&
            newMessage.read_at !== null
          ) {
            console.log("[useUnreadCount] ✅ Message marked as read, decrementing count");
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe((status) => {
        console.log("[useUnreadCount] 📡 Subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { unreadCount, loading };
};
