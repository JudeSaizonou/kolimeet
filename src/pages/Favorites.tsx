import { useFavorites } from "@/hooks/useFavorites";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Heart, ArrowRight, Calendar, Package, Plane, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Favorites = () => {
  const { favorites, loading, refetch } = useFavorites();
  const navigate = useNavigate();
  const { toast } = useToast();

  const trips = favorites.filter((fav) => fav.item_type === "trip");
  const parcels = favorites.filter((fav) => fav.item_type === "parcel");

  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", favoriteId);

      if (error) throw error;

      toast({
        title: "Retiré des favoris",
        description: "L'annonce a été retirée de vos favoris.",
      });

      refetch();
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast({
        title: "Erreur",
        description: "Impossible de retirer des favoris.",
        variant: "destructive",
      });
    }
  };

  const handleViewItem = (itemType: string, itemId: string) => {
    navigate(`/${itemType === "trip" ? "trajets" : "colis"}/${itemId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 md:pt-32">
      <div className="container mx-auto px-3 md:px-4 py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
          {favorites.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Aucun favori"
            description="Vous n'avez pas encore ajouté d'annonces à vos favoris. Explorez les trajets et colis disponibles !"
            action={
              <Button onClick={() => navigate("/explorer")}>
                Explorer les annonces
              </Button>
            }
          />
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-5 md:mb-6 h-11 md:h-12">
              <TabsTrigger value="all" className="text-sm md:text-base font-medium">
                Tous ({favorites.length})
              </TabsTrigger>
              <TabsTrigger value="trips" className="text-sm md:text-base font-medium">
                Trajets ({trips.length})
              </TabsTrigger>
              <TabsTrigger value="parcels" className="text-sm md:text-base font-medium">
                Colis ({parcels.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3 md:space-y-4">
              {favorites.map((favorite) => (
                <FavoriteCard
                  key={favorite.id}
                  favorite={favorite}
                  onView={() => handleViewItem(favorite.item_type, favorite.item_id)}
                  onRemove={() => handleRemoveFavorite(favorite.id)}
                />
              ))}
            </TabsContent>

            <TabsContent value="trips" className="space-y-3 md:space-y-4">
              {trips.length === 0 ? (
                <EmptyState
                  icon={Plane}
                  title="Aucun trajet favori"
                  description="Vous n'avez pas encore ajouté de trajets à vos favoris."
                />
              ) : (
                trips.map((favorite) => (
                  <FavoriteCard
                    key={favorite.id}
                    favorite={favorite}
                    onView={() => handleViewItem(favorite.item_type, favorite.item_id)}
                    onRemove={() => handleRemoveFavorite(favorite.id)}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="parcels" className="space-y-3 md:space-y-4">
              {parcels.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="Aucun colis favori"
                  description="Vous n'avez pas encore ajouté de colis à vos favoris."
                />
              ) : (
                parcels.map((favorite) => (
                  <FavoriteCard
                    key={favorite.id}
                    favorite={favorite}
                    onView={() => handleViewItem(favorite.item_type, favorite.item_id)}
                    onRemove={() => handleRemoveFavorite(favorite.id)}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
        </div>
      </div>
    </div>
  );
};

interface FavoriteCardProps {
  favorite: any;
  onView: () => void;
  onRemove: () => void;
}

const FavoriteCard = ({ favorite, onView, onRemove }: FavoriteCardProps) => {
  const item = favorite.item_details;
  const isTrip = favorite.item_type === "trip";

  if (!item) return null;

  return (
    <Card 
      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" 
      onClick={onView}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onView();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Voir ${isTrip ? 'le trajet' : 'le colis'} ${isTrip ? (item as any).from_city : (item as any).to_city}`}
    >
      <div className="bg-primary/5 p-3 md:p-4 border-b">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm md:text-base font-semibold">
              {isTrip ? (
                <Plane className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <Package className="h-4 w-4 text-primary shrink-0" />
              )}
              <span className="truncate">
                {item.from_city} → {item.to_city}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {isTrip
                  ? format(new Date(item.date_departure), "d MMM yyyy", { locale: fr })
                  : `Avant le ${format(new Date(item.deadline), "d MMM yyyy", { locale: fr })}`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={item.status === "open" ? "default" : "secondary"} className="text-xs shrink-0">
              {item.status === "open" ? "Ouvert" : "Fermé"}
            </Badge>
          </div>
        </div>
      </div>
      <CardContent className="p-3 md:p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2 md:gap-3 text-xs md:text-sm flex-wrap">
            {isTrip ? (
              <>
                <span className="px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">
                  {item.capacity_available_kg}kg disponibles
                </span>
                {item.price_expect && (
                  <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium">
                    {item.price_expect}€
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 font-medium capitalize">
                  {item.type}
                </span>
                <span className="px-2 py-1 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 font-medium">
                  {item.weight_kg}kg
                </span>
                <span className="px-2 py-1 rounded-md bg-violet-500/10 text-violet-700 dark:text-violet-300 font-medium">
                  {item.size}
                </span>
              </>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="h-8 w-8 md:h-9 md:w-9 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            title="Retirer des favoris"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Favorites;
