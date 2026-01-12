import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  isOwn?: boolean;
}

export function ReservationRequestMessage({ request, onUpdate, isOwn }: ReservationRequestMessageProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [counterOfferOpen, setCounterOfferOpen] = useState(false);
  const [parentRequest, setParentRequest] = useState<ReservationRequest | null>(null);
  const [loadingParent, setLoadingParent] = useState(false);

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

  // Récupérer la demande parente si c'est une contre-offre
  useEffect(() => {
    if (isCounterOfferMessage && request.parent_request_id) {
      setLoadingParent(true);
      supabase
        .from('reservation_requests')
        .select('*')
        .eq('id', request.parent_request_id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Erreur lors de la récupération de la demande parente:', error);
          } else {
            setParentRequest(data);
          }
        })
        .finally(() => setLoadingParent(false));
    }
  }, [isCounterOfferMessage, request.parent_request_id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "flex w-full mb-3",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "max-w-[86%] md:max-w-[440px] rounded-2xl border shadow-sm overflow-hidden",
        isOwn ? "bg-slate-50 border-slate-200" : statusStyles[request.status]
      )}>
        {/* Header ultra-compact avec badge seul */}
        <div className="px-3.5 py-2.5 bg-gradient-to-b from-white to-slate-50/50 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-6 h-6 rounded-lg flex items-center justify-center",
              request.status === "accepted" ? "bg-emerald-100" :
              request.status === "declined" ? "bg-rose-100" :
              request.status === "counter_offered" ? "bg-amber-100" :
              "bg-slate-100"
            )}>
              {isCounterOfferMessage ? (
                <MessageSquare className={cn(
                  "h-3.5 w-3.5",
                  request.status === "counter_offered" ? "text-amber-600" : "text-slate-500"
                )} />
              ) : (
                <Package className={cn(
                  "h-3.5 w-3.5",
                  request.status === "accepted" ? "text-emerald-600" :
                  request.status === "declined" ? "text-rose-600" :
                  "text-slate-500"
                )} />
              )}
            </div>
            <span className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full",
              status.bg, status.text
            )}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Contenu principal - Layout clair et hiérarchisé */}
        <div className="px-4 py-3.5">
          {/* Prix en grand - Information principale */}
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-slate-900">{request.price_offered}</span>
            <span className="text-base font-medium text-slate-500">€</span>
            {isCounterOfferMessage && parentRequest && (
              <span className="ml-1 text-sm text-slate-400 line-through">{parentRequest.price_offered}€</span>
            )}
          </div>

          {/* Détails secondaires - Ligne compacte */}
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span className="font-medium">{request.kilos_requested} kg</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">{request.price_per_kg?.toFixed(2)}€/kg</span>
          </div>

          {/* Justification si présente */}
          {request.justification && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-600 italic leading-relaxed">
                "{request.justification}"
              </p>
            </div>
          )}
        </div>

        {/* Actions - Statut pending */}
        {request.status === "pending" && (
          <div className="px-3.5 pb-3.5">
            {isDriver && (
              <div className="flex gap-2">
                <Button
                  onClick={handleAccept}
                  disabled={loading}
                  size="sm"
                  className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                    Accepter
                  </>}
                </Button>
                <Button
                  onClick={() => setCounterOfferOpen(true)}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="h-9 px-3"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </Button>
                <Button
                  onClick={handleDecline}
                  disabled={loading}
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 text-rose-600 hover:bg-rose-50"
                >
                  <XCircle className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {isRequester && (
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                <span className="text-xs text-slate-500">En attente...</span>
                <Button
                  onClick={handleCancel}
                  disabled={loading}
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-slate-500 hover:text-rose-600"
                >
                  Annuler
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Actions - Contre-offre */}
        {request.status === "counter_offered" && (
          <div className="px-3.5 pb-3.5">
            {isRequester && (
              <div className="flex gap-2">
                <Button
                  onClick={handleAccept}
                  disabled={loading}
                  size="sm"
                  className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                    Accepter
                  </>}
                </Button>
                <Button
                  onClick={handleDecline}
                  disabled={loading}
                  variant="ghost"
                  size="sm"
                  className="h-9 px-4 text-rose-600 hover:bg-rose-50"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1.5" />
                  Refuser
                </Button>
              </div>
            )}
            {isDriver && (
              <div className="bg-amber-50/50 rounded-lg px-3 py-2 text-center">
                <span className="text-xs text-amber-700 font-medium">En attente de réponse</span>
              </div>
            )}
          </div>
        )}

        {/* Statuts finaux - Version minimaliste */}
        {(request.status === "accepted" || request.status === "declined" || request.status === "cancelled") && (
          <div className="px-3.5 pb-2.5">
            <div className={cn(
              "flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium",
              request.status === "accepted" && "text-emerald-700 bg-emerald-50",
              request.status === "declined" && "text-rose-600 bg-rose-50",
              request.status === "cancelled" && "text-slate-500 bg-slate-50"
            )}>
              {request.status === "accepted" && <CheckCircle className="h-3.5 w-3.5" />}
              {(request.status === "declined" || request.status === "cancelled") && <XCircle className="h-3.5 w-3.5" />}
              <span>
                {request.status === "accepted" && "Confirmée"}
                {request.status === "declined" && "Refusée"}
                {request.status === "cancelled" && "Annulée"}
              </span>
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
    </motion.div>
  );
}
