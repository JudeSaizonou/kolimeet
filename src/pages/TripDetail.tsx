import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFavorite } from "@/hooks/useFavorite";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Calendar, Package, Star, CreditCard, MessageCircle, Heart, MapPin, Weight, Info } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MatchingSection } from "@/components/explorer/MatchingSection";
import { ReviewDialog } from "@/components/reviews/ReviewDialog";
import { BookingDialog } from "@/components/booking/BookingDialog";
import { GlassCard } from "@/components/LiquidGlass";
import { MatchingSuggestions } from "@/components/matching/MatchingSuggestions";
import { Separator } from "@/components/ui/separator";

const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isFavorited, favoritesCount, toggleFavorite } = useFavorite("trip", id || "");
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const { data, error } = await supabase
          .from("trips")
          .select("*, profiles!trips_user_id_fkey(full_name, avatar_url, rating_avg, rating_count)")
          .eq("id", id)
          .single();

        if (error) throw error;
        setTrip(data);
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
    };

    fetchTrip();
  }, [id, navigate, toast]);

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
      // Check if thread already exists
      const { data: existingThread } = await supabase
        .from("threads")
        .select("id")
        .eq("related_id", id)
        .or(`and(created_by.eq.${user.id},other_user_id.eq.${trip.user_id}),and(created_by.eq.${trip.user_id},other_user_id.eq.${user.id})`)
        .single();

      if (existingThread) {
        navigate(`/messages/${existingThread.id}`);
        return;
      }

      // Create new thread
      const { data: newThread, error } = await supabase
        .from("threads")
        .insert({
          created_by: user.id,
          other_user_id: trip.user_id,
          related_type: "trip",
          related_id: id,
        })
        .select()
        .single();

      if (error) throw error;

      navigate(`/messages/${newThread.id}`);
    } catch (error: any) {
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

  return (
    <div className="min-h-screen bg-secondary/30 pb-24 pt-20 md:pt-24">
      <div className="container mx-auto px-4 max-w-3xl">
        
        {/* Header Card */}
        <GlassCard 
          className="relative overflow-hidden mb-6"
          intensity="medium"
          rounded="2xl"
          padding="sm"
        >
          {/* Gradient Background Header */}
          <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-4 text-primary/80">
                <span className="text-2xl font-bold">{trip.from_city}</span>
                <ArrowRight className="h-6 w-6" />
                <span className="text-2xl font-bold">{trip.to_city}</span>
              </div>
            </div>
            
            {/* Favorite Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-white/50 backdrop-blur-sm hover:bg-white/80 rounded-full"
              onClick={toggleFavorite}
            >
              <Heart className={`h-5 w-5 ${isFavorited ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
            </Button>
          </div>

          <div className="p-6 -mt-12 relative z-10">
            <div className="flex justify-between items-end mb-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                  <AvatarImage src={trip.profiles?.avatar_url} />
                  <AvatarFallback>{trip.profiles?.full_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="mb-2">
                  <h1 className="text-xl font-bold text-foreground">{trip.profiles?.full_name}</h1>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-foreground">{trip.profiles?.rating_avg?.toFixed(1) || "Nouveau"}</span>
                    {trip.profiles?.rating_count > 0 && <span>({trip.profiles?.rating_count})</span>}
                  </div>
                </div>
              </div>
              
              <div className="text-right mb-2">
                <div className="text-2xl font-bold text-primary">
                  {trip.price_expect ? `${trip.price_expect}€` : "Sur devis"}
                </div>
                <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">par kg</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-secondary/50 p-3 rounded-xl flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Départ</div>
                  <div className="font-semibold text-sm">
                    {format(new Date(trip.date_departure), "d MMM yyyy", { locale: fr })}
                  </div>
                </div>
              </div>

              <div className="bg-secondary/50 p-3 rounded-xl flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Weight className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Capacité</div>
                  <div className="font-semibold text-sm">
                    {trip.capacity_available_kg} kg dispo
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xs uppercase text-muted-foreground font-bold tracking-wider mb-2 flex items-center gap-2">
                  <Info className="h-3 w-3" />
                  Description
                </h3>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {trip.notes || "Aucune description fournie pour ce trajet."}
                </p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-white/20 z-40 md:relative md:bg-transparent md:border-0 md:p-0 md:backdrop-blur-none">
          <div className="container max-w-3xl mx-auto flex gap-3">
            <Button 
              className="flex-1 h-12 rounded-xl font-semibold text-base shadow-lg shadow-primary/20"
              onClick={() => setBookingDialogOpen(true)}
            >
              <Package className="mr-2 h-5 w-5" />
              Réserver
            </Button>
            <Button 
              variant="outline" 
              className="h-12 w-12 rounded-xl p-0 border-2"
              onClick={handleContact}
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Suggestions de colis compatibles */}
        <div className="mt-8 mb-6">
          <MatchingSuggestions type="trip" itemId={trip.id} maxSuggestions={5} />
        </div>

        {/* Matching Section */}
        <div className="mb-24 md:mb-8">
          <h2 className="text-lg font-bold mb-4 px-2">Autres colis disponibles</h2>
          <MatchingSection 
            type="trip" 
            item={trip} 
          />
        </div>

        <ReviewDialog
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          targetUserId={trip.user_id}
          targetUserName={trip.profiles?.full_name || "ce voyageur"}
        />

        <BookingDialog
          open={bookingDialogOpen}
          onOpenChange={setBookingDialogOpen}
          trip={trip}
        />
      </div>
    </div>
  );
};

export default TripDetail;
