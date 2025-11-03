import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { createMessageSchema } from "@/lib/validations/messages";
import { z } from "zod";

interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export const useMessages = (threadId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!threadId || !user) {
      setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("thread_id", threadId)
          .order("created_at", { ascending: true });

        if (error) throw error;
        console.log('[useMessages] Fetched messages:', data?.length, 'for thread:', threadId);
        setMessages(data || []);

        // Mark messages as read
        const { error: markError } = await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("thread_id", threadId)
          .neq("sender_id", user.id)
          .eq("is_read", false);

        if (markError) {
          console.error('[useMessages] ❌ Failed to mark messages as read:', markError);
        } else {
          console.log('[useMessages] ✅ Marked messages as read for thread:', threadId);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new and updated messages
    const channel = supabase
      .channel(`messages-${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          console.log('[useMessages] 📨 New message received:', newMessage.id, 'from:', newMessage.sender_id);
          setMessages((prev) => [...prev, newMessage]);

          // Mark as read if it's not from current user
          if (newMessage.sender_id !== user?.id) {
            supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", newMessage.id)
              .then(({ error }) => {
                if (error) {
                  console.error('[useMessages] ❌ Failed to mark new message as read:', error);
                } else {
                  console.log('[useMessages] ✅ Auto-marked new message as read:', newMessage.id);
                }
              });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          console.log('[useMessages] 📝 Message updated:', updatedMessage.id);
          setMessages((prev) => 
            prev.map((msg) => msg.id === updatedMessage.id ? updatedMessage : msg)
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const deletedMessage = payload.old as Message;
          console.log('[useMessages] 🗑️ Message deleted:', deletedMessage.id);
          setMessages((prev) => prev.filter((msg) => msg.id !== deletedMessage.id));
        }
      )
      .subscribe((status) => {
        console.log('[useMessages] 📡 Subscription status:', status, 'for thread:', threadId);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, user]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!user || !threadId) return;

      try {
        setSending(true);

        // Validate content
        const validated = createMessageSchema.parse({
          thread_id: threadId,
          content: content.trim(),
        });

        const { error } = await supabase.from("messages").insert({
          thread_id: validated.thread_id,
          sender_id: user.id,
          content: validated.content,
        });

        if (error) throw error;
      } catch (error) {
        if (error instanceof z.ZodError) {
          toast({
            variant: "destructive",
            title: "Erreur",
            description: error.errors[0].message,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Erreur",
            description: "Impossible d'envoyer le message.",
          });
        }
      } finally {
        setSending(false);
      }
    },
    [user, threadId, toast]
  );

  return { messages, loading, sending, sendMessage };
};
