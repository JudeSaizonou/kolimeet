import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface UseFavoritesReturn {
  isFavorited: boolean;
  favoritesCount: number;
  loading: boolean;
  toggleFavorite: () => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

/**
 * Hook pour gérer les favoris d'un item (trip ou parcel)
 * @param itemType - Type de l'item ('trip' ou 'parcel')
 * @param itemId - ID de l'item
 */
export const useFavorite = (
  itemType: "trip" | "parcel",
  itemId: string
): UseFavoritesReturn => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Vérifier si l'item est en favoris et compter le nombre total
  const checkFavoriteStatus = async () => {
    if (!itemId) {
      setLoading(false);
      return;
    }

    try {
      // Compter le nombre total de favoris pour cet item
      const { data: countData, error: countError } = await supabase.rpc(
        "count_favorites",
        {
          p_item_type: itemType,
          p_item_id: itemId,
        }
      );

      if (countError) throw countError;
      setFavoritesCount(countData || 0);

      // Si l'utilisateur est connecté, vérifier s'il a mis en favoris
      if (user) {
        const { data: favoriteData, error: favoriteError } = await supabase
          .from("favorites")
          .select("id")
          .eq("user_id", user.id)
          .eq("item_type", itemType)
          .eq("item_id", itemId)
          .maybeSingle();

        if (favoriteError && favoriteError.code !== "PGRST116") {
          throw favoriteError;
        }

        setIsFavorited(!!favoriteData);
      } else {
        setIsFavorited(false);
      }
    } catch (error) {
      console.error("Error checking favorite status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkFavoriteStatus();
  }, [itemId, itemType, user]);

  // Ajouter ou retirer des favoris
  const toggleFavorite = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour ajouter des favoris.",
        variant: "destructive",
      });
      return;
    }

    if (!itemId) return;

    try {
      if (isFavorited) {
        // Retirer des favoris
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("item_type", itemType)
          .eq("item_id", itemId);

        if (error) throw error;

        setIsFavorited(false);
        setFavoritesCount((prev) => Math.max(0, prev - 1));

        toast({
          title: "Retiré des favoris",
          description: "L'annonce a été retirée de vos favoris.",
        });
      } else {
        // Ajouter aux favoris
        const { error } = await supabase.from("favorites").insert({
          user_id: user.id,
          item_type: itemType,
          item_id: itemId,
        });

        if (error) throw error;

        setIsFavorited(true);
        setFavoritesCount((prev) => prev + 1);

        toast({
          title: "Ajouté aux favoris",
          description: "L'annonce a été ajoutée à vos favoris.",
        });
      }
    } catch (error: any) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier les favoris.",
        variant: "destructive",
      });
    }
  };

  const refreshFavorites = async () => {
    await checkFavoriteStatus();
  };

  return {
    isFavorited,
    favoritesCount,
    loading,
    toggleFavorite,
    refreshFavorites,
  };
};
