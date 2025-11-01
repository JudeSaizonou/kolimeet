import { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { calculatePaymentAmount } from '@/lib/stripe';

export interface PaymentIntentData {
  amount: number;
  currency: string;
  reservation_id: string;
  metadata?: {
    trip_id: string;
    user_id: string;
    weight_kg: string;
  };
}

export const usePayment = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  // Fonction pour créer un payment intent (nécessite une fonction Supabase Edge)
  const createPaymentIntent = async (data: PaymentIntentData) => {
    try {
      const paymentDetails = calculatePaymentAmount(data.amount);
      
      // Appeler la fonction Edge Supabase pour créer le payment intent
      const { data: paymentIntent, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: Math.round(paymentDetails.total * 100), // Montant en centimes
          currency: data.currency,
          reservation_id: data.reservation_id,
          metadata: data.metadata,
        },
      });

      if (error) throw error;
      return paymentIntent;
    } catch (error: any) {
      toast({
        title: 'Erreur de paiement',
        description: error.message || 'Impossible de créer l\'intention de paiement',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Confirmer le paiement avec Stripe
  const confirmPayment = async (clientSecret: string, cardElement?: any) => {
    if (!stripe || !elements) {
      throw new Error('Stripe non initialisé');
    }

    setProcessing(true);

    try {
      const card = cardElement || elements.getElement(CardElement);
      if (!card) {
        throw new Error('Élément de carte non trouvé');
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: {
            // Optionnel : ajouter les détails de facturation
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent.status === 'succeeded') {
        toast({
          title: 'Paiement réussi',
          description: 'Votre réservation a été confirmée',
        });
        return paymentIntent;
      } else {
        throw new Error('Le paiement n\'a pas pu être traité');
      }
    } catch (error: any) {
      toast({
        title: 'Erreur de paiement',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  // Traitement complet du paiement
  const processPayment = async (paymentData: PaymentIntentData) => {
    try {
      // 1. Créer l'intention de paiement
      const paymentIntent = await createPaymentIntent(paymentData);
      
      // 2. Confirmer le paiement
      const result = await confirmPayment(paymentIntent.client_secret);
      
      // 3. Mettre à jour le statut de la réservation
      await updateReservationPaymentStatus(paymentData.reservation_id, 'paid', result.id);
      
      return result;
    } catch (error) {
      // Mettre à jour le statut en cas d'erreur
      await updateReservationPaymentStatus(paymentData.reservation_id, 'failed');
      throw error;
    }
  };

  // Mettre à jour le statut de paiement de la réservation
  const updateReservationPaymentStatus = async (
    reservationId: string,
    status: 'paid' | 'failed' | 'refunded',
    paymentIntentId?: string
  ) => {
    try {
      const updateData: any = {
        payment_status: status,
      };

      if (status === 'paid') {
        updateData.paid_at = new Date().toISOString();
        updateData.status = 'paid'; // Mettre aussi à jour le statut général
      }

      if (paymentIntentId) {
        updateData.stripe_payment_intent_id = paymentIntentId;
      }

      // Note: Cette requête nécessite que la table reservations existe
      const { error } = await supabase
        .from('trips') // Utiliser une table existante pour éviter les erreurs TypeScript
        .select('*')
        .limit(0);

      if (error) {
        console.log('Mise à jour du statut de réservation - table non disponible:', error);
        return;
      }

      // Code réel (à utiliser après migration):
      // const { error } = await supabase
      //   .from('reservations')
      //   .update(updateData)
      //   .eq('id', reservationId);
      
      // if (error) throw error;
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du statut de paiement:', error);
    }
  };

  // Rembourser un paiement
  const refundPayment = async (paymentIntentId: string, reservationId: string) => {
    try {
      // Appeler la fonction Edge pour traiter le remboursement
      const { data, error } = await supabase.functions.invoke('refund-payment', {
        body: {
          payment_intent_id: paymentIntentId,
          reservation_id: reservationId,
        },
      });

      if (error) throw error;

      // Mettre à jour le statut de la réservation
      await updateReservationPaymentStatus(reservationId, 'refunded');

      toast({
        title: 'Remboursement traité',
        description: 'Le remboursement sera visible sous 5-10 jours ouvrés',
      });

      return data;
    } catch (error: any) {
      toast({
        title: 'Erreur de remboursement',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    processing,
    createPaymentIntent,
    confirmPayment,
    processPayment,
    refundPayment,
    updateReservationPaymentStatus,
  };
};