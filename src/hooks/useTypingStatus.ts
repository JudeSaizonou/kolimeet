import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { RealtimeChannel } from "@supabase/supabase-js";

export const useTypingStatus = (threadId: string) => {
  const { user } = useAuth();
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!threadId || !user) return;

    console.log('[useTypingStatus] 🎯 Initializing for thread:', threadId, 'user:', user.id);

    // Create a presence channel for typing status
    const channel = supabase.channel(`typing:${threadId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Subscribe to presence changes
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        console.log('[useTypingStatus] 👥 Presence state:', state);
        
        // Check if other user is typing
        const otherUsers = Object.keys(state).filter(key => key !== user.id);
        const isOtherUserTyping = otherUsers.some(userId => {
          const userState = state[userId] as any[];
          return userState && userState[0]?.typing === true;
        });
        
        console.log('[useTypingStatus] ✍️ Other user typing:', isOtherUserTyping);
        setOtherUserTyping(isOtherUserTyping);
        
        // Auto-clear typing status after 3 seconds
        if (isOtherUserTyping) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setOtherUserTyping(false);
          }, 3000);
        }
      })
      .subscribe(async (status) => {
        console.log('[useTypingStatus] 📡 Channel status:', status);
        if (status === 'SUBSCRIBED') {
          await channel.track({ typing: false });
          console.log('[useTypingStatus] ✅ Subscribed and tracked initial typing:false');
        }
      });

    channelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (channelRef.current) {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [threadId, user]);

  const setTyping = useCallback(
    async (isTyping: boolean) => {
      if (!channelRef.current) return;

      try {
        console.log('[useTypingStatus] ⌨️ Setting typing status:', isTyping);
        await channelRef.current.track({ typing: isTyping });
      } catch (error) {
        console.error("[useTypingStatus] ❌ Error updating typing status:", error);
      }
    },
    []
  );

  return {
    otherUserTyping,
    setTyping,
  };
};
