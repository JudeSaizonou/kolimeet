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
        const { data, error } = await supabase
          .from("threads")
          .select(`
            *,
            messages!inner(content, sender_id, is_read, created_at)
          `)
          .or(`created_by.eq.${user.id},other_user_id.eq.${user.id}`)
          .order("last_message_at", { ascending: false });

        if (error) throw error;

        // Process threads to get other user info and last message
        const processedThreads = await Promise.all(
          (data || []).map(async (thread: any) => {
            const otherUserId = thread.created_by === user.id 
              ? thread.other_user_id 
              : thread.created_by;

            // Get other user profile
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, avatar_url")
              .eq("user_id", otherUserId)
              .single();

            // Get last message
            const { data: lastMessage } = await supabase
              .from("messages")
              .select("content, sender_id")
              .eq("thread_id", thread.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single();

            // Count unread messages
            const { count } = await supabase
              .from("messages")
              .select("*", { count: "exact", head: true })
              .eq("thread_id", thread.id)
              .eq("is_read", false)
              .neq("sender_id", user.id);

            return {
              id: thread.id,
              created_by: thread.created_by,
              other_user_id: thread.other_user_id,
              related_type: thread.related_type,
              related_id: thread.related_id,
              last_message_at: thread.last_message_at,
              other_user: profile || undefined,
              last_message: lastMessage || undefined,
              unread_count: count || 0,
            };
          })
        );

        setThreads(processedThreads);
      } catch (error) {
        console.error("Error fetching threads:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();

    // Subscribe to new messages for real-time updates
    const channel = supabase
      .channel("threads-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchThreads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { threads, loading };
};
