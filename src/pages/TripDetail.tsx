import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Calendar, Package, Star, CreditCard, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MatchingSection } from "@/components/explorer/MatchingSection";
import { ReviewDialog } from "@/components/reviews/ReviewDialog";
import { BookingDialog } from "@/components/booking/BookingDialog";

const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
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

  const profile = trip.profiles;

  return (
    <>
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <Card className="mb-4 md:mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background p-4 md:p-6 border-b">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2 text-base md:text-xl font-bold">
                    <span className="text-foreground">{trip.from_city}</span>
                    <ArrowRight className="h-4 md:h-5 w-4 md:w-5 text-primary" />
                    <span className="text-foreground">{trip.to_city}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground">
                  <Calendar className="h-3.5 md:h-4 w-3.5 md:w-4" />
                  <span>{format(new Date(trip.date_departure), "d MMMM yyyy", { locale: fr })}</span>
                </div>
              </div>
              <Badge 
                variant={trip.status === "open" ? "default" : "secondary"} 
                className="text-xs shrink-0"
              >
                {trip.status === "open" ? "Ouvert" : "Fermé"}
              </Badge>
            </div>
          </div>

          <CardContent className="space-y-4 md:space-y-5 p-4 md:p-6">
            <Link 
              to={`/u/${trip.user_id}`}
              className="flex items-center gap-3 md:gap-4 p-3 md:p-4 border rounded-xl hover:border-primary/50 hover:shadow-sm transition-all duration-200 bg-card"
            >
              <Avatar className="h-12 md:h-16 w-12 md:w-16 ring-2 ring-primary/10">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="text-base md:text-lg bg-primary/10">{profile?.full_name?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm md:text-base truncate">{profile?.full_name || "Utilisateur"}</p>
                {profile?.rating_avg > 0 && (
                  <div className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground">
                    <Star className="h-3 md:h-4 w-3 md:w-4 fill-amber-400 text-amber-400" />
                    <span className="font-medium">{Number(profile.rating_avg).toFixed(1)}</span>
                    <span className="text-muted-foreground/70">({profile.rating_count})</span>
                  </div>
                )}
              </div>
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="p-3 md:p-4 border rounded-xl bg-gradient-to-br from-primary/5 to-background">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Package className="h-4 md:h-5 w-4 md:w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-xs md:text-sm text-muted-foreground">Capacité disponible</h3>
                </div>
                <p className="text-xl md:text-2xl font-bold text-foreground">{trip.capacity_available_kg}kg</p>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">sur {trip.capacity_kg}kg</p>
              </div>

              {trip.price_expect && (
                <div className="p-3 md:p-4 border rounded-xl bg-gradient-to-br from-emerald-500/5 to-background">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10">
                      <CreditCard className="h-4 md:h-5 w-4 md:w-5 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-xs md:text-sm text-muted-foreground">Prix souhaité</h3>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-foreground">{trip.price_expect}€</p>
                </div>
              )}
            </div>

            {trip.notes && (
              <div className="p-3 md:p-4 bg-muted/20 border rounded-xl">
                <h3 className="font-semibold mb-2 text-xs md:text-sm text-muted-foreground">Notes du voyageur</h3>
                <p className="text-sm md:text-base text-foreground/90 whitespace-pre-wrap leading-relaxed">{trip.notes}</p>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="space-y-2.5 md:space-y-3 pt-2">
              {trip.capacity_available_kg > 0 ? (
                <Button 
                  onClick={() => setBookingDialogOpen(true)} 
                  className="w-full h-11 md:h-12 shadow-sm font-medium" 
                  disabled={!user || user.id === trip.user_id}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  <span className="text-sm md:text-base">Réserver ({trip.price_expect ? `${trip.price_expect}€/kg` : 'Prix à négocier'})</span>
                </Button>
              ) : (
                <Button disabled className="w-full h-11 md:h-12">
                  <Package className="w-4 h-4 mr-2" />
                  <span className="text-sm md:text-base">Capacité épuisée</span>
                </Button>
              )}
              
              <Button 
                onClick={handleContact} 
                variant="outline" 
                className="w-full h-11 md:h-12 border-2 hover:bg-accent font-medium" 
                disabled={!user || user.id === trip.user_id}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                <span className="text-sm md:text-base">Contacter le voyageur</span>
              </Button>
            </div>

            {user && user.id !== trip.user_id && trip.status === "closed" && (
              <Button 
                onClick={() => setReviewDialogOpen(true)} 
                variant="outline" 
                className="w-full h-11 md:h-12"
              >
                <Star className="w-4 h-4 mr-2" />
                <span className="text-sm md:text-base">Laisser un avis</span>
              </Button>
            )}
          </CardContent>
        </Card>

        <MatchingSection type="trip" item={trip} />
      </div>

      {user && user.id !== trip.user_id && (
        <>
          <ReviewDialog
            open={reviewDialogOpen}
            onOpenChange={setReviewDialogOpen}
            targetUserId={trip.user_id}
            targetUserName={profile?.full_name || "ce voyageur"}
          />
          <BookingDialog
            open={bookingDialogOpen}
            onOpenChange={setBookingDialogOpen}
            trip={trip}
          />
        </>
      )}
    </>
  );
};

export default TripDetail;
