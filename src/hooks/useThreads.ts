import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Thread {
  id: string;
  created_by: string;
  other_user_id: string;
  related_type: "trip" | "parcel";
  related_id: string;
  last_message_at: string;
  other_user?: {
    full_name: string;
    avatar_url: string;
  };
  last_message?: {
    content: string;
    sender_id: string;
  };
  unread_count?: number;
}

export const useThreads = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);
  const initialLoadDone = useRef(false);

  const fetchThreads = useCallback(async () => {
    if (!user || fetchingRef.current) return;
    
    fetchingRef.current = true;
    
    // Ne pas montrer le loading après le premier chargement
    if (!initialLoadDone.current) {
      setLoading(true);
    }
    
    try {
      console.log('[useThreads] 🔄 Fetching threads for user:', user.id);
      
      // Requête optimisée : récupérer threads avec le dernier message et count non lus en une seule fois
      const { data, error } = await supabase
        .from("threads")
        .select(`
          *,
          messages!inner(
            id,
            content,
            sender_id,
            created_at,
            read_at,
            message_type,
            reservation_request_id
          )
        `)
        .or(`created_by.eq.${user.id},other_user_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setThreads([]);
        return;
      }

      // Récupérer tous les user IDs pour batch fetch profiles
      const userIds = new Set<string>();
      data.forEach(t => {
        userIds.add(t.created_by);
        userIds.add(t.other_user_id);
      });

      // Batch fetch profiles en parallèle
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", Array.from(userIds));

      const profileMap = new Map(
        (profiles || []).map(p => [p.user_id, p])
      );

      // Récupérer les statuts des demandes de réservation (si nécessaire)
      const reservationRequestIds = data
        .flatMap(t => t.messages || [])
        .filter((m: any) => m.reservation_request_id)
        .map((m: any) => m.reservation_request_id);

      let reservationStatuses = new Map();
      if (reservationRequestIds.length > 0) {
        const { data: reservations } = await supabase
          .from("reservation_requests")
          .select("id, status")
          .in("id", [...new Set(reservationRequestIds)]);
        
        reservationStatuses = new Map(
          (reservations || []).map(r => [r.id, r.status])
        );
      }

      // Traiter les threads
      const processedThreads = data.map((thread: any) => {
        const isCreator = thread.created_by === user.id;
        const otherUserId = isCreator ? thread.other_user_id : thread.created_by;
        const otherUserProfile = profileMap.get(otherUserId);

        // Filtrer et trier les messages
        const validMessages = (thread.messages || [])
          .filter((m: any) => {
            if (m.reservation_request_id) {
              const status = reservationStatuses.get(m.reservation_request_id);
              if (status === 'cancelled') return false;
            }
            return true;
          })
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        const lastMessage = validMessages[0];

        // Compter les non lus (messages non lus par l'utilisateur actuel)
        const unreadCount = validMessages.filter((m: any) => 
          m.sender_id !== user.id && m.read_at === null
        ).length;

        return {
          id: thread.id,
          created_by: thread.created_by,
          other_user_id: thread.other_user_id,
          related_type: thread.related_type,
          related_id: thread.related_id,
          last_message_at: thread.last_message_at,
          other_user: otherUserProfile || undefined,
          last_message: lastMessage ? {
            content: lastMessage.content,
            sender_id: lastMessage.sender_id,
          } : undefined,
          unread_count: unreadCount,
        };
      });

      // Filtrer les threads sans messages
      const threadsWithMessages = processedThreads.filter(t => t.last_message !== undefined);

      console.log('[useThreads] ✅ Processed threads:', threadsWithMessages.length);
      setThreads(threadsWithMessages);
      initialLoadDone.current = true;
    } catch (error) {
      console.error("Error fetching threads:", error);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchThreads();

    // Subscribe to threads and messages for real-time updates
    const channel = supabase
      .channel(`threads-updates-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "threads",
        },
        (payload) => {
          console.log('[useThreads] 📬 Thread event:', payload.eventType, payload);
          const thread = payload.new as any;
          const oldThread = payload.old as any;
          
          // Check if this thread belongs to the user
          const belongsToUser = 
            (thread && (thread.created_by === user.id || thread.other_user_id === user.id)) ||
            (oldThread && (oldThread.created_by === user.id || oldThread.other_user_id === user.id));
          
          if (belongsToUser) {
            console.log('[useThreads] ✅ Thread belongs to user, refetching');
            fetchThreads();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const newMessage = payload.new as any;
          console.log('[useThreads] 📨 New message INSERT:', newMessage.thread_id);
          
          // Check if this message belongs to one of user's threads
          const { data: threadData } = await supabase
            .from("threads")
            .select("id, created_by, other_user_id")
            .eq("id", newMessage.thread_id)
            .single();
          
          if (threadData && (threadData.created_by === user.id || threadData.other_user_id === user.id)) {
            console.log('[useThreads] ✅ Message belongs to user thread, refetching');
            fetchThreads();
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
        async (payload) => {
          const oldMessage = payload.old as any;
          const newMessage = payload.new as any;
          
          // Only refetch if read status changed (read_at)
          if (oldMessage.read_at !== newMessage.read_at) {
            console.log('[useThreads] 📖 Message read status changed:', newMessage.thread_id);
            
            // Check if this message belongs to one of user's threads
            const { data: threadData } = await supabase
              .from("threads")
              .select("id, created_by, other_user_id")
              .eq("id", newMessage.thread_id)
              .single();
            
            if (threadData && (threadData.created_by === user.id || threadData.other_user_id === user.id)) {
              console.log('[useThreads] ✅ Read status change belongs to user thread, refetching');
              fetchThreads();
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('[useThreads] 📡 Subscription status:', status);
      });

    return () => {
      console.log('[useThreads] 🔌 Unsubscribing from channel');
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { threads, loading };
};
