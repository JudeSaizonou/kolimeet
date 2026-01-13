import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageInput } from "@/components/messaging/MessageInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ExternalLink } from "lucide-react";

const NewMessageThread = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [otherUser, setOtherUser] = useState<any>(null);
  const [relatedItem, setRelatedItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const type = searchParams.get("type") as "trip" | "parcel";
  const relatedId = searchParams.get("id");
  const otherUserId = searchParams.get("user");

  useEffect(() => {
    const loadData = async () => {
      if (!user || !type || !relatedId || !otherUserId) {
        navigate("/messages");
        return;
      }

      try {
        // Vérifier si un thread existe déjà pour cette annonce entre les deux utilisateurs
        const { data: existingThreads } = await supabase
          .from("threads")
          .select("id, created_by, other_user_id")
          .eq("related_id", relatedId)
          .eq("related_type", type);

        // Filtrer pour trouver un thread entre les deux utilisateurs
        const existingThread = existingThreads?.find(
          (thread: any) =>
            (thread.created_by === user.id && thread.other_user_id === otherUserId) ||
            (thread.created_by === otherUserId && thread.other_user_id === user.id)
        );

        if (existingThread) {
          navigate(`/messages/${existingThread.id}`);
          return;
        }

        // Charger les infos de l'autre utilisateur
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("user_id", otherUserId)
          .single();

        setOtherUser(profile);

        // Charger les infos de l'annonce
        const table = type === "trip" ? "trips" : "parcels";
        const { data: item } = await supabase
          .from(table)
          .select("*")
          .eq("id", relatedId)
          .single();

        setRelatedItem(item);
      } catch (error) {
        console.error("Error loading data:", error);
        navigate("/messages");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, type, relatedId, otherUserId, navigate]);

  const handleSend = async (content: string) => {
    if (!user || !type || !relatedId || !otherUserId) return;

    setSending(true);

    try {
      // Créer le thread
      const { data: newThread, error: threadError } = await supabase
        .from("threads")
        .insert({
          created_by: user.id,
          other_user_id: otherUserId,
          related_type: type,
          related_id: relatedId,
        })
        .select()
        .single();

      if (threadError) throw threadError;

      // Envoyer le message
      const { error: messageError } = await supabase
        .from("messages")
        .insert({
          thread_id: newThread.id,
          sender_id: user.id,
          content,
        });

      if (messageError) throw messageError;

      // Rediriger vers le thread créé
      navigate(`/messages/${newThread.id}`, { replace: true });
    } catch (error: any) {
      console.error("Error creating thread:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const getRelatedLink = () => {
    if (!relatedItem) return null;
    const path = type === "trip" ? "trajets" : "colis";
    return `/${path}/${relatedId}`;
  };

  if (loading || !otherUser) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <Skeleton className="w-full h-96 max-w-4xl" />
      </div>
    );
  }

  return (
    <div className="md:relative md:flex md:flex-col md:h-auto fixed inset-0 top-0 flex flex-col bg-background md:bg-transparent md:top-auto">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b md:relative md:z-auto">
        <div className="flex items-center gap-2 md:gap-3 px-3 md:px-6 py-3 md:py-4">
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
            <h2 className="font-semibold text-sm truncate">{otherUser.full_name}</h2>
            {relatedItem && (
              <p className="text-xs text-muted-foreground truncate">
                {type === "trip"
                  ? `${relatedItem.from_city} → ${relatedItem.to_city}`
                  : relatedItem.title}
              </p>
            )}
          </div>

          {relatedItem && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(getRelatedLink()!)}
              className="h-9 w-9 shrink-0"
              aria-label="Voir l'annonce"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      </header>

      {/* Zone de messages vide */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <div className="text-center text-sm text-muted-foreground">
          <p>Envoyez votre premier message à {otherUser.full_name}</p>
        </div>
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-background border-t safe-bottom md:relative md:bottom-auto">
        <MessageInput 
          onSend={handleSend} 
          onTyping={() => {}} 
          disabled={sending} 
        />
      </div>
    </div>
  );
};

export default NewMessageThread;
