import { useState, useEffect } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';
import { useReservations, CreateReservationInput } from '@/hooks/useReservations';
import { useEscrowPayments } from '@/hooks/useEscrowPayments';
import { useAuth } from '@/hooks/useAuth';
import { PAYMENT_METHODS, getAvailablePaymentMethods } from '@/lib/paymentRegions';

type PaymentMethod = keyof typeof PAYMENT_METHODS;
import { useToast } from '@/hooks/use-toast';
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
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, CreditCard, Package, Smartphone, Globe } from 'lucide-react';

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: {
    id: string;
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

interface PaymentFormProps {
  reservationData: CreateReservationInput;
  selectedPaymentMethod: string;
  availablePaymentMethods: any[];
  phoneNumber: string;
  onPaymentMethodChange: (method: string) => void;
  onPhoneNumberChange: (phone: string) => void;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  reservationData,
  selectedPaymentMethod,
  availablePaymentMethods,
  phoneNumber,
  onPaymentMethodChange,
  onPhoneNumberChange,
  onPaymentSuccess,
  onCancel,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const { calculateTotalFees, initiateEscrowPayment } = useEscrowPayments();
  const { toast } = useToast();

  // Calculer les frais uniquement si un moyen de paiement est sélectionné
  const paymentDetails = selectedPaymentMethod 
    ? calculateTotalFees(reservationData.total_amount, selectedPaymentMethod)
    : {
        subtotal: reservationData.total_amount,
        platformCommission: reservationData.total_amount * 0.05,
        paymentFees: 0,
        total: reservationData.total_amount * 1.05,
        travelerAmount: 0,
        platformRate: 0.05
      };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Vérifier que le moyen de paiement est sélectionné
    if (!selectedPaymentMethod) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un moyen de paiement',
        variant: 'destructive',
      });
      return;
    }

    // Pour Stripe, vérifier que Stripe est chargé (sauf en mode dev)
    const isDev = import.meta.env.DEV;
    if (!isDev && selectedPaymentMethod === PAYMENT_METHODS.STRIPE_CARD && (!stripe || !elements)) {
      toast({
        title: 'Erreur',
        description: 'Stripe n\'est pas encore chargé',
        variant: 'destructive',
      });
      return;
    }

    // Pour mobile money, vérifier le numéro de téléphone
    if (selectedPaymentMethod !== PAYMENT_METHODS.STRIPE_CARD && !phoneNumber) {
      toast({
        title: 'Numéro requis',
        description: 'Veuillez saisir votre numéro de téléphone',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);

    try {
      const result = await initiateEscrowPayment({
        reservation_id: reservationData.trip_id,
        amount: reservationData.total_amount,
        currency: 'EUR',
        payment_method: selectedPaymentMethod,
        phone_number: phoneNumber || undefined,
        traveler_id: 'traveler-id',
        customer_id: 'customer-id',
      });

      if (isDev) {
        toast({
          title: '✅ Paiement simulé (Mode DEV)',
          description: `Paiement de ${paymentDetails.total.toFixed(2)}€ simulé avec succès`,
        });
      }
      
      onPaymentSuccess();
    } catch (error: any) {
      // L'erreur est déjà gérée dans le hook
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handlePayment} className="space-y-6">
      {/* Sélection du moyen de paiement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Moyen de paiement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedPaymentMethod || ''} onValueChange={onPaymentMethodChange}>
            <div className="space-y-3">
              {availablePaymentMethods.map((method) => (
                <div key={method.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={method.id} id={method.id} />
                  <Label htmlFor={method.id} className="flex items-center gap-2 cursor-pointer flex-1">
                    {method.id === PAYMENT_METHODS.STRIPE_CARD ? (
                      <CreditCard className="h-4 w-4" />
                    ) : (
                      <Smartphone className="h-4 w-4" />
                    )}
                    <span>{method.name}</span>
                    <Badge variant="outline" className="ml-auto">
                      {method.fees?.percentage || 0}%
                    </Badge>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Champ pour mobile money */}
      {selectedPaymentMethod && selectedPaymentMethod !== PAYMENT_METHODS.STRIPE_CARD && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Numéro de téléphone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="tel"
              placeholder="+221 77 123 45 67"
              value={phoneNumber}
              onChange={(e) => onPhoneNumberChange(e.target.value)}
              required
            />
            {import.meta.env.DEV && (
              <p className="text-sm text-muted-foreground">
                🔧 Mode DEV: Le paiement sera simulé
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Carte bancaire Stripe */}
      {selectedPaymentMethod === PAYMENT_METHODS.STRIPE_CARD && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Informations de carte
            </CardTitle>
          </CardHeader>
          <CardContent>
            {import.meta.env.DEV ? (
              <div className="p-4 border border-dashed rounded-md bg-amber-50">
                <p className="text-sm text-amber-800">
                  <strong>🔧 Mode Développement</strong><br />
                  Le paiement sera simulé. En production, un formulaire de carte bancaire Stripe sera affiché ici.
                </p>
              </div>
            ) : (
              <div className="p-4 border rounded-md">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                          color: '#aab7c4',
                        },
                      },
                    },
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Récapitulatif du paiement</span>
            {import.meta.env.DEV && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                MODE DEV
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Réservation ({reservationData.weight_kg} kg)</span>
            <span>{paymentDetails.subtotal.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Frais de service (3%)</span>
            <span>{paymentDetails.platformCommission.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Frais de paiement</span>
            <span>{paymentDetails.paymentFees.toFixed(2)}€</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{paymentDetails.total.toFixed(2)}€</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={processing}
          className="flex-1"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={processing || !selectedPaymentMethod || (selectedPaymentMethod === PAYMENT_METHODS.STRIPE_CARD && !stripe)}
          className="flex-1"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Traitement...
            </>
          ) : (
            `Payer ${paymentDetails.total.toFixed(2)}€`
          )}
        </Button>
      </div>
    </form>
  );
};

export const BookingDialog: React.FC<BookingDialogProps> = ({
  open,
  onOpenChange,
  trip,
}) => {
  const { user } = useAuth();
  const { createReservation, loading } = useReservations();
  const { toast } = useToast();
  const { initiateEscrowPayment } = useEscrowPayments();

  // Calculer les moyens de paiement disponibles
  const availablePaymentMethods = getAvailablePaymentMethods(trip.from_country.toLowerCase());
  
  const [step, setStep] = useState<'booking' | 'payment'>('booking');
  const [isPending, setIsPending] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [weightKg, setWeightKg] = useState(1);
  const [message, setMessage] = useState('');
  const [reservationData, setReservationData] = useState<CreateReservationInput | null>(null);
  const [formData, setFormData] = useState({
    pickup_address: '',
    pickup_phone: '',
    pickup_name: '',
    pickup_date: '',
    pickup_time: '',
    special_instructions: ''
  });

  // Passer à l'étape paiement quand reservationData est défini
  useEffect(() => {
    if (reservationData && step === 'booking') {
      setStep('payment');
    }
  }, [reservationData, step]);

  const pricePerKg = trip.price_expect || 10; // Prix par défaut si non spécifié
  const totalAmount = weightKg * pricePerKg;

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Veuillez vous connecter pour réserver',
        variant: 'destructive',
      });
      return;
    }

    if (weightKg > trip.capacity_available_kg) {
      toast({
        title: 'Capacité insuffisante',
        description: `Seulement ${trip.capacity_available_kg}kg disponibles`,
        variant: 'destructive',
      });
      return;
    }

    const bookingData: CreateReservationInput = {
      trip_id: trip.id,
      weight_kg: weightKg,
      price_per_kg: pricePerKg,
      total_amount: totalAmount,
      message: message.trim() || undefined,
    };

    // Le passage à l'étape paiement se fait via useEffect
    setReservationData(bookingData);
  };

  const handlePaymentSuccess = async () => {
    if (!reservationData) return;

    const isDev = import.meta.env.DEV;

    try {
      await createReservation(reservationData);
      toast({
        title: isDev ? '✅ Réservation créée (Mode DEV)' : 'Réservation confirmée',
        description: isDev 
          ? 'Paiement simulé - Votre réservation a été créée pour tester le système'
          : 'Votre réservation a été confirmée et le paiement a été traité',
      });
      onOpenChange(false);
      setStep('booking');
      setWeightKg(1);
      setMessage('');
      setReservationData(null);
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
    }
  };

  const handleCancel = () => {
    if (step === 'payment') {
      setStep('booking');
      setReservationData(null);
    } else {
      onOpenChange(false);
    }
  };

  // Reset l'état quand le dialogue se ferme
  useEffect(() => {
    if (!open) {
      setStep('booking');
      setWeightKg(1);
      setMessage('');
      setReservationData(null);
      setSelectedPaymentMethod(null);
      setPhoneNumber('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {step === 'booking' ? 'Réserver de la capacité' : 'Paiement'}
          </DialogTitle>
          <DialogDescription>
            {step === 'booking' ? (
              `${trip.from_city}, ${trip.from_country} → ${trip.to_city}, ${trip.to_country}`
            ) : (
              'Finalisez votre réservation'
            )}
          </DialogDescription>
        </DialogHeader>

        {step === 'booking' ? (
          <form onSubmit={handleBookingSubmit} className="space-y-4">
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Voyageur</span>
                    <span className="font-medium">{trip.profiles?.full_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Capacité disponible</span>
                    <span className="font-medium">{trip.capacity_available_kg} kg</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Prix par kg</span>
                    <span className="font-medium">{pricePerKg}€</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="weight">Poids à réserver (kg)</Label>
              <Input
                id="weight"
                type="number"
                min="0.1"
                max={trip.capacity_available_kg}
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message au voyageur (optionnel)</Label>
              <Textarea
                id="message"
                placeholder="Décrivez votre colis, vos préférences de livraison..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total</span>
                <span className="text-lg font-bold">{totalAmount.toFixed(2)}€</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  'Continuer vers le paiement'
                )}
              </Button>
            </div>
          </form>
        ) : (
          reservationData && (
            <Elements stripe={stripePromise}>
              <PaymentForm
                reservationData={reservationData}
                selectedPaymentMethod={selectedPaymentMethod}
                availablePaymentMethods={availablePaymentMethods}
                phoneNumber={phoneNumber}
                onPaymentMethodChange={setSelectedPaymentMethod}
                onPhoneNumberChange={setPhoneNumber}
                onPaymentSuccess={handlePaymentSuccess}
                onCancel={handleCancel}
              />
            </Elements>
          )
        )}
      </DialogContent>
    </Dialog>
  );
};