import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFavorite } from "@/hooks/useFavorite";
import { useToast } from "@/hooks/use-toast";
import { useReferrals } from "@/hooks/useReferrals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Calendar, Package, Star, CreditCard, MessageCircle, Heart, MapPin, Weight, Info, Share2, Settings, Plane, Clock, Shield, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ReviewDialog } from "@/components/reviews/ReviewDialog";
import { SimpleBookingDialog } from "@/components/booking/SimpleBookingDialog";
import { GlassCard } from "@/components/LiquidGlass";
import { MatchingSuggestions } from "@/components/matching/MatchingSuggestions";
import { Separator } from "@/components/ui/separator";
import { ShareButton } from "@/components/ShareButton";
import { SEO } from "@/components/SEO";
import { generateTripOGImage } from "@/lib/utils/ogImage";
import { ReportButton } from "@/components/ReportButton";
import { TrustBadge, ReferralRequestDialog, ReferrersList } from "@/components/trust";

const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isFavorited, favoritesCount, toggleFavorite } = useFavorite("trip", id || "");
  const { getReferrersForUser } = useReferrals();
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [ownerReferrers, setOwnerReferrers] = useState<any[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  const fetchTrip = useCallback(async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from("trips")
        .select("*, profiles!trips_user_id_fkey(full_name, avatar_url, rating_avg, rating_count, trust_score, is_verified)")
        .eq("id", id)
        .single();

      if (error) throw error;
      setTrip(data);
      
      // Charger les parrains du propriétaire du trajet
      if (data?.user_id) {
        const referrers = await getReferrersForUser(data.user_id);
        setOwnerReferrers(referrers);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger ce trajet.",
      });
      navigate("/explorer");
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast, getReferrersForUser]);

  useEffect(() => {
    fetchTrip();

    // Temps réel : écouter les changements de ce trajet
    if (id) {
      const channel = supabase
        .channel(`trip-detail-${id}`)
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'trips',
            filter: `id=eq.${id}`
          },
          () => {
            console.log('[TripDetail] 🔔 Trip changed, reloading...');
            fetchTrip();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [id, fetchTrip]);

  const handleContact = async () => {
    if (!user) {
      navigate("/auth/login");
      return;
    }

    if (user.id === trip.user_id) {
      toast({
        title: "Information",
        description: "Vous ne pouvez pas vous contacter vous-même.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Vérifier si un thread existe déjà pour cette annonce entre les deux utilisateurs
      const { data: existingThreads } = await supabase
        .from("threads")
        .select("id, created_by, other_user_id")
        .eq("related_id", id)
        .eq("related_type", "trip");

      // Filtrer pour trouver un thread entre les deux utilisateurs
      const existingThread = existingThreads?.find(
        (thread: any) =>
          (thread.created_by === user.id && thread.other_user_id === trip.user_id) ||
          (thread.created_by === trip.user_id && thread.other_user_id === user.id)
      );

      if (existingThread) {
        navigate(`/messages/${existingThread.id}`);
        return;
      }

      // Créer un nouveau thread directement
      const { data: newThread, error: threadError } = await supabase
        .from("threads")
        .insert({
          created_by: user.id,
          other_user_id: trip.user_id,
          related_type: "trip",
          related_id: id,
        })
        .select()
        .single();

      if (threadError) throw threadError;

      navigate(`/messages/${newThread.id}`);
    } catch (error: any) {
      console.error("Error creating thread:", error);
      toast({
        title: "Erreur",
        description: "Impossible de démarrer la conversation.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-96 mb-6" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!trip) return null;

  const ogImage = generateTripOGImage({
    fromCity: trip.from_city || '',
    toCity: trip.to_city || '',
    fromCountry: trip.from_country || '',
    toCountry: trip.to_country || '',
    date: trip.date_departure ? format(new Date(trip.date_departure), "d MMM yyyy", { locale: fr }) : '',
    capacity: trip.available_weight || 0,
    price: trip.price_per_kg || 0,
  });

  const shareTitle = `Trajet ${trip.from_city || 'Ville'} → ${trip.to_city || 'Ville'}`;
  const shareDescription = `${trip.available_weight || 0}kg disponibles • ${trip.price_per_kg || 0}€/kg • Départ le ${trip.date_departure ? format(new Date(trip.date_departure), "d MMMM yyyy", { locale: fr }) : 'Date à confirmer'}`;
  const shareUrl = window.location.href;

  return (
    <>
      <SEO
        title={shareTitle}
        description={shareDescription}
        image={ogImage}
        url={shareUrl}
        type="article"
      />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-background to-background pb-24 pt-20 md:pt-24">
        <div className="container mx-auto px-4 max-w-3xl">
        
        {/* Hero Card - Design épuré sur fond blanc */}
        <div 
          ref={cardRef}
          className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/60 mb-6 shadow-xl shadow-slate-200/50"
        >
          {/* Header coloré subtil */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pb-4">
            {/* Boutons d'action */}
            <div className="flex justify-end gap-2 mb-4">
              <ShareButton
                title={`Trajet ${trip.from_city} → ${trip.to_city}`}
                description={`${trip.capacity_available_kg}kg disponibles - Départ le ${format(new Date(trip.date_departure), "d MMM yyyy", { locale: fr })}`}
                url={`/trajets/${trip.id}`}
                variant="ghost"
                size="icon"
                className="bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600"
                storyShare={{
                  type: 'trip',
                  data: {
                    fromCity: trip.from_city || '',
                    toCity: trip.to_city || '',
                    fromCountry: trip.from_country || '',
                    toCountry: trip.to_country || '',
                    date: trip.date_departure ? format(new Date(trip.date_departure), "d MMM yyyy", { locale: fr }) : '',
                    capacity: trip.available_weight || trip.capacity_available_kg || 0,
                    price: trip.price_per_kg || trip.price_expect || 0,
                  },
                  element: cardRef.current,
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600"
                onClick={toggleFavorite}
              >
                <Heart className={`h-5 w-5 ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
              <ReportButton
                targetType="trip"
                targetId={trip.id}
                targetUserId={trip.user_id}
                variant="ghost"
                size="icon"
                showText={false}
                className="bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600"
              />
            </div>

            {/* Badge trajet */}
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-primary/10 text-primary border-0">
                <Plane className="h-3 w-3 mr-1" />
                Trajet
              </Badge>
              <Badge variant={trip.status === "open" ? "default" : "secondary"} className="text-xs">
                {trip.status === "open" ? "Disponible" : "Complet"}
              </Badge>
            </div>

            {/* Itinéraire */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Départ</p>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{trip.from_city}</h2>
                <p className="text-slate-500 text-sm">{trip.from_country}</p>
              </div>
              
              <div className="flex flex-col items-center px-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plane className="h-6 w-6 text-primary transform rotate-45" />
                </div>
                <div className="h-0.5 w-16 bg-slate-200 my-2" />
              </div>
              
              <div className="flex-1 text-right">
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Arrivée</p>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{trip.to_city}</h2>
                <p className="text-slate-500 text-sm">{trip.to_country}</p>
              </div>
            </div>
          </div>

          <div className="p-6 pt-4">
            {/* Infos clés */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                <Calendar className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Départ</p>
                <p className="font-bold text-sm text-slate-900">
                  {format(new Date(trip.date_departure), "d MMM", { locale: fr })}
                </p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                <Weight className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Capacité</p>
                <p className="font-bold text-sm text-slate-900">{trip.capacity_available_kg} kg</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                <CreditCard className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Prix</p>
                <p className="font-bold text-sm text-slate-900">{trip.price_expect || trip.price_per_kg}€/kg</p>
              </div>
            </div>

            {/* Séparateur */}
            <div className="h-px bg-slate-100 mb-5" />

            {/* Profil du voyageur intégré avec système de confiance */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <Link 
                to={`/u/${trip.user_id}`}
                className="flex items-center gap-3 hover:bg-slate-100 rounded-xl p-1 -m-1 transition-colors"
              >
                <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                  <AvatarImage src={trip.profiles?.avatar_url} />
                  <AvatarFallback className="text-sm bg-primary/10 text-primary">
                    {trip.profiles?.full_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-slate-900 truncate">{trip.profiles?.full_name}</h3>
                    <TrustBadge 
                      trustScore={trip.profiles?.trust_score || 50} 
                      referredByCount={ownerReferrers.length}
                      isVerified={trip.profiles?.is_verified}
                      size="sm"
                    />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span>{trip.profiles?.rating_avg?.toFixed(1) || "Nouveau"}</span>
                    {trip.profiles?.rating_count > 0 && (
                      <span>• {trip.profiles?.rating_count} avis</span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </Link>
              
              {/* Parrains et bouton de parrainage */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  {ownerReferrers.length > 0 ? (
                    <>
                      <ReferrersList referrers={ownerReferrers} maxDisplay={3} size="sm" />
                      <span className="text-xs text-slate-500">
                        {ownerReferrers.length} parrain{ownerReferrers.length > 1 ? 's' : ''}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400">Pas encore parrainé</span>
                  )}
                </div>
                {user && user.id !== trip.user_id && (
                  <ReferralRequestDialog
                    targetUserId={trip.user_id}
                    targetUserName={trip.profiles?.full_name || 'ce voyageur'}
                    className="h-8 text-xs"
                  />
                )}
              </div>
            </div>

            {/* Description */}
            {trip.notes && (
              <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-sm text-slate-600 leading-relaxed">{trip.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t z-40 md:relative md:bg-transparent md:border-0 md:p-0 md:backdrop-blur-none">
          <div className="container max-w-3xl mx-auto flex gap-3">
            {user?.id === trip.user_id ? (
              <Button 
                className="flex-1 h-14 rounded-2xl font-semibold text-base shadow-lg shadow-primary/20"
                onClick={() => navigate(`/publier/trajet/${trip.id}`)}
              >
                <Settings className="mr-2 h-5 w-5" />
                Gérer l'annonce
              </Button>
            ) : (
              <>
                <Button 
                  className="flex-1 h-14 rounded-2xl font-semibold text-base shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-primary/90"
                  onClick={() => setBookingDialogOpen(true)}
                >
                  <Package className="mr-2 h-5 w-5" />
                  Réserver des kilos
                </Button>
                <Button 
                  variant="outline" 
                  className="h-14 w-14 rounded-2xl p-0 border-2"
                  onClick={handleContact}
                >
                  <MessageCircle className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Suggestions de colis compatibles */}
        <div className="mt-8 mb-24 md:mb-8">
          <MatchingSuggestions type="trip" itemId={trip.id} maxSuggestions={5} />
        </div>

        <ReviewDialog
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          targetUserId={trip.user_id}
          targetUserName={trip.profiles?.full_name || "ce voyageur"}
        />

        <SimpleBookingDialog
          open={bookingDialogOpen}
          onOpenChange={setBookingDialogOpen}
          trip={trip}
        />
      </div>
      </div>
    </>
  );
};

export default TripDetail;
