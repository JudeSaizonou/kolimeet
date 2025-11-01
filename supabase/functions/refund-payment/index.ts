import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { payment_intent_id, reservation_id, amount, reason } = await req.json()

    // Créer le remboursement avec Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment_intent_id,
      amount: amount, // Optionnel : remboursement partiel
      reason: reason || 'requested_by_customer',
      metadata: {
        reservation_id,
      },
    })

    return new Response(
      JSON.stringify({
        refund_id: refund.id,
        status: refund.status,
        amount: refund.amount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})