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
import { ArrowRight, Calendar, Package, Star, Weight, MessageCircle, Heart } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MatchingSection } from "@/components/explorer/MatchingSection";
import { ReviewDialog } from "@/components/reviews/ReviewDialog";
import { MatchingSuggestions } from "@/components/matching/MatchingSuggestions";

const ParcelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isFavorited, favoritesCount, toggleFavorite } = useFavorite("parcel", id || "");
  const [parcel, setParcel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  const typeLabels: Record<string, string> = {
    documents: "Documents",
    vetements: "Vêtements",
    electronique: "Électronique",
    autre: "Autre",
  };

  useEffect(() => {
    const fetchParcel = async () => {
      try {
        const { data, error } = await supabase
          .from("parcels")
          .select("*, profiles!parcels_user_id_fkey(full_name, avatar_url, rating_avg, rating_count)")
          .eq("id", id)
          .single();

        if (error) throw error;
        setParcel(data);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger ce colis.",
        });
        navigate("/explorer");
      } finally {
        setLoading(false);
      }
    };

    fetchParcel();
  }, [id, navigate, toast]);

  const handleContact = async () => {
    if (!user) {
      navigate("/auth/login");
      return;
    }

    if (user.id === parcel.user_id) {
      toast({
        title: "Information",
        description: "Vous ne pouvez pas vous contacter vous-même.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Vérifier si un thread existe déjà
      const { data: existingThread } = await supabase
        .from("threads")
        .select("id")
        .eq("related_id", id)
        .or(`and(created_by.eq.${user.id},other_user_id.eq.${parcel.user_id}),and(created_by.eq.${parcel.user_id},other_user_id.eq.${user.id})`)
        .single();

      if (existingThread) {
        navigate(`/messages/${existingThread.id}`);
        return;
      }

      // Naviguer vers une URL temporaire qui créera le thread au premier message
      navigate(`/messages/new?type=parcel&id=${id}&user=${parcel.user_id}`);
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

  if (!parcel) return null;

  const profile = parcel.profiles;

  return (
    <>
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <Card className="mb-4 md:mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background p-4 md:p-6 border-b">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2 text-base md:text-xl font-bold">
                    <span className="text-foreground">{parcel.from_city}</span>
                    <ArrowRight className="h-4 md:h-5 w-4 md:w-5 text-primary" />
                    <span className="text-foreground">{parcel.to_city}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground">
                  <Calendar className="h-3.5 md:h-4 w-3.5 md:w-4" />
                  <span>Avant le {format(new Date(parcel.deadline), "d MMMM yyyy", { locale: fr })}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleFavorite}
                  className="h-9 w-9 md:h-10 md:w-10 shrink-0"
                  title={isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"}
                >
                  <Heart className={`h-4 w-4 md:h-5 md:w-5 ${isFavorited ? 'fill-red-500 text-red-500' : ''}` } />
                </Button>
                <Badge 
                  variant={parcel.status === "open" ? "default" : "secondary"} 
                  className="text-xs shrink-0"
                >
                  {parcel.status === "open" ? "Ouvert" : "Fermé"}
                </Badge>
              </div>
            </div>
          </div>

          <CardContent className="space-y-4 md:space-y-5 p-4 md:p-6">
            <Link 
              to={`/u/${parcel.user_id}`}
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

            <div className="grid grid-cols-3 gap-2 md:gap-3">
              <div className="p-2 md:p-4 border rounded-xl bg-gradient-to-br from-blue-500/5 to-background">
                <div className="flex items-center gap-1 mb-1.5 md:mb-2">
                  <Package className="h-3 md:h-4 w-3 md:w-4 text-blue-600" />
                  <h3 className="font-semibold text-xs md:text-sm text-muted-foreground">Type</h3>
                </div>
                <p className="text-xs md:text-sm font-bold text-foreground">{typeLabels[parcel.type]}</p>
              </div>

              <div className="p-2 md:p-4 border rounded-xl bg-gradient-to-br from-purple-500/5 to-background">
                <div className="flex items-center gap-1 mb-1.5 md:mb-2">
                  <Weight className="h-3 md:h-4 w-3 md:w-4 text-purple-600" />
                  <h3 className="font-semibold text-xs md:text-sm text-muted-foreground">Poids</h3>
                </div>
                <p className="text-sm md:text-xl font-bold text-foreground">{parcel.weight_kg}kg</p>
              </div>

              <div className="p-2 md:p-4 border rounded-xl bg-gradient-to-br from-orange-500/5 to-background">
                <div className="flex items-center gap-1 mb-1.5 md:mb-2">
                  <Package className="h-3 md:h-4 w-3 md:w-4 text-orange-600" />
                  <h3 className="font-semibold text-xs md:text-sm text-muted-foreground">Taille</h3>
                </div>
                <p className="text-sm md:text-xl font-bold text-foreground">{parcel.size}</p>
              </div>
            </div>

            {parcel.description && (
              <div className="p-3 md:p-4 bg-muted/20 border rounded-xl">
                <h3 className="font-semibold mb-2 text-xs md:text-sm text-muted-foreground">Description</h3>
                <p className="text-sm md:text-base text-foreground/90 whitespace-pre-wrap leading-relaxed">{parcel.description}</p>
              </div>
            )}

            {parcel.photos && parcel.photos.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 md:mb-3 text-xs md:text-sm text-muted-foreground">Photos</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                  {parcel.photos.map((photo: string, index: number) => (
                    <div key={index} className="relative overflow-hidden rounded-xl border hover:border-primary/50 transition-colors">
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-32 md:h-48 object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2.5 md:space-y-3 pt-2">
              <Button onClick={handleContact} className="w-full h-11 md:h-12 shadow-sm font-medium">
                <MessageCircle className="w-4 h-4 mr-2" />
                <span className="text-sm md:text-base">Contacter l'expéditeur</span>
              </Button>

              {user && user.id !== parcel.user_id && parcel.status === "closed" && (
                <Button 
                  onClick={() => setReviewDialogOpen(true)} 
                  variant="outline" 
                  className="w-full h-11 md:h-12 border-2 hover:bg-accent font-medium"
                >
                  <Star className="w-4 h-4 mr-2" />
                  <span className="text-sm md:text-base">Laisser un avis</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Suggestions de trajets compatibles */}
        <div className="mb-6">
          <MatchingSuggestions type="parcel" itemId={parcel.id} maxSuggestions={5} />
        </div>

        <MatchingSection type="parcel" item={parcel} />
      </div>

      {user && user.id !== parcel.user_id && (
        <ReviewDialog
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          targetUserId={parcel.user_id}
          targetUserName={profile?.full_name || "cet expéditeur"}
        />
      )}
    </>
  );
};

export default ParcelDetail;
