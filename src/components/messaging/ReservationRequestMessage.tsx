import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, DollarSign, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CounterOfferDrawer } from "./CounterOfferDrawer";
import type { ReservationRequest } from "@/integrations/supabase/types";

interface ReservationRequestMessageProps {
  request: ReservationRequest;
  onUpdate?: () => void;
}

export function ReservationRequestMessage({ request, onUpdate }: ReservationRequestMessageProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [counterOfferOpen, setCounterOfferOpen] = useState(false);

  const isDriver = user?.id === request.driver_id;
  const isRequester = user?.id === request.requester_id;
  
  // Log pour debug
  console.log('[ReservationRequest] User:', user?.id);
  console.log('[ReservationRequest] Driver ID:', request.driver_id);
  console.log('[ReservationRequest] Requester ID:', request.requester_id);
  console.log('[ReservationRequest] isDriver:', isDriver, 'isRequester:', isRequester);
  console.log('[ReservationRequest] Status:', request.status);

  // Fonctions d'action
  const handleAccept = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // @ts-ignore - Function exists in DB but not in types yet
      const { error } = await supabase.rpc("accept_reservation_request", {
        p_request_id: request.id,
      });

      if (error) throw error;

      toast({
        title: "Demande acceptée",
        description: "Une réservation a été créée",
      });

      onUpdate?.();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // @ts-ignore - Function exists in DB but not in types yet
      const { error } = await supabase.rpc("decline_reservation_request", {
        p_request_id: request.id,
      });

      if (error) throw error;

      toast({
        title: "Demande refusée",
        description: "Le demandeur a été notifié",
      });

      onUpdate?.();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // @ts-ignore - Function exists in DB but not in types yet
      const { error } = await supabase.rpc("cancel_reservation_request", {
        p_request_id: request.id,
      });

      if (error) throw error;

      toast({
        title: "Demande annulée",
        description: "Votre demande a été annulée",
      });

      onUpdate?.();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Badges de statut
  const getStatusBadge = () => {
    const badges = {
      pending: { label: "En attente", variant: "secondary" as const },
      accepted: { label: "Acceptée", variant: "default" as const },
      declined: { label: "Refusée", variant: "destructive" as const },
      counter_offered: { label: "Contre-proposition", variant: "outline" as const },
      cancelled: { label: "Annulée", variant: "outline" as const },
    };

    const badge = badges[request.status];
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  // Type de demande
  const isCounterOffer = !!request.parent_request_id;

  return (
    <div
      className={cn(
        "my-4 rounded-lg border-l-4 p-4 animate-in slide-in-from-bottom-2",
        request.status === "pending"
          ? "bg-primary/5 border-primary"
          : request.status === "accepted"
          ? "bg-green-50 border-green-500"
          : request.status === "declined"
          ? "bg-red-50 border-red-500"
          : "bg-muted/50 border-muted"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {isCounterOffer ? (
            <MessageSquare className="h-5 w-5 text-primary" />
          ) : (
            <Package className="h-5 w-5 text-primary" />
          )}
          <span className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            {isCounterOffer ? "Contre-proposition" : "Demande de réservation"}
          </span>
        </div>
        {getStatusBadge()}
      </div>

      {/* Body - Détails */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{request.kilos_requested} kg</span>
        </div>

        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="font-bold text-lg">{request.price_offered} €</span>
          <span className="text-sm text-muted-foreground">
            ({request.price_per_kg.toFixed(2)} €/kg)
          </span>
        </div>

        {/* Justification pour les contre-offres */}
        {request.justification && (
          <div className="mt-2 p-2 bg-background/50 rounded border text-sm">
            <p className="text-muted-foreground italic">"{request.justification}"</p>
          </div>
        )}

        {/* Date */}
        <p className="text-xs text-muted-foreground mt-2">
          {new Date(request.created_at).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {/* Footer - Boutons d'action */}
      {request.status === "pending" && (
        <div className="flex gap-2 flex-wrap">
          {isDriver && (
            <>
              <Button
                onClick={handleAccept}
                disabled={loading}
                size="sm"
                className="flex-1 min-w-[100px] h-11"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Accepter
              </Button>
              <Button
                onClick={() => setCounterOfferOpen(true)}
                disabled={loading}
                variant="outline"
                size="sm"
                className="flex-1 min-w-[100px] h-11"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Contre-offre
              </Button>
              <Button
                onClick={handleDecline}
                disabled={loading}
                variant="destructive"
                size="sm"
                className="flex-1 min-w-[100px] h-11"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Refuser
              </Button>
            </>
          )}

          {isRequester && (
            <Button
              onClick={handleCancel}
              disabled={loading}
              variant="outline"
              size="sm"
              className="w-full h-11"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Annuler la demande
            </Button>
          )}
        </div>
      )}

      {/* Messages de statut final */}
      {request.status === "accepted" && (
        <div className="flex items-center gap-2 text-green-700 font-medium">
          <CheckCircle className="h-5 w-5" />
          <span>Réservation créée avec succès</span>
        </div>
      )}

      {request.status === "declined" && (
        <div className="flex items-center gap-2 text-red-700 font-medium">
          <XCircle className="h-5 w-5" />
          <span>Demande refusée</span>
        </div>
      )}

      {request.status === "cancelled" && (
        <div className="flex items-center gap-2 text-muted-foreground font-medium">
          <XCircle className="h-5 w-5" />
          <span>Demande annulée</span>
        </div>
      )}

      {/* Drawer de contre-offre */}
      {isDriver && (
        <CounterOfferDrawer
          open={counterOfferOpen}
          onOpenChange={setCounterOfferOpen}
          request={request}
          onSuccess={() => {
            setCounterOfferOpen(false);
            onUpdate?.();
          }}
        />
      )}
    </div>
  );
}
