import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, CheckCircle, XCircle, MessageSquare, Loader2, ArrowRight } from "lucide-react";
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
  const isCounterOffer = request.status === 'counter_offered';
  const isCounterOfferMessage = !!request.parent_request_id;

  const handleAccept = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const rpcFunction = isCounterOffer ? "accept_counter_offer" : "accept_reservation_request";
      // @ts-ignore
      const { error } = await supabase.rpc(rpcFunction, { p_request_id: request.id });
      if (error) throw error;
      toast({ title: isCounterOffer ? "Contre-offre acceptée" : "Demande acceptée" });
      onUpdate?.();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const rpcFunction = isCounterOffer ? "decline_counter_offer" : "decline_reservation_request";
      // @ts-ignore
      const { error } = await supabase.rpc(rpcFunction, { p_request_id: request.id });
      if (error) throw error;
      toast({ title: isCounterOffer ? "Contre-offre refusée" : "Demande refusée" });
      onUpdate?.();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // @ts-ignore
      const { error } = await supabase.rpc("cancel_reservation_request", { p_request_id: request.id });
      if (error) throw error;
      toast({ title: "Demande annulée" });
      onUpdate?.();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Styles selon le statut
  const statusStyles = {
    pending: "bg-white border-slate-200",
    accepted: "bg-emerald-50/80 border-emerald-200",
    declined: "bg-rose-50/80 border-rose-200",
    counter_offered: "bg-amber-50/80 border-amber-200",
    cancelled: "bg-slate-50 border-slate-200",
  };

  const statusConfig = {
    pending: { label: "En attente", bg: "bg-slate-100", text: "text-slate-600" },
    accepted: { label: "Acceptée", bg: "bg-emerald-100", text: "text-emerald-700" },
    declined: { label: "Refusée", bg: "bg-rose-100", text: "text-rose-700" },
    counter_offered: { label: "Contre-offre", bg: "bg-amber-100", text: "text-amber-700" },
    cancelled: { label: "Annulée", bg: "bg-slate-100", text: "text-slate-500" },
  };

  const status = statusConfig[request.status];

  return (
    <div className={cn(
      "my-3 rounded-2xl border shadow-sm overflow-hidden",
      statusStyles[request.status]
    )}>
      {/* Header compact */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            isCounterOfferMessage ? "bg-amber-100" : "bg-primary/10"
          )}>
            {isCounterOfferMessage ? (
              <MessageSquare className="h-4 w-4 text-amber-600" />
            ) : (
              <Package className="h-4 w-4 text-primary" />
            )}
          </div>
          <span className="font-medium text-sm text-slate-700">
            {isCounterOfferMessage ? "Contre-offre" : "Réservation"}
          </span>
        </div>
        <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", status.bg, status.text)}>
          {status.label}
        </span>
      </div>

      {/* Contenu principal - Design compact */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Kilos + Prix */}
          <div className="flex items-center gap-4">
            <div>
              <p className="text-2xl font-bold text-slate-900">{request.kilos_requested}<span className="text-base font-medium text-slate-400 ml-0.5">kg</span></p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-300" />
            <div>
              <p className="text-2xl font-bold text-slate-900">{request.price_offered}<span className="text-base font-medium text-slate-400 ml-0.5">€</span></p>
              <p className="text-xs text-slate-400">{request.price_per_kg?.toFixed(2)}€/kg</p>
            </div>
          </div>
        </div>

        {/* Justification */}
        {request.justification && (
          <p className="mt-3 text-sm text-slate-600 italic bg-slate-50 rounded-lg px-3 py-2">
            "{request.justification}"
          </p>
        )}
      </div>

      {/* Actions - Statut pending */}
      {request.status === "pending" && (
        <div className="px-4 pb-4">
          {isDriver && (
            <div className="flex gap-2">
              <Button
                onClick={handleAccept}
                disabled={loading}
                size="sm"
                className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 rounded-xl"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1.5" />}
                Accepter
              </Button>
              <Button
                onClick={() => setCounterOfferOpen(true)}
                disabled={loading}
                variant="outline"
                size="sm"
                className="flex-1 h-10 rounded-xl border-slate-200"
              >
                <MessageSquare className="h-4 w-4 mr-1.5" />
                Négocier
              </Button>
              <Button
                onClick={handleDecline}
                disabled={loading}
                variant="ghost"
                size="sm"
                className="h-10 px-3 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          )}

          {isRequester && (
            <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
              <span className="text-sm text-slate-500">En attente de réponse...</span>
              <Button
                onClick={handleCancel}
                disabled={loading}
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-slate-500 hover:text-rose-600"
              >
                Annuler
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Actions - Contre-offre */}
      {request.status === "counter_offered" && (
        <div className="px-4 pb-4">
          {isRequester && (
            <div className="flex gap-2">
              <Button
                onClick={handleAccept}
                disabled={loading}
                size="sm"
                className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 rounded-xl"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1.5" />}
                Accepter
              </Button>
              <Button
                onClick={handleDecline}
                disabled={loading}
                variant="ghost"
                size="sm"
                className="h-10 px-4 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                Refuser
              </Button>
            </div>
          )}
          {isDriver && (
            <div className="bg-amber-50 rounded-xl px-3 py-2">
              <span className="text-sm text-amber-700">En attente de réponse à votre offre</span>
            </div>
          )}
        </div>
      )}

      {/* Statut final - Acceptée */}
      {request.status === "accepted" && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Réservation confirmée</span>
          </div>
        </div>
      )}

      {/* Statut final - Refusée */}
      {request.status === "declined" && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 text-rose-600">
            <XCircle className="h-5 w-5" />
            <span className="font-medium">Demande refusée</span>
          </div>
        </div>
      )}

      {/* Statut final - Annulée */}
      {request.status === "cancelled" && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 text-slate-500">
            <XCircle className="h-5 w-5" />
            <span className="font-medium">Demande annulée</span>
          </div>
        </div>
      )}

      {/* Drawer */}
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
