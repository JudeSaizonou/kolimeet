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
  delivered_at?: string | null;
  read_at?: string | null;
  message_type?: string | null;
  reservation_request_id?: string | null;
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

        // Mark messages as read using SQL function
        const { error: markError } = await supabase.rpc(
          'mark_thread_messages_as_read',
          {
            p_thread_id: threadId,
            p_user_id: user.id
          }
        );

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

          // Mark as read if it's not from current user and we're in this conversation
          if (newMessage.sender_id !== user?.id) {
            supabase
              .rpc('mark_message_as_read', { message_id: newMessage.id })
              .then(({ error }) => {
                if (error) {
                  console.error('[useMessages] ❌ Failed to mark new message as read:', error);
                } else {
                  console.log('[useMessages] ✅ Auto-marked new message as read:', newMessage.id);
                  // Update local state
                  setMessages((prev) => 
                    prev.map((msg) => 
                      msg.id === newMessage.id 
                        ? { ...msg, read_at: new Date().toISOString() } 
                        : msg
                    )
                  );
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

        // Récupérer les infos du thread pour connaître le destinataire
        const { data: thread } = await supabase
          .from("threads")
          .select("created_by, other_user_id")
          .eq("id", threadId)
          .single();

        const { error } = await supabase.from("messages").insert({
          thread_id: validated.thread_id,
          sender_id: user.id,
          content: validated.content,
          delivered_at: new Date().toISOString(),
        });

        if (error) throw error;
        
        // Envoyer la notification push via OneSignal
        if (thread) {
          const recipientId = thread.created_by === user.id 
            ? thread.other_user_id 
            : thread.created_by;
          
          if (recipientId) {
            // Récupérer le nom de l'expéditeur
            const { data: senderProfile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("user_id", user.id)
              .single();
            
            const senderName = senderProfile?.full_name || "Quelqu'un";
            const messagePreview = validated.content.length > 50 
              ? validated.content.substring(0, 47) + "..." 
              : validated.content;
            
            // Appeler l'Edge Function OneSignal
            supabase.functions.invoke("send-onesignal-notification", {
              body: {
                recipientUserId: recipientId,
                title: senderName,
                message: messagePreview,
                url: `/messages/${threadId}`,
                data: {
                  type: "message",
                  thread_id: threadId,
                },
              },
            }).then(({ error: notifError }) => {
              if (notifError) {
                console.log("[useMessages] Push notification error (non-blocking):", notifError);
              } else {
                console.log("[useMessages] ✅ Push notification sent to:", recipientId);
              }
            });
          }
        }
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
