import { useState } from 'react';
import { useEscrowPayments } from '@/hooks/useEscrowPayments';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  Package, 
  Camera, 
  AlertTriangle,
  Euro,
  Loader2 
} from 'lucide-react';

interface DeliveryConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: {
    id: string;
    weight_kg: number;
    total_amount: number;
    traveler_payout_amount: number;
    platform_commission_amount: number;
    currency: string;
    trips?: {
      from_city: string;
      from_country: string;
      to_city: string;
      to_country: string;
      profiles?: {
        full_name: string;
      };
    };
  };
  onConfirmed: () => void;
}

export const DeliveryConfirmationDialog: React.FC<DeliveryConfirmationDialogProps> = ({
  open,
  onOpenChange,
  reservation,
  onConfirmed,
}) => {
  const { confirmDeliveryAndReleaseFunds, processing } = useEscrowPayments();
  const { toast } = useToast();
  
  const [confirmationCode, setConfirmationCode] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [agreedToRelease, setAgreedToRelease] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Fichier trop volumineux',
          description: `${file.name} dépasse 5 Mo`,
          variant: 'destructive',
        });
        return false;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast({
          title: 'Format invalide',
          description: `${file.name} n'est pas au format jpg, png ou webp`,
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });

    setPhotos([...photos, ...validFiles].slice(0, 3)); // Max 3 photos
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleConfirmDelivery = async () => {
    if (!agreedToRelease) {
      toast({
        title: 'Confirmation requise',
        description: 'Vous devez confirmer que vous avez bien reçu votre colis',
        variant: 'destructive',
      });
      return;
    }

    try {
      await confirmDeliveryAndReleaseFunds({
        reservation_id: reservation.id,
        confirmation_code: confirmationCode.trim() || undefined,
        notes: notes.trim() || undefined,
        delivery_photos: photos.length > 0 ? photos : undefined,
      });

      onConfirmed();
      onOpenChange(false);
      
      // Réinitialiser le formulaire
      setConfirmationCode('');
      setNotes('');
      setPhotos([]);
      setAgreedToRelease(false);
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            Confirmer la réception
          </DialogTitle>
          <DialogDescription>
            Confirmez que vous avez bien reçu votre colis pour libérer le paiement au voyageur
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Récapitulatif de la réservation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Détails de la réservation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Trajet</span>
                <span className="text-right">
                  {reservation.trips?.from_city}, {reservation.trips?.from_country} →{' '}
                  {reservation.trips?.to_city}, {reservation.trips?.to_country}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Voyageur</span>
                <span>{reservation.trips?.profiles?.full_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Poids</span>
                <span>{reservation.weight_kg} kg</span>
              </div>
            </CardContent>
          </Card>

          {/* Répartition des montants */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Euro className="h-4 w-4" />
                Répartition du paiement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Montant total payé</span>
                <span className="font-medium">{reservation.total_amount}€</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Commission kilimeet</span>
                <span>{reservation.platform_commission_amount}€</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Versement au voyageur</span>
                <span className="font-medium text-green-600">
                  {reservation.traveler_payout_amount}€
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Code de confirmation optionnel */}
          <div className="space-y-2">
            <Label htmlFor="confirmation-code">
              Code de confirmation (optionnel)
            </Label>
            <Input
              id="confirmation-code"
              placeholder="Si le voyageur vous a donné un code..."
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
            />
          </div>

          {/* Photos de preuve (optionnel) */}
          <div className="space-y-2">
            <Label>Photos de réception (optionnel)</Label>
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors"
              >
                <Camera className="h-5 w-5" />
                <span className="text-sm">Ajouter des photos (max 3)</span>
              </label>
              
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-20 object-cover rounded"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0"
                        onClick={() => removePhoto(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notes optionnelles */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Commentaires sur la livraison..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Avertissement important */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-amber-800">
                  Attention - Action irréversible
                </h4>
                <p className="text-sm text-amber-700">
                  Une fois confirmée, cette action libérera immédiatement {reservation.traveler_payout_amount}€ au voyageur. 
                  Assurez-vous d'avoir bien reçu votre colis avant de continuer.
                </p>
              </div>
            </div>
          </div>

          {/* Checkbox de confirmation */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="agree-release"
              checked={agreedToRelease}
              onChange={(e) => setAgreedToRelease(e.target.checked)}
              className="mt-1"
            />
            <Label htmlFor="agree-release" className="text-sm leading-relaxed">
              Je confirme avoir reçu mon colis en bon état et accepte que le paiement soit libéré au voyageur
            </Label>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={processing}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleConfirmDelivery}
              disabled={processing || !agreedToRelease}
              className="flex-1"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Confirmation...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmer la réception
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};