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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, AlertTriangle, ShoppingCart, MapPin, Calendar, Package, Weight, Plane, ChevronDown, ChevronUp } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
  const [parcel, setParcel] = useState<any>(null);
  const [reservationDrawerOpen, setReservationDrawerOpen] = useState(false);
  const [showAnnouncementDetails, setShowAnnouncementDetails] = useState(false);
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

      // Récupérer les infos du trip ou du parcel selon le type
      if (data.related_type === "trip") {
        const { data: tripData } = await supabase
          .from("trips")
          .select("*")
          .eq("id", data.related_id)
          .single();

        if (tripData) {
          setTrip(tripData);
        }
      } else if (data.related_type === "parcel") {
        const { data: parcelData } = await supabase
          .from("parcels")
          .select("*")
          .eq("id", data.related_id)
          .single();

        if (parcelData) {
          setParcel(parcelData);
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
            <button
              onClick={() => setShowAnnouncementDetails(!showAnnouncementDetails)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {thread?.related_type === "trip" ? (
                <span className="flex items-center gap-1">
                  <Plane className="h-3 w-3" />
                  {trip ? `${trip.from_city} → ${trip.to_city}` : "Trajet"}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  {parcel?.title || "Colis"}
                </span>
              )}
              {showAnnouncementDetails ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          </div>

          {/* Bouton réserver sur desktop */}
          {canReserve && (
            <Button
              onClick={() => setReservationDrawerOpen(true)}
              size="sm"
              className="hidden md:flex"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Réserver
            </Button>
          )}
        </div>

        {/* Aperçu de l'annonce (dépliable) */}
        <AnimatePresence>
          {showAnnouncementDetails && (trip || parcel) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 md:px-6">
                {thread?.related_type === "trip" && trip && (
                  <div className="bg-primary/5 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          <Plane className="h-3 w-3 mr-1" />
                          Trajet
                        </Badge>
                        <span className="text-sm font-medium">
                          {trip.from_city} → {trip.to_city}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(getRelatedLink()!)}
                        className="h-7 text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Voir
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(trip.date_departure), "d MMM yyyy", { locale: fr })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Weight className="h-3 w-3" />
                        {trip.available_weight || trip.capacity_available_kg || 0} kg dispo
                      </span>
                      <span className="font-medium text-primary">
                        {trip.price_per_kg}€/kg
                      </span>
                    </div>
                  </div>
                )}

                {thread?.related_type === "parcel" && parcel && (
                  <div className="bg-primary/5 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          <Package className="h-3 w-3 mr-1" />
                          Colis
                        </Badge>
                        <span className="text-sm font-medium truncate max-w-[200px]">
                          {parcel.title}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(getRelatedLink()!)}
                        className="h-7 text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Voir
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {parcel.from_city} → {parcel.to_city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Weight className="h-3 w-3" />
                        {parcel.weight} kg
                      </span>
                      {parcel.proposed_price && (
                        <span className="font-medium text-primary">
                          {parcel.proposed_price}€ proposé
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Safety Warning - Collapsible sur mobile */}
          <Alert className="mx-4 mb-3 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 md:mx-6">
          <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
          <AlertDescription className="text-xs md:text-sm text-yellow-800 dark:text-yellow-200">
            <strong className="font-semibold">Sécurité :</strong>
            <span className="hidden md:inline"> Gardez toutes vos communications sur Kolimeet. Ne partagez jamais votre numéro ou email avant de rencontrer la personne.</span>
            <span className="md:hidden"> Restez sur Kolimeet, ne partagez pas vos coordonnées.</span>
          </AlertDescription>
        </Alert>
      </header>

      {/* Messages scrollables - Full-screen mobile, auto desktop */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-6 md:max-h-[calc(100vh-20rem)]">
        {/* Debug logs */}
        {console.log('[MessageThread] Messages:', messages.map(m => ({ id: m.id, type: m.message_type, reqId: m.reservation_request_id })))}
        {console.log('[MessageThread] Requests:', requests.map(r => ({ id: r.id, messageId: r.message_id, status: r.status })))}
        
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
              <p className="text-muted-foreground text-sm md:text-base">
                Aucun message pour le moment
              </p>
              <p className="text-xs text-muted-foreground">
                Envoyez votre premier message
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              // Vérifier si on doit afficher un séparateur de date
              const messageDate = new Date(message.created_at);
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const prevMessageDate = prevMessage ? new Date(prevMessage.created_at) : null;
              
              const showDateSeparator = !prevMessageDate || 
                messageDate.toDateString() !== prevMessageDate.toDateString();
              
              // Formater la date pour l'affichage
              const formatDateSeparator = (date: Date) => {
                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                
                if (date.toDateString() === today.toDateString()) {
                  return "Aujourd'hui";
                } else if (date.toDateString() === yesterday.toDateString()) {
                  return "Hier";
                } else {
                  return format(date, "EEEE d MMMM yyyy", { locale: fr });
                }
              };

              // Vérifier si le message est lié à une demande de réservation
              // Option 1: Le message a un reservation_request_id direct
              // Option 2: Une request a ce message_id
              // Option 3: C'est un message de type booking_request/reservation_request (ancien système)
              let relatedRequest = null;
              
              // Chercher par reservation_request_id sur le message
              if (message.reservation_request_id) {
                relatedRequest = requests.find(
                  (req) => req.id === message.reservation_request_id
                );
              }
              
              // Chercher par message_id sur la request
              if (!relatedRequest) {
                relatedRequest = requests.find(
                  (req) => req.message_id === message.id
                );
              }
              
              // Fallback: Si c'est un message de type réservation, chercher une request correspondante par date
              if (!relatedRequest && (message.message_type === 'booking_request' || message.message_type === 'reservation_request')) {
                // Trouver la request la plus proche en date du message
                const messageTime = new Date(message.created_at).getTime();
                const matchingRequests = requests.filter(req => {
                  const reqTime = new Date(req.created_at).getTime();
                  // Tolérance de 5 secondes pour associer
                  return Math.abs(reqTime - messageTime) < 5000;
                });
                if (matchingRequests.length > 0) {
                  relatedRequest = matchingRequests[0];
                }
              }

              if (relatedRequest) {
                // Ne pas afficher les demandes annulées
                if (relatedRequest.status === 'cancelled') {
                  return null;
                }

                return (
                  <div key={message.id}>
                    {showDateSeparator && (
                      <div className="flex items-center justify-center my-4">
                        <div className="bg-muted/60 text-muted-foreground text-xs px-3 py-1 rounded-full capitalize">
                          {formatDateSeparator(messageDate)}
                        </div>
                      </div>
                    )}
                    <ReservationRequestMessage
                      request={relatedRequest}
                      onUpdate={refetchRequests}
                      isOwn={message.sender_id === user?.id}
                    />
                  </div>
                );
              }

              // Message normal
              return (
                <div key={message.id}>
                  {showDateSeparator && (
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-muted/60 text-muted-foreground text-xs px-3 py-1 rounded-full capitalize">
                        {formatDateSeparator(messageDate)}
                      </div>
                    </div>
                  )}
                  <MessageBubble
                    content={message.content}
                    createdAt={message.created_at}
                    isOwn={message.sender_id === user?.id}
                    deliveredAt={message.delivered_at}
                    readAt={message.read_at}
                  />
                </div>
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

      {/* Bouton de réservation mobile uniquement (sticky, au-dessus de l'input) */}
      {canReserve && (
        <div className="md:hidden sticky bottom-[72px] px-4 pb-2 bg-gradient-to-t from-background via-background to-transparent pointer-events-none">
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
