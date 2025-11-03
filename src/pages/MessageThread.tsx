import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MessageBubble } from "@/components/messaging/MessageBubble";
import { MessageInput } from "@/components/messaging/MessageInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ExternalLink, AlertTriangle } from "lucide-react";

const MessageThread = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, loading, sending, sendMessage } = useMessages(id!);
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
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="flex flex-col container mx-auto px-4 py-4 max-w-4xl">
      {/* Safety Warning Banner */}
      <Alert className="mb-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>⚠️ Restez en sécurité !</strong> Gardez toutes vos communications sur kilomeet. 
          Ne partagez jamais votre numéro de téléphone ou email avant de rencontrer la personne.
        </AlertDescription>
      </Alert>

      {/* Header */}
      <div className="border-b pb-4 mb-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/messages")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <Avatar className="h-10 w-10">
            <AvatarImage src={otherUser.avatar_url} />
            <AvatarFallback>{otherUser.full_name[0]}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h2 className="font-semibold">{otherUser.full_name}</h2>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => navigate(getRelatedLink()!)}
            >
              Voir l'annonce
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Aucun message pour le moment
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                content={message.content}
                createdAt={message.created_at}
                isOwn={message.sender_id === user?.id}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <MessageInput onSend={sendMessage} disabled={sending} />
    </div>
  );
};

export default MessageThread;
