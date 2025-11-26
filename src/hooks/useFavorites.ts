import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface FavoriteItem {
  id: string;
  item_type: "trip" | "parcel";
  item_id: string;
  created_at: string;
  item_details: any;
}

/**
 * Hook pour récupérer tous les favoris de l'utilisateur connecté
 */
export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Récupérer les favoris de l'utilisateur
      const { data: favoritesData, error: favoritesError } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (favoritesError) throw favoritesError;

      // Pour chaque favori, récupérer les détails de l'item
      const favoritesWithDetails = await Promise.all(
        (favoritesData || []).map(async (fav) => {
          let itemDetails = null;

          if (fav.item_type === "trip") {
            const { data: tripData } = await supabase
              .from("trips")
              .select("*, profiles!trips_user_id_fkey(full_name, avatar_url)")
              .eq("id", fav.item_id)
              .single();
            itemDetails = tripData;
          } else if (fav.item_type === "parcel") {
            const { data: parcelData } = await supabase
              .from("parcels")
              .select("*, profiles!parcels_user_id_fkey(full_name, avatar_url)")
              .eq("id", fav.item_id)
              .single();
            itemDetails = parcelData;
          }

          return {
            ...fav,
            item_details: itemDetails,
          };
        })
      );

      // Filtrer les favoris dont l'item n'existe plus
      const validFavorites: FavoriteItem[] = favoritesWithDetails
        .filter((fav) => fav.item_details !== null)
        .map((fav) => ({
          id: fav.id,
          item_type: fav.item_type as "trip" | "parcel",
          item_id: fav.item_id,
          created_at: fav.created_at,
          item_details: fav.item_details,
        }));

      setFavorites(validFavorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();

    // S'abonner aux changements en temps réel
    const channel = supabase
      .channel(`favorites-${user?.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "favorites",
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          console.log("[useFavorites] Favorites changed, refetching");
          fetchFavorites();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { favorites, loading, refetch: fetchFavorites };
};
