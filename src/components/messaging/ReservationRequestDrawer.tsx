import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Package, DollarSign, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
} from "@/components/ui/responsive-modal";

interface Trip {
  id: string;
  from_city: string;
  to_city: string;
  date_departure: string;
  price_per_kg: number;
  capacity_available_kg: number;
  user_id: string;
}

interface ReservationRequestDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: Trip;
  threadId: string;
  onSuccess?: () => void;
}

export function ReservationRequestDrawer({
  open,
  onOpenChange,
  trip,
  threadId,
  onSuccess,
}: ReservationRequestDrawerProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // États pour les inputs
  const [kilos, setKilos] = useState(1);
  const [pricePerKg, setPricePerKg] = useState(trip.price_per_kg);

  // Calculer le prix total
  const totalPrice = kilos * pricePerKg;

  // Limites
  const minKilos = 0.5;
  const maxKilos = Math.min(trip.capacity_available_kg, 30); // Max 30kg ou capacité disponible

  // Réinitialiser les valeurs quand le drawer s'ouvre
  useEffect(() => {
    if (open) {
      setKilos(Math.min(5, maxKilos)); // Par défaut 5kg
      setPricePerKg(trip.price_per_kg);
    }
  }, [open, trip.price_per_kg, maxKilos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (kilos <= 0 || kilos > maxKilos) {
      toast({
        title: "Erreur",
        description: `Veuillez choisir entre ${minKilos} et ${maxKilos} kg`,
        variant: "destructive",
      });
      return;
    }

    if (totalPrice <= 0) {
      toast({
        title: "Erreur",
        description: "Le prix doit être positif",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // @ts-ignore - Function exists in DB but not in types yet
      const { error } = await supabase.rpc("create_reservation_request", {
        p_thread_id: threadId,
        p_trip_id: trip.id,
        p_kilos: kilos,
        p_price: totalPrice,
      });

      if (error) throw error;

      toast({
        title: "Demande envoyée",
        description: "Le conducteur recevra une notification",
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || error.hint || "Impossible d'envoyer la demande",
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
          <ResponsiveModalTitle>Réserver des kilos</ResponsiveModalTitle>
          <ResponsiveModalDescription>
            Envoyez une demande de réservation au conducteur
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-4">
          {/* Récapitulatif du trajet */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Trajet</span>
              <span className="font-medium">
                {trip.from_city} → {trip.to_city}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium">
                {new Date(trip.date_departure).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Capacité disponible</span>
              <span className="font-medium">{trip.capacity_available_kg} kg</span>
            </div>
          </div>

          {/* Sélection des kilos */}
          <div className="space-y-3">
            <Label htmlFor="kilos" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="uppercase text-xs font-semibold tracking-wide">
                Nombre de kilos
              </span>
            </Label>
            
            {/* Slider */}
            <Slider
              id="kilos"
              min={minKilos}
              max={maxKilos}
              step={0.5}
              value={[kilos]}
              onValueChange={(value) => setKilos(value[0])}
              className="mb-2"
            />

            {/* Input numérique */}
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={minKilos}
                max={maxKilos}
                step={0.5}
                value={kilos}
                onChange={(e) => setKilos(parseFloat(e.target.value) || 0)}
                className="text-center text-lg font-bold"
              />
              <span className="text-sm text-muted-foreground">kg</span>
            </div>
          </div>

          {/* Prix par kg (modifiable) */}
          <div className="space-y-3">
            <Label htmlFor="price-per-kg" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="uppercase text-xs font-semibold tracking-wide">
                Prix par kg
              </span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="price-per-kg"
                type="number"
                min={0}
                step={0.1}
                value={pricePerKg}
                onChange={(e) => setPricePerKg(parseFloat(e.target.value) || 0)}
                className="text-center text-lg font-bold"
              />
              <span className="text-sm text-muted-foreground">€/kg</span>
            </div>
            {pricePerKg !== trip.price_per_kg && (
              <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>
                  Vous proposez un prix différent ({pricePerKg} €/kg au lieu de{" "}
                  {trip.price_per_kg} €/kg). Le conducteur pourra accepter ou faire une contre-offre.
                </p>
              </div>
            )}
          </div>

          {/* Prix total calculé */}
          <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Prix total</span>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {!isNaN(totalPrice) && isFinite(totalPrice) ? totalPrice.toFixed(2) : '0.00'} €
                </div>
                <div className="text-xs text-muted-foreground">
                  {kilos} kg × {pricePerKg} €/kg
                </div>
              </div>
            </div>
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
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Envoi..." : "Envoyer la demande"}
            </Button>
          </ResponsiveModalFooter>
        </form>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
