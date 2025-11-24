import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { useTypingStatus } from "@/hooks/useTypingStatus";
import { supabase } from "@/integrations/supabase/client";
import { MessageBubble } from "@/components/messaging/MessageBubble";
import { MessageInput } from "@/components/messaging/MessageInput";
import { TypingIndicator } from "@/components/messaging/TypingIndicator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ExternalLink, AlertTriangle } from "lucide-react";
import { AnimatePresence } from "framer-motion";

const MessageThread = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, loading, sending, sendMessage } = useMessages(id!);
  const { otherUserTyping, setTyping } = useTypingStatus(id!);
  const [thread, setThread] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchThread = async () => {
      if (!id || !user) return;

      const { data, error } = await supabase
        .from("threads")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        navigate("/messages");
        return;
      }

      setThread(data);

      // Get other user info
      const otherUserId =
        data.created_by === user.id ? data.other_user_id : data.created_by;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("user_id", otherUserId)
        .single();

      setOtherUser(profile);
    };

    fetchThread();
  }, [id, user, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getRelatedLink = () => {
    if (!thread) return null;
    const path = thread.related_type === "trip" ? "trajets" : "colis";
    return `/${path}/${thread.related_id}`;
  };

  if (loading || !thread || !otherUser) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <Skeleton className="w-full h-96 max-w-4xl" />
      </div>
    );
  }

  return (
    <div className="md:relative md:flex md:flex-col md:h-auto fixed inset-0 top-0 flex flex-col bg-background md:bg-transparent md:top-auto">
      {/* Header fixe - Mobile-first, normal sur desktop */}
      <header className="sticky top-0 z-50 bg-background border-b md:relative md:z-auto">
        <div className="flex items-center gap-3 px-4 py-3 md:px-6 md:py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/messages")}
            className="h-11 w-11 shrink-0 md:hidden"
            aria-label="Retour aux messages"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={otherUser.avatar_url} alt={otherUser.full_name} />
            <AvatarFallback className="text-sm">{otherUser.full_name[0]}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-base md:text-lg truncate">
              {otherUser.full_name}
            </h1>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
              onClick={() => navigate(getRelatedLink()!)}
            >
              Voir l'annonce
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>

        {/* Safety Warning - Collapsible sur mobile */}
        <Alert className="mx-4 mb-3 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 md:mx-6">
          <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
          <AlertDescription className="text-xs md:text-sm text-yellow-800 dark:text-yellow-200">
            <strong className="font-semibold">⚠️ Sécurité :</strong>
            <span className="hidden md:inline"> Gardez toutes vos communications sur kilomeet. Ne partagez jamais votre numéro ou email avant de rencontrer la personne.</span>
            <span className="md:hidden"> Restez sur kilomeet, ne partagez pas vos coordonnées.</span>
          </AlertDescription>
        </Alert>
      </header>

      {/* Messages scrollables - Full-screen mobile, auto desktop */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-6 md:max-h-[calc(100vh-20rem)]">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground text-sm md:text-base">
                Aucun message pour le moment
              </p>
              <p className="text-xs text-muted-foreground">
                Envoyez votre premier message 👋
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                content={message.content}
                createdAt={message.created_at}
                isOwn={message.sender_id === user?.id}
                deliveredAt={message.delivered_at}
                readAt={message.read_at}
              />
            ))}
            
            {/* Typing indicator */}
            <AnimatePresence>
              {otherUserTyping && (
                <TypingIndicator userName={otherUser?.full_name} />
              )}
            </AnimatePresence>
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input fixe mobile, normal desktop */}
      <div className="sticky bottom-0 bg-background border-t safe-bottom md:relative md:bottom-auto">
        <MessageInput 
          onSend={sendMessage} 
          onTyping={setTyping}
          disabled={sending} 
        />
      </div>
    </div>
  );
};

export default MessageThread;
