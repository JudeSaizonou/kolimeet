import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchThreads = async () => {
      try {
        console.log('[useThreads] 🔄 Fetching threads for user:', user.id);
        
        // Fetch threads
        const { data, error } = await supabase
          .from("threads")
          .select("*")
          .or(`created_by.eq.${user.id},other_user_id.eq.${user.id}`)
          .order("last_message_at", { ascending: false });

        if (error) throw error;

        // Get all thread IDs and user IDs for batch queries
        const threadIds = (data || []).map(t => t.id);
        const userIds = new Set<string>();
        (data || []).forEach(t => {
          userIds.add(t.created_by);
          userIds.add(t.other_user_id);
        });
        
        if (threadIds.length === 0) {
          setThreads([]);
          return;
        }

        // Batch fetch profiles
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", Array.from(userIds));

        const profileMap = new Map(
          (profiles || []).map(p => [p.user_id, p])
        );

        // Batch fetch last messages
        const { data: lastMessages } = await supabase
          .from("messages")
          .select("thread_id, content, sender_id, created_at")
          .in("thread_id", threadIds)
          .order("created_at", { ascending: false });

        // Batch fetch unread counts
        const unreadCounts = await Promise.all(
          threadIds.map(async (threadId) => {
            const { count } = await supabase
              .from("messages")
              .select("*", { count: "exact", head: true })
              .eq("thread_id", threadId)
              .is("read_at", null)
              .neq("sender_id", user.id);
            return { thread_id: threadId, count: count || 0 };
          })
        );

        // Process threads
        const processedThreads = (data || []).map((thread: any) => {
          const isCreator = thread.created_by === user.id;
          const otherUserId = isCreator ? thread.other_user_id : thread.created_by;
          const otherUserProfile = profileMap.get(otherUserId);

          // Get last message for this thread
          const threadLastMessages = (lastMessages || [])
            .filter((m: any) => m.thread_id === thread.id);
          const lastMessage = threadLastMessages[0];

          // Get unread count
          const unreadData = unreadCounts.find((u: any) => u.thread_id === thread.id);

          return {
            id: thread.id,
            created_by: thread.created_by,
            other_user_id: thread.other_user_id,
            related_type: thread.related_type,
            related_id: thread.related_id,
            last_message_at: thread.last_message_at,
            other_user: otherUserProfile || undefined,
            last_message: lastMessage || undefined,
            unread_count: unreadData?.count || 0,
          };
        });

        console.log('[useThreads] ✅ Processed threads:', processedThreads.map(t => ({ id: t.id, unread: t.unread_count })));
        setThreads(processedThreads);
      } catch (error) {
        console.error("Error fetching threads:", error);
      } finally {
        setLoading(false);
      }
    };

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
