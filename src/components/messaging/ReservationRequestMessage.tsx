import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, DollarSign, CheckCircle, XCircle, MessageSquare, Wallet, AlertCircle, Loader2 } from "lucide-react";
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

  // Déterminer si c'est une contre-offre
  const isCounterOffer = request.status === 'counter_offered';

  // Fonctions d'action
  const handleAccept = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Utiliser la bonne fonction selon le cas
      // - Pour une demande normale (pending) : seul le driver peut accepter
      // - Pour une contre-offre : seul le requester peut accepter
      const rpcFunction = isCounterOffer ? "accept_counter_offer" : "accept_reservation_request";
      
      // @ts-ignore - Function exists in DB but not in types yet
      const { error } = await supabase.rpc(rpcFunction, {
        p_request_id: request.id,
      });

      if (error) throw error;

      toast({
        title: isCounterOffer ? "Contre-offre acceptée" : "Demande acceptée",
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
      // Utiliser la bonne fonction selon le cas
      const rpcFunction = isCounterOffer ? "decline_counter_offer" : "decline_reservation_request";
      
      // @ts-ignore - Function exists in DB but not in types yet
      const { error } = await supabase.rpc(rpcFunction, {
        p_request_id: request.id,
      });

      if (error) throw error;

      toast({
        title: isCounterOffer ? "Contre-offre refusée" : "Demande refusée",
        description: isCounterOffer ? "Le voyageur a été notifié" : "Le demandeur a été notifié",
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

  // Type de demande (pour l'affichage - basé sur parent_request_id)
  const isCounterOfferMessage = !!request.parent_request_id;

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
          : request.status === "counter_offered"
          ? "bg-amber-50 border-amber-500"
          : "bg-muted/50 border-muted"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {isCounterOfferMessage ? (
            <MessageSquare className="h-5 w-5 text-primary" />
          ) : (
            <Package className="h-5 w-5 text-primary" />
          )}
          <span className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            {isCounterOfferMessage ? "Contre-proposition" : "Demande de réservation"}
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
                className="flex-1 min-w-[100px] h-11 bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
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
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Refuser
              </Button>
            </>
          )}

          {isRequester && (
            <div className="w-full space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>En attente de réponse du voyageur</span>
              </div>
              <Button
                onClick={handleCancel}
                disabled={loading}
                variant="outline"
                size="sm"
                className="w-full h-11"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Annuler la demande
              </Button>
            </div>
          )}

          {/* Si l'utilisateur n'est ni le driver ni le requester, afficher un message */}
          {!isDriver && !isRequester && (
            <div className="text-sm text-muted-foreground">
              Demande en cours de traitement
            </div>
          )}
        </div>
      )}

      {/* Boutons d'action pour les contre-offres */}
      {request.status === "counter_offered" && (
        <div className="flex gap-2 flex-wrap">
          {/* L'expéditeur peut accepter ou refuser la contre-offre */}
          {isRequester && (
            <>
              <Button
                onClick={handleAccept}
                disabled={loading}
                size="sm"
                className="flex-1 min-w-[100px] h-11 bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Accepter l'offre
              </Button>
              <Button
                onClick={handleDecline}
                disabled={loading}
                variant="destructive"
                size="sm"
                className="flex-1 min-w-[100px] h-11"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Refuser
              </Button>
            </>
          )}

          {/* Le voyageur voit un message d'attente */}
          {isDriver && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-2 w-full">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>En attente de réponse de l'expéditeur à votre contre-offre</span>
            </div>
          )}
        </div>
      )}

      {/* Messages de statut final - ACCEPTÉE */}
      {request.status === "accepted" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-700 font-medium">
            <CheckCircle className="h-5 w-5" />
            <span>Réservation confirmée !</span>
          </div>
          
          {/* Récapitulatif de la réservation */}
          <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 space-y-2">
            <div className="text-sm font-medium text-green-800 dark:text-green-200">
              Récapitulatif de la réservation
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Poids réservé :</div>
              <div className="font-medium">{request.kilos_requested} kg</div>
              <div className="text-muted-foreground">Prix total :</div>
              <div className="font-medium text-green-700">{request.price_offered} €</div>
            </div>
          </div>

          {/* Information sur la consignation */}
          <div className="flex items-start gap-2 text-sm bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
            <Wallet className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-blue-800 dark:text-blue-200">
                {isRequester ? "Prochaine étape : consignation" : "En attente de consignation"}
              </p>
              <p className="text-blue-600 dark:text-blue-300">
                {isRequester 
                  ? "Vous devrez effectuer la consignation du montant avant le transport. L'argent sera sécurisé et libéré au voyageur après la livraison."
                  : "L'expéditeur doit effectuer la consignation du montant. Vous serez notifié une fois le paiement sécurisé."
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {request.status === "declined" && (
        <div className="flex items-center gap-2 text-red-700 font-medium">
          <XCircle className="h-5 w-5" />
          <span>Demande refusée par le voyageur</span>
        </div>
      )}

      {request.status === "cancelled" && (
        <div className="flex items-center gap-2 text-muted-foreground font-medium">
          <XCircle className="h-5 w-5" />
          <span>Demande annulée par l'expéditeur</span>
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
