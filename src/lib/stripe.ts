import { loadStripe } from '@stripe/stripe-js';

// Clé publique Stripe (à remplacer par votre vraie clé)
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51...';

export const stripePromise = loadStripe(stripePublicKey);

export const PAYMENT_CONFIG = {
  currency: 'eur',
  country: 'FR',
  // Commission kilimeet (3% + 0.30€ pour Stripe)
  platformFeePercentage: 3,
  stripeFee: 0.30,
};

export const calculatePaymentAmount = (totalAmount: number) => {
  const platformFee = (totalAmount * PAYMENT_CONFIG.platformFeePercentage) / 100;
  const stripeFee = PAYMENT_CONFIG.stripeFee;
  return {
    subtotal: totalAmount,
    platformFee: platformFee,
    stripeFee: stripeFee,
    total: totalAmount + platformFee + stripeFee,
  };
};