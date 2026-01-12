import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Package, Calendar, MapPin, User, Weight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SimpleBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: {
    id: string;
    user_id: string;
    from_city: string;
    from_country: string;
    to_city: string;
    to_country: string;
    capacity_available_kg: number;
    price_expect?: number;
    date_departure: string;
    profiles?: {
      full_name: string;
    };
  };
}

export const SimpleBookingDialog: React.FC<SimpleBookingDialogProps> = ({
  open,
  onOpenChange,
  trip,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [weightKg, setWeightKg] = useState<number>(1);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Veuillez vous connecter pour réserver',
        variant: 'destructive',
      });
      return;
    }

    if (weightKg <= 0 || weightKg > trip.capacity_available_kg) {
      toast({
        title: 'Poids invalide',
        description: `Le poids doit être entre 1 et ${trip.capacity_available_kg} kg`,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Créer ou trouver un thread de conversation d'abord
      const { data: existingThread } = await supabase
        .from('threads')
        .select('id')
        .eq('related_id', trip.id)
        .eq('related_type', 'trip')
        .or(`created_by.eq.${user.id},other_user_id.eq.${user.id}`)
        .single();

      let threadId = existingThread?.id;

      if (!threadId) {
        const { data: newThread, error: threadError } = await supabase
          .from('threads')
          .insert({
            created_by: user.id,
            other_user_id: trip.user_id,
            related_id: trip.id,
            related_type: 'trip',
          })
          .select()
          .single();

        if (threadError) throw threadError;
        threadId = newThread.id;
      }

      // Calculer le prix total
      const totalPrice = weightKg * (trip.price_expect || 0);

      // Utiliser la RPC create_reservation_request qui gère tout automatiquement
      // (création de la demande + message + notifications)
      const { error } = await supabase.rpc("create_reservation_request", {
        p_thread_id: threadId,
        p_trip_id: trip.id,
        p_kilos: weightKg,
        p_price: totalPrice,
      });

      if (error) throw error;

      // Si l'utilisateur a ajouté un message personnalisé, l'envoyer aussi
      if (message && message.trim()) {
        await supabase
          .from('messages')
          .insert({
            thread_id: threadId,
            sender_id: user.id,
            content: message.trim(),
          });
      }

      toast({
        title: '✅ Réservation envoyée',
        description: 'Le voyageur a été notifié de votre demande',
      });

      onOpenChange(false);
      setWeightKg(1);
      setMessage('');
    } catch (error: any) {
      console.error('Erreur réservation:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la réservation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const estimatedPrice = weightKg * (trip.price_expect || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0">
        <form onSubmit={handleSubmit}>
          {/* Header compact */}
          <div className="px-5 pt-5 pb-4 border-b">
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Réserver des kilos
            </DialogTitle>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
              <span className="font-medium">{trip.from_city}</span>
              <span>→</span>
              <span className="font-medium">{trip.to_city}</span>
              <span className="mx-1">•</span>
              <span>{format(new Date(trip.date_departure), "d MMM", { locale: fr })}</span>
            </div>
          </div>

          <div className="px-5 py-4 space-y-4">
            {/* Poids disponible - Compact badge */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Disponible</span>
              <span className="font-semibold text-green-600">{trip.capacity_available_kg} kg</span>
            </div>

            {/* Input poids - Compact */}
            <div className="space-y-1.5">
              <Label htmlFor="weight" className="text-sm">Quantité (kg)</Label>
              <Input
                id="weight"
                type="number"
                min={1}
                max={trip.capacity_available_kg}
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="h-10"
              />
            </div>

            {/* Prix - Compact et visible */}
            {trip.price_expect && trip.price_expect > 0 && (
              <div className="flex items-center justify-between py-2 px-3 bg-primary/5 rounded-lg">
                <span className="text-sm text-muted-foreground">Prix total</span>
                <span className="text-lg font-bold text-primary">
                  {estimatedPrice.toFixed(2)} €
                </span>
              </div>
            )}

            {/* Message - Compact */}
            <div className="space-y-1.5">
              <Label htmlFor="message" className="text-sm">Message (optionnel)</Label>
              <Textarea
                id="message"
                placeholder="Décrivez votre besoin..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                className="resize-none text-sm"
              />
            </div>
          </div>

          {/* Footer compact */}
          <div className="px-5 py-3 bg-slate-50/50 border-t flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1 h-9"
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 h-9">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Envoi...
                </>
              ) : (
                'Envoyer'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
