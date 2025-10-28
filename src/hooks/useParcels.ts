import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CreateParcelInput, UpdateParcelInput } from "@/lib/validations/parcels";
import { useNavigate } from "react-router-dom";

export const useParcels = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const uploadPhotos = async (files: File[]): Promise<string[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Non authentifié");

    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("parcels")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("parcels")
        .getPublicUrl(fileName);

      return publicUrl;
    });

    return Promise.all(uploadPromises);
  };

  const createParcel = async (data: CreateParcelInput, files?: File[]) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      let photoUrls: string[] = [];
      if (files && files.length > 0) {
        photoUrls = await uploadPhotos(files);
      }

      const { error } = await supabase.from("parcels").insert([{
        user_id: user.id,
        type: data.type,
        weight_kg: data.weight_kg,
        size: data.size,
        from_country: data.from_country,
        from_city: data.from_city,
        to_country: data.to_country,
        to_city: data.to_city,
        deadline: data.deadline,
        description: data.description,
        photos: photoUrls.length > 0 ? photoUrls : null,
      }]);

      if (error) throw error;

      toast({
        title: "Colis publié avec succès",
        description: "Votre annonce est maintenant visible",
      });
      navigate("/mes-annonces");
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de publier le colis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateParcel = async (id: string, data: UpdateParcelInput) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("parcels")
        .update(data)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Colis mis à jour",
        description: "Vos modifications ont été enregistrées",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le colis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteParcel = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("parcels")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Colis supprimé",
        description: "L'annonce a été supprimée avec succès",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le colis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleParcelStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "open" ? "closed" : "open";
    await updateParcel(id, { status: newStatus });
  };

  return {
    loading,
    createParcel,
    updateParcel,
    deleteParcel,
    toggleParcelStatus,
  };
};
