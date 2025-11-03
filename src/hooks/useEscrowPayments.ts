import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  getAvailablePaymentMethods, 
  getRecommendedCurrency,
  calculateTotalFees,
  PAYMENT_METHODS 
} from '@/lib/paymentRegions';

export interface EscrowPaymentData {
  reservation_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  phone_number?: string; // Pour mobile money
  traveler_id: string;
  customer_id: string;
}

export interface DeliveryConfirmation {
  reservation_id: string;
  confirmation_code?: string;
  delivery_photos?: File[];
  notes?: string;
}

export const useEscrowPayments = () => {
  const [processing, setProcessing] = useState(false);
  const [userCountry, setUserCountry] = useState<string>('FR');
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<any[]>([]);
  const { toast } = useToast();

  // Détection automatique du pays (peut être amélioré avec une vraie API de géolocalisation)
  useEffect(() => {
    detectUserCountry();
  }, []);

  useEffect(() => {
    if (userCountry) {
      setAvailablePaymentMethods(getAvailablePaymentMethods(userCountry));
    }
  }, [userCountry]);

  const detectUserCountry = async () => {
    try {
      // Essayer de détecter via le profil utilisateur d'abord
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('country')
          .eq('user_id', user.id)
          .single();
        
        if (profile?.country) {
          setUserCountry(profile.country.toLowerCase());
          return;
        }
      }

      // Fallback: essayer de détecter via l'API de géolocalisation
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      setUserCountry(data.country_code?.toLowerCase() || 'fr');
    } catch (error) {
      console.log('Could not detect country, defaulting to FR:', error);
      setUserCountry('fr');
    }
  };

  // Initier un paiement en escrow
  const initiateEscrowPayment = async (paymentData: EscrowPaymentData) => {
    setProcessing(true);
    try {
      const fees = calculateTotalFees(
        paymentData.amount,
        paymentData.payment_method,
        paymentData.currency
      );

      // MODE DÉVELOPPEMENT: Simuler le paiement si les fonctions Edge ne sont pas disponibles
      const isDevelopment = import.meta.env.DEV;
      let paymentResult;

      if (isDevelopment) {
        // Simulation pour le développement
        console.log('🔧 MODE DEV: Simulation du paiement escrow', {
          amount: fees.total,
          method: paymentData.payment_method,
          currency: paymentData.currency,
          fees: fees
        });

        // Simuler une réponse de paiement réussie
        paymentResult = {
          data: {
            payment_intent_id: `sim_pi_${Date.now()}`,
            status: 'requires_capture',
            amount: Math.round(fees.total * 100),
            currency: paymentData.currency
          },
          error: null
        };

        // Attendre un peu pour simuler l'appel réseau
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // PRODUCTION: Utiliser les vraies fonctions Edge
        if (paymentData.payment_method === PAYMENT_METHODS.STRIPE_CARD) {
          // Utiliser Stripe pour les cartes
          paymentResult = await supabase.functions.invoke('create-payment-intent', {
            body: {
              amount: Math.round(fees.total * 100), // en centimes
              currency: paymentData.currency,
              reservation_id: paymentData.reservation_id,
              capture_method: 'manual', // Important: capture manuelle pour escrow
              metadata: {
                type: 'escrow_payment',
                traveler_id: paymentData.traveler_id,
                customer_id: paymentData.customer_id,
              }
            }
          });
        } else {
          // Utiliser Mobile Money pour les paiements africains
          paymentResult = await supabase.functions.invoke('mobile-money-payment', {
            body: {
              payment_method: paymentData.payment_method,
              amount: fees.total,
              currency: paymentData.currency,
              reservation_id: paymentData.reservation_id,
              phone_number: paymentData.phone_number,
              return_url: `${window.location.origin}/mes-reservations?success=true`,
              cancel_url: `${window.location.origin}/mes-reservations?cancelled=true`,
              webhook_url: `${process.env.VITE_SUPABASE_URL}/functions/v1/payment-webhook`
            }
          });
        }
      }

      if (paymentResult.error) {
        throw new Error(paymentResult.error.message || 'Erreur lors du paiement');
      }

      // Mettre à jour la réservation avec les informations d'escrow
      await updateReservationEscrowStatus(paymentData.reservation_id, 'held', {
        platform_commission_amount: fees.platformCommission,
        traveler_payout_amount: fees.travelerAmount,
        payment_method: paymentData.payment_method,
        currency: paymentData.currency
      });

      toast({
        title: 'Paiement initié',
        description: import.meta.env.DEV 
          ? '🔧 Paiement simulé en mode développement - Les fonds seraient normalement bloqués en escrow'
          : 'Vos fonds sont sécurisés et seront libérés à la livraison',
      });

      if (import.meta.env.DEV) {
        console.log('✅ Simulation de paiement escrow réussie:', {
          reservation_id: paymentData.reservation_id,
          amount: fees.total,
          currency: paymentData.currency,
          method: paymentData.payment_method,
          breakdown: {
            subtotal: fees.subtotal,
            platformCommission: fees.platformCommission,
            paymentFees: fees.paymentFees,
            travelerWillReceive: fees.travelerAmount
          }
        });
      }

      return paymentResult.data;
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

  // Confirmer la livraison et libérer les fonds
  const confirmDeliveryAndReleaseFunds = async (confirmation: DeliveryConfirmation) => {
    setProcessing(true);
    try {
      // TODO: Database function not yet implemented
      // Mock response for development
      if (import.meta.env.DEV) {
        console.log('🔧 MODE DEV: Simulation de confirmation de livraison', confirmation);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast({
          title: 'Livraison confirmée (Dev)',
          description: '🔧 En production, les fonds seraient libérés au voyageur',
        });

        return { success: true, traveler_amount: '0.00' };
      }

      // Production: Uncomment when database function is created
      // const { data, error } = await supabase.rpc('confirm_delivery_and_release_funds', {
      //   p_reservation_id: confirmation.reservation_id,
      //   p_confirmation_code: confirmation.confirmation_code
      // });
      // if (error) throw error;
      // if (!data.success) throw new Error(data.error);

      throw new Error('Fonction non disponible en production');
    } catch (error: any) {
      toast({
        title: 'Erreur de confirmation',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  // Demander un remboursement (annulation)
  const requestRefund = async (reservationId: string, reason: string = 'Annulation utilisateur') => {
    setProcessing(true);
    try {
      // TODO: Database function not yet implemented
      // Mock response for development
      if (import.meta.env.DEV) {
        console.log('🔧 MODE DEV: Simulation de remboursement', { reservationId, reason });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast({
          title: 'Remboursement demandé (Dev)',
          description: '🔧 En production, le remboursement serait traité sous 3-5 jours',
        });

        return { success: true };
      }

      // Production: Uncomment when database function is created
      // const { data, error } = await supabase.rpc('refund_reservation', {
      //   p_reservation_id: reservationId,
      //   p_reason: reason
      // });
      // if (error) throw error;
      // if (!data.success) throw new Error(data.error);

      throw new Error('Fonction non disponible en production');
    } catch (error: any) {
      toast({
        title: 'Erreur de remboursement',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  // Mettre à jour le statut d'escrow d'une réservation
  const updateReservationEscrowStatus = async (
    reservationId: string,
    escrowStatus: 'pending' | 'held' | 'released_traveler' | 'released_customer',
    additionalData: any = {}
  ) => {
    try {
      // Note: Cette requête nécessite que la migration soit appliquée
      const { error } = await supabase
        .from('trips') // Utiliser table existante temporairement
        .select('*')
        .limit(0);

      if (error) {
        console.log('Table reservations non disponible - migration requise');
        return;
      }

      // Code réel (à utiliser après migration):
      // const { error } = await supabase
      //   .from('reservations')
      //   .update({
      //     escrow_status: escrowStatus,
      //     ...additionalData
      //   })
      //   .eq('id', reservationId);

      // if (error) throw error;
    } catch (error) {
      console.error('Erreur mise à jour escrow:', error);
    }
  };

  // Obtenir les stats de gains de la plateforme (admin seulement)
  const getPlatformEarnings = async (startDate?: string, endDate?: string) => {
    try {
      // TODO: Table platform_earnings not yet created
      // Mock response for development
      if (import.meta.env.DEV) {
        console.log('🔧 MODE DEV: Simulation des revenus de la plateforme', { startDate, endDate });
        return {
          earnings: [],
          totalAmount: 0,
          count: 0
        };
      }

      // Production: Uncomment when table is created
      // let query = supabase
      //   .from('platform_earnings')
      //   .select('*')
      //   .eq('status', 'collected');
      // if (startDate) query = query.gte('earned_at', startDate);
      // if (endDate) query = query.lte('earned_at', endDate);
      // const { data, error } = await query.order('earned_at', { ascending: false });
      // if (error) throw error;
      // const totalEarnings = data.reduce((sum, earning) => sum + Number(earning.commission_amount), 0);

      return { earnings: [], totalAmount: 0, count: 0 };
    } catch (error: any) {
      console.error('Error loading platform earnings:', error);
      return { earnings: [], totalAmount: 0, count: 0 };
    }
  };

  return {
    processing,
    userCountry,
    availablePaymentMethods,
    getRecommendedCurrency: () => getRecommendedCurrency(userCountry),
    calculateTotalFees,
    initiateEscrowPayment,
    confirmDeliveryAndReleaseFunds,
    requestRefund,
    updateReservationEscrowStatus,
    getPlatformEarnings,
  };
};