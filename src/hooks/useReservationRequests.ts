import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { ReservationRequest } from "@/integrations/supabase/types";

interface UseReservationRequestsReturn {
  requests: ReservationRequest[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createRequest: (tripId: string, kilos: number, price: number) => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  cancelRequest: (requestId: string) => Promise<void>;
  createCounterOffer: (
    requestId: string,
    newPrice: number,
    justification?: string
  ) => Promise<void>;
}

/**
 * Hook pour gérer les demandes de réservation dans un thread
 * @param threadId - ID du thread de conversation
 */
export const useReservationRequests = (
  threadId: string | null
): UseReservationRequestsReturn => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ReservationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fonction pour récupérer les demandes
  const fetchRequests = async () => {
    if (!threadId || !user) {
      setRequests([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("reservation_requests")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setRequests(data || []);
    } catch (err) {
      console.error("Error fetching reservation requests:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les demandes au montage et quand threadId change
  useEffect(() => {
    fetchRequests();
  }, [threadId, user]);

  // Écouter les changements en temps réel
  useEffect(() => {
    if (!threadId || !user) return;

    const channel = supabase
      .channel(`reservation_requests:${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reservation_requests",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload: RealtimePostgresChangesPayload<ReservationRequest>) => {
          if (payload.eventType === "INSERT") {
            setRequests((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setRequests((prev) =>
              prev.map((req) => (req.id === payload.new.id ? payload.new : req))
            );
          } else if (payload.eventType === "DELETE") {
            setRequests((prev) => prev.filter((req) => req.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, user]);

  // Créer une demande de réservation
  const createRequest = async (tripId: string, kilos: number, price: number) => {
    if (!threadId) {
      throw new Error("Thread ID is required");
    }

    try {
      const { error } = await supabase.rpc("create_reservation_request", {
        p_thread_id: threadId,
        p_trip_id: tripId,
        p_kilos: kilos,
        p_price: price,
      });

      if (error) throw error;

      toast({
        title: "Demande envoyée",
        description: "Le conducteur recevra une notification",
      });

      await fetchRequests();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || err.hint || "Impossible de créer la demande",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Accepter une demande
  const acceptRequest = async (requestId: string) => {
    try {
      const { error } = await supabase.rpc("accept_reservation_request", {
        p_request_id: requestId,
      });

      if (error) throw error;

      toast({
        title: "Demande acceptée",
        description: "Une réservation a été créée",
      });

      await fetchRequests();
    } catch (err: any) {
      console.error("Error accepting reservation request:", err);
      toast({
        title: "Erreur",
        description: err.message || "Impossible d'accepter la demande",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Refuser une demande
  const declineRequest = async (requestId: string) => {
    try {
      const { error } = await supabase.rpc("decline_reservation_request", {
        p_request_id: requestId,
      });

      if (error) throw error;

      toast({
        title: "Demande refusée",
        description: "Le demandeur a été notifié",
      });

      await fetchRequests();
    } catch (err: any) {
      console.error("Error declining reservation request:", err);
      toast({
        title: "Erreur",
        description: err.message || "Impossible de refuser la demande",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Annuler une demande
  const cancelRequest = async (requestId: string) => {
    try {
      const { error } = await supabase.rpc("cancel_reservation_request", {
        p_request_id: requestId,
      });

      if (error) throw error;

      toast({
        title: "Demande annulée",
        description: "Votre demande a été annulée",
      });

      await fetchRequests();
    } catch (err: any) {
      console.error("Error cancelling reservation request:", err);
      toast({
        title: "Erreur",
        description: err.message || "Impossible d'annuler la demande",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Créer une contre-offre
  const createCounterOffer = async (
    requestId: string,
    newPrice: number,
    justification?: string
  ) => {
    try {
      const { error } = await supabase.rpc("create_counter_offer", {
        p_request_id: requestId,
        p_new_price: newPrice,
        p_justification: justification || null,
      });

      if (error) throw error;

      toast({
        title: "Contre-offre envoyée",
        description: "Le demandeur recevra une notification",
      });

      await fetchRequests();
    } catch (err: any) {
      console.error("Error creating counter offer:", err);
      toast({
        title: "Erreur",
        description: err.message || "Impossible de créer la contre-offre",
        variant: "destructive",
      });
      throw err;
    }
  };

  return {
    requests,
    loading,
    error,
    refetch: fetchRequests,
    createRequest,
    acceptRequest,
    declineRequest,
    cancelRequest,
    createCounterOffer,
  };
};
