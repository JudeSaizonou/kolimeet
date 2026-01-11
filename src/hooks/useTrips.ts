import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CreateTripInput, UpdateTripInput } from "@/lib/validations/trips";
import { useNavigate } from "react-router-dom";
import { toUTC } from "@/lib/utils/dates";

export const useTrips = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const createTrip = async (data: CreateTripInput) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase.from("trips").insert([{
        user_id: user.id,
        from_country: data.from_country,
        from_city: data.from_city,
        to_country: data.to_country,
        to_city: data.to_city,
        date_departure: data.date_departure ? toUTC(data.date_departure) : null,
        capacity_kg: data.capacity_kg,
        capacity_available_kg: data.capacity_available_kg,
        price_expect: data.price_expect,
        notes: data.notes,
      }]);

      if (error) throw error;

      toast({
        title: "Trajet publié avec succès",
        description: "Votre annonce est maintenant visible",
      });
      navigate("/mes-annonces");
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de publier le trajet",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTrip = async (id: string, data: UpdateTripInput) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("trips")
        .update(data)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Trajet mis à jour",
        description: "Vos modifications ont été enregistrées",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le trajet",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteTrip = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("trips")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Trajet supprimé",
        description: "L'annonce a été supprimée avec succès",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le trajet",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTripStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "open" ? "closed" : "open";
    await updateTrip(id, { status: newStatus });
  };

  return {
    loading,
    createTrip,
    updateTrip,
    deleteTrip,
    toggleTripStatus,
  };
};
