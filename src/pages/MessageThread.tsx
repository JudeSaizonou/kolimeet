import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { useTypingStatus } from "@/hooks/useTypingStatus";
import { useReservationRequests } from "@/hooks/useReservationRequests";
import { supabase } from "@/integrations/supabase/client";
import { MessageBubble } from "@/components/messaging/MessageBubble";
import { MessageInput } from "@/components/messaging/MessageInput";
import { TypingIndicator } from "@/components/messaging/TypingIndicator";
import { ReservationRequestMessage } from "@/components/messaging/ReservationRequestMessage";
import { ReservationRequestDrawer } from "@/components/messaging/ReservationRequestDrawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ExternalLink, AlertTriangle, ShoppingCart } from "lucide-react";
import { AnimatePresence } from "framer-motion";

const MessageThread = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, loading, sending, sendMessage } = useMessages(id!);
  const { otherUserTyping, setTyping } = useTypingStatus(id!);
  const { requests, refetch: refetchRequests } = useReservationRequests(id!);
  const [thread, setThread] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [trip, setTrip] = useState<any>(null);
  const [reservationDrawerOpen, setReservationDrawerOpen] = useState(false);
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

      // Récupérer les infos du trip si c'est un thread lié à un trajet
      if (data.related_type === "trip") {
        const { data: tripData } = await supabase
          .from("trips")
          .select("*")
          .eq("id", data.related_id)
          .single();

        if (tripData) {
          setTrip(tripData);
        }
      }
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

  // Vérifier si l'utilisateur peut réserver
  const canReserve =
    trip &&
    user &&
    user.id !== trip.user_id && // Pas le conducteur
    trip.capacity_available_kg > 0 && // Capacité disponible
    new Date(trip.date_departure) > new Date(); // Trajet futur

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
            <span className="hidden md:inline"> Gardez toutes vos communications sur Kolimeet. Ne partagez jamais votre numéro ou email avant de rencontrer la personne.</span>
            <span className="md:hidden"> Restez sur Kolimeet, ne partagez pas vos coordonnées.</span>
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
            {messages.map((message) => {
              // Vérifier si le message est lié à une demande de réservation
              const relatedRequest = requests.find(
                (req) => req.message_id === message.id
              );

              if (relatedRequest) {
                // Ne pas afficher les demandes annulées
                if (relatedRequest.status === 'cancelled') {
                  return null;
                }

                return (
                  <ReservationRequestMessage
                    key={message.id}
                    request={relatedRequest}
                    onUpdate={refetchRequests}
                  />
                );
              }

              // Message normal
              return (
                <MessageBubble
                  key={message.id}
                  content={message.content}
                  createdAt={message.created_at}
                  isOwn={message.sender_id === user?.id}
                  deliveredAt={message.delivered_at}
                  readAt={message.read_at}
                />
              );
            })}
            
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

      {/* Bouton de réservation (sticky, au-dessus de l'input) */}
      {canReserve && (
        <div className="sticky bottom-[72px] md:bottom-[80px] px-4 pb-2 bg-gradient-to-t from-background via-background to-transparent pointer-events-none">
          <Button
            onClick={() => setReservationDrawerOpen(true)}
            className="w-full h-12 shadow-lg pointer-events-auto"
            size="lg"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Réserver des kilos
          </Button>
        </div>
      )}

      {/* Input fixe mobile, normal desktop */}
      <div className="sticky bottom-0 bg-background border-t safe-bottom md:relative md:bottom-auto">
        <MessageInput 
          onSend={sendMessage} 
          onTyping={setTyping}
          disabled={sending} 
        />
      </div>

      {/* Drawer de réservation */}
      {trip && (
        <ReservationRequestDrawer
          open={reservationDrawerOpen}
          onOpenChange={setReservationDrawerOpen}
          trip={trip}
          threadId={id!}
          onSuccess={() => {
            refetchRequests();
            setReservationDrawerOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default MessageThread;
