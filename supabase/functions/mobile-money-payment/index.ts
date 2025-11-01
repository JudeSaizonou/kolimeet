import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Configuration des API Mobile Money
const PAYMENT_APIS = {
  orange_money: {
    base_url: 'https://api.orange.com/orange-money-webpay/dev/v1',
    // Remplacer par vos vraies credentials Orange Money API
    client_id: Deno.env.get('ORANGE_MONEY_CLIENT_ID'),
    client_secret: Deno.env.get('ORANGE_MONEY_CLIENT_SECRET'),
  },
  
  mtn_money: {
    base_url: 'https://sandbox.momodeveloper.mtn.com',
    // Remplacer par vos vraies credentials MTN MoMo API
    subscription_key: Deno.env.get('MTN_MOMO_SUBSCRIPTION_KEY'),
    user_id: Deno.env.get('MTN_MOMO_USER_ID'),
    api_key: Deno.env.get('MTN_MOMO_API_KEY'),
  },
  
  wave: {
    base_url: 'https://api.wave.com/v1',
    // Wave API credentials
    api_key: Deno.env.get('WAVE_API_KEY'),
    secret_key: Deno.env.get('WAVE_SECRET_KEY'),
  }
}

// Fonction pour initier un paiement Orange Money
const initiateOrangeMoneyPayment = async (paymentData: any) => {
  const { client_id, client_secret, base_url } = PAYMENT_APIS.orange_money
  
  try {
    // 1. Obtenir le token d'accès
    const tokenResponse = await fetch(`${base_url}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${client_id}:${client_secret}`)}`
      },
      body: 'grant_type=client_credentials'
    })
    
    const tokenData = await tokenResponse.json()
    
    // 2. Initier la transaction
    const paymentResponse = await fetch(`${base_url}/webpayment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`
      },
      body: JSON.stringify({
        merchant_key: paymentData.merchant_key,
        currency: paymentData.currency,
        order_id: paymentData.reservation_id,
        amount: paymentData.amount,
        return_url: paymentData.return_url,
        cancel_url: paymentData.cancel_url,
        notif_url: paymentData.webhook_url,
        lang: 'fr',
        reference: `KOLIMEET-${paymentData.reservation_id}`
      })
    })
    
    return await paymentResponse.json()
  } catch (error) {
    throw new Error(`Orange Money payment failed: ${error.message}`)
  }
}

// Fonction pour initier un paiement MTN Mobile Money
const initiateMTNMoneyPayment = async (paymentData: any) => {
  const { subscription_key, user_id, api_key, base_url } = PAYMENT_APIS.mtn_money
  
  try {
    // Générer un UUID pour la transaction
    const transactionId = crypto.randomUUID()
    
    const response = await fetch(`${base_url}/collection/v1_0/requesttopay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${api_key}`,
        'X-Reference-Id': transactionId,
        'X-Target-Environment': 'sandbox', // Changer en 'live' pour production
        'Ocp-Apim-Subscription-Key': subscription_key
      },
      body: JSON.stringify({
        amount: paymentData.amount.toString(),
        currency: paymentData.currency,
        externalId: paymentData.reservation_id,
        payer: {
          partyIdType: 'MSISDN',
          partyId: paymentData.phone_number
        },
        payerMessage: `Paiement kolimeet - Réservation ${paymentData.reservation_id}`,
        payeeNote: 'Paiement pour réservation de transport'
      })
    })
    
    return {
      transaction_id: transactionId,
      status: response.status === 202 ? 'pending' : 'failed',
      message: response.status === 202 ? 'Transaction initiated' : 'Transaction failed'
    }
  } catch (error) {
    throw new Error(`MTN Money payment failed: ${error.message}`)
  }
}

// Fonction pour initier un paiement Wave
const initiateWavePayment = async (paymentData: any) => {
  const { api_key, secret_key, base_url } = PAYMENT_APIS.wave
  
  try {
    const response = await fetch(`${base_url}/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${api_key}`
      },
      body: JSON.stringify({
        amount: paymentData.amount * 100, // Wave utilise les centimes
        currency: paymentData.currency,
        success_url: paymentData.return_url,
        error_url: paymentData.cancel_url,
        webhook_url: paymentData.webhook_url,
        metadata: {
          reservation_id: paymentData.reservation_id,
          platform: 'kolimeet'
        }
      })
    })
    
    return await response.json()
  } catch (error) {
    throw new Error(`Wave payment failed: ${error.message}`)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      payment_method, 
      amount, 
      currency, 
      reservation_id, 
      phone_number,
      return_url,
      cancel_url,
      webhook_url 
    } = await req.json()

    let result;

    switch (payment_method) {
      case 'orange_money':
        result = await initiateOrangeMoneyPayment({
          amount,
          currency,
          reservation_id,
          phone_number,
          return_url,
          cancel_url,
          webhook_url,
          merchant_key: 'your_orange_merchant_key' // À configurer
        })
        break;

      case 'mtn_money':
        result = await initiateMTNMoneyPayment({
          amount,
          currency,
          reservation_id,
          phone_number
        })
        break;

      case 'wave':
        result = await initiateWavePayment({
          amount,
          currency,
          reservation_id,
          return_url,
          cancel_url,
          webhook_url
        })
        break;

      default:
        throw new Error(`Unsupported payment method: ${payment_method}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_method,
        transaction_data: result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Mobile money payment error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})