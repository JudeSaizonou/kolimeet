import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { ReservationRequest } from "@/integrations/supabase/types";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
} from "@/components/ui/responsive-modal";

interface CounterOfferDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: ReservationRequest;
  onSuccess?: () => void;
}

export function CounterOfferDrawer({
  open,
  onOpenChange,
  request,
  onSuccess,
}: CounterOfferDrawerProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // États
  const [newPricePerKg, setNewPricePerKg] = useState(request.price_per_kg);
  const [justification, setJustification] = useState("");

  // Calculer le nouveau prix total
  const newTotalPrice = request.kilos_requested * newPricePerKg;
  
  // Calcul de la différence
  const priceDifference = newTotalPrice - request.price_offered;
  const percentageChange = ((priceDifference / request.price_offered) * 100).toFixed(1);

  // Réinitialiser quand le drawer s'ouvre
  useEffect(() => {
    if (open) {
      setNewPricePerKg(request.price_per_kg);
      setJustification("");
    }
  }, [open, request.price_per_kg]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: le nouveau prix doit être différent
    if (newTotalPrice === request.price_offered) {
      toast({
        title: "Erreur",
        description: "Le prix proposé doit être différent du prix actuel",
        variant: "destructive",
      });
      return;
    }

    // Validation: le prix doit être positif
    if (newTotalPrice <= 0) {
      toast({
        title: "Erreur",
        description: "Le prix doit être positif",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.rpc("create_counter_offer", {
        p_request_id: request.id,
        p_new_price: newTotalPrice,
        p_justification: justification.trim() || null,
      });

      if (error) throw error;

      toast({
        title: "Contre-offre envoyée",
        description: "Le demandeur recevra une notification",
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer la contre-offre",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="max-w-md">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>Faire une contre-proposition</ResponsiveModalTitle>
          <ResponsiveModalDescription>
            Proposez un nouveau prix au demandeur
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-4">
          {/* Demande actuelle */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Kilos demandés</span>
              <span className="font-bold">{request.kilos_requested} kg</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Prix actuel proposé</span>
              <span className="font-bold line-through text-muted-foreground">
                {request.price_offered} € ({request.price_per_kg.toFixed(2)} €/kg)
              </span>
            </div>
          </div>

          {/* Nouveau prix par kg */}
          <div className="space-y-3">
            <Label htmlFor="new-price-per-kg" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="uppercase text-xs font-semibold tracking-wide">
                Votre prix par kg
              </span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="new-price-per-kg"
                type="number"
                min={0}
                step={0.1}
                value={newPricePerKg}
                onChange={(e) => setNewPricePerKg(parseFloat(e.target.value) || 0)}
                className="text-center text-lg font-bold"
              />
              <span className="text-sm text-muted-foreground">€/kg</span>
            </div>
          </div>

          {/* Nouveau prix total avec indicateur */}
          <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Nouveau prix total</span>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {newTotalPrice.toFixed(2)} €
                </div>
                <div className="text-xs text-muted-foreground">
                  {request.kilos_requested} kg × {newPricePerKg} €/kg
                </div>
              </div>
            </div>

            {/* Indicateur de changement */}
            {newTotalPrice !== request.price_offered && (
              <div
                className={`flex items-center gap-2 text-sm font-medium ${
                  priceDifference > 0 ? "text-green-700" : "text-red-700"
                }`}
              >
                {priceDifference > 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>
                  {priceDifference > 0 ? "+" : ""}
                  {priceDifference.toFixed(2)} € ({percentageChange}%)
                </span>
              </div>
            )}
          </div>

          {/* Justification (optionnelle) */}
          <div className="space-y-3">
            <Label htmlFor="justification" className="uppercase text-xs font-semibold tracking-wide">
              Justification <span className="text-muted-foreground">(optionnel)</span>
            </Label>
            <Textarea
              id="justification"
              placeholder="Expliquez pourquoi vous proposez ce prix..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={3}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {justification.length}/500 caractères
            </p>
          </div>

          {/* Footer avec boutons */}
          <ResponsiveModalFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading || newTotalPrice === request.price_offered} 
              className="flex-1"
            >
              {loading ? "Envoi..." : "Envoyer la contre-offre"}
            </Button>
          </ResponsiveModalFooter>
        </form>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
