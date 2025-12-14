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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Réserver des kilos
          </DialogTitle>
          <DialogDescription>
            Envoyez une demande de réservation au voyageur
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Résumé du trajet */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium">{trip.from_city}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-medium">{trip.to_city}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(trip.date_departure), "d MMMM yyyy", { locale: fr })}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{trip.profiles?.full_name || 'Voyageur'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Weight className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-medium">{trip.capacity_available_kg} kg disponibles</span>
            </div>
          </div>

          {/* Poids à réserver */}
          <div className="space-y-2">
            <Label htmlFor="weight">Poids à réserver (kg)</Label>
            <Input
              id="weight"
              type="number"
              min={1}
              max={trip.capacity_available_kg}
              value={weightKg}
              onChange={(e) => setWeightKg(Number(e.target.value))}
              className="text-lg font-medium"
            />
            <p className="text-xs text-muted-foreground">
              Maximum: {trip.capacity_available_kg} kg
            </p>
          </div>

          {/* Prix estimé */}
          {trip.price_expect && trip.price_expect > 0 && (
            <div className="bg-primary/5 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Prix estimé</span>
                <span className="text-xl font-bold text-primary">
                  {estimatedPrice.toFixed(2)} €
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {trip.price_expect}€/kg × {weightKg} kg
              </p>
            </div>
          )}

          {/* Message optionnel */}
          <div className="space-y-2">
            <Label htmlFor="message">Message (optionnel)</Label>
            <Textarea
              id="message"
              placeholder="Décrivez brièvement ce que vous souhaitez envoyer..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-4 w-4" />
                  Envoyer la demande
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
