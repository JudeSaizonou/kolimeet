import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { payment_intent_id, reservation_id, traveler_payout_amount, platform_commission_amount } = await req.json()

    if (!payment_intent_id || !reservation_id) {
      throw new Error('payment_intent_id et reservation_id sont requis')
    }

    // 1. Capturer le paiement Stripe
    const paymentIntent = await stripe.paymentIntents.capture(payment_intent_id)
    
    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Échec de la capture du paiement')
    }

    // 2. Mettre à jour le statut dans la base de données
    const { error: updateError } = await supabase
      .from('reservations')
      .update({ 
        escrow_status: 'released',
        delivery_confirmed_at: new Date().toISOString(),
        stripe_payment_intent_id: payment_intent_id
      })
      .eq('id', reservation_id)

    if (updateError) {
      throw new Error(`Erreur de mise à jour de la réservation: ${updateError.message}`)
    }

    // 3. Enregistrer les gains de la plateforme
    if (platform_commission_amount > 0) {
      const { error: earningsError } = await supabase
        .from('platform_earnings')
        .insert({
          reservation_id,
          amount: platform_commission_amount,
          currency: paymentIntent.currency.toUpperCase(),
          payment_method: 'stripe_card',
          stripe_payment_intent_id: payment_intent_id
        })

      if (earningsError) {
        console.error('Erreur lors de l\'enregistrement des gains:', earningsError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_intent_id: paymentIntent.id,
        amount_captured: paymentIntent.amount_received,
        traveler_payout: traveler_payout_amount,
        platform_commission: platform_commission_amount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Erreur capture escrow:', error)
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Erreur lors de la capture du paiement',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})