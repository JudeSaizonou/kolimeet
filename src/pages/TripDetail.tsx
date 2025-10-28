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
import { ArrowRight, Calendar, Package, Star } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MatchingSection } from "@/components/explorer/MatchingSection";
import { ReviewDialog } from "@/components/reviews/ReviewDialog";

const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

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
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <span>{trip.from_city}, {trip.from_country}</span>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  <span>{trip.to_city}, {trip.to_country}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Départ : {format(new Date(trip.date_departure), "d MMMM yyyy", { locale: fr })}</span>
                </div>
              </div>
              <Badge variant={trip.status === "open" ? "default" : "secondary"}>
                {trip.status === "open" ? "Ouvert" : "Fermé"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <Link 
              to={`/u/${trip.user_id}`}
              className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="text-lg">{profile?.full_name?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">{profile?.full_name || "Utilisateur"}</p>
                {profile?.rating_avg > 0 && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" />
                    <span>{Number(profile.rating_avg).toFixed(1)}</span>
                    <span>({profile.rating_count} avis)</span>
                  </div>
                )}
              </div>
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Capacité disponible</h3>
                </div>
                <p className="text-2xl font-bold">{trip.capacity_available_kg}kg</p>
                <p className="text-sm text-muted-foreground">sur {trip.capacity_kg}kg au total</p>
              </div>

              {trip.price_expect && (
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Prix souhaité</h3>
                  <p className="text-2xl font-bold">{trip.price_expect}€</p>
                </div>
              )}
            </div>

            {trip.notes && (
              <div className="p-4 bg-muted/30 rounded-lg">
                <h3 className="font-semibold mb-2">Notes du voyageur</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{trip.notes}</p>
              </div>
            )}

            <Button onClick={handleContact} className="w-full" size="lg">
              Contacter le voyageur
            </Button>

            {user && user.id !== trip.user_id && trip.status === "closed" && (
              <Button 
                onClick={() => setReviewDialogOpen(true)} 
                variant="outline" 
                className="w-full" 
                size="lg"
              >
                <Star className="w-4 h-4 mr-2" />
                Laisser un avis
              </Button>
            )}
          </CardContent>
        </Card>

        <MatchingSection type="trip" item={trip} />
      </div>

      {user && user.id !== trip.user_id && (
        <ReviewDialog
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          targetUserId={trip.user_id}
          targetUserName={profile?.full_name || "ce voyageur"}
        />
      )}
    </>
  );
};

export default TripDetail;
