import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SMSRequest {
  phoneNumber: string;
  code: string;
  userId: string;
}

// Rate limiting: max 3 codes per phone number per hour
async function checkRateLimit(supabase: any, phoneNumber: string, userId: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const { count, error } = await supabase
    .from('phone_verification_codes')
    .select('id', { count: 'exact', head: true })
    .eq('phone_e164', phoneNumber)
    .gte('created_at', oneHourAgo);
  
  if (error) {
    console.error('Rate limit check error:', error);
    return true; // Allow if check fails
  }
  
  return (count || 0) < 3;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber, code, userId }: SMSRequest = await req.json();

    if (!phoneNumber || !code) {
      throw new Error("Numéro de téléphone et code requis");
    }

    // Validate phone number format (E.164)
    if (!phoneNumber.match(/^\+[1-9]\d{6,14}$/)) {
      throw new Error("Format de numéro invalide. Utilisez le format international (+33...)");
    }

    // Initialize Supabase client for rate limiting
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check rate limit
    const canSend = await checkRateLimit(supabase, phoneNumber, userId);
    if (!canSend) {
      return new Response(
        JSON.stringify({ 
          error: "rate_limit",
          message: "Trop de tentatives. Réessayez dans 1 heure."
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    // Mode développement si Twilio n'est pas configuré
    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.log("Twilio not configured, returning code for development");
      return new Response(
        JSON.stringify({ 
          error: "dev_mode",
          message: "Mode développement - Twilio non configuré",
          code: code // Return code for development/testing
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send SMS via Twilio
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": "Basic " + btoa(`${accountSid}:${authToken}`),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: phoneNumber,
          From: twilioPhoneNumber,
          Body: `KoliMeet - Votre code de vérification est : ${code}. Ce code expire dans 10 minutes.`,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Twilio error:", JSON.stringify(errorData));
      
      // Handle specific Twilio errors
      const twilioErrorCode = errorData.code;
      
      // Trial account limitation - number not verified
      if (twilioErrorCode === 21608) {
        return new Response(
          JSON.stringify({ 
            error: "trial_limitation",
            message: "Compte Twilio en mode essai. Le numéro doit être vérifié dans Twilio.",
            code: code // Return code for testing
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      
      // Invalid phone number
      if (twilioErrorCode === 21211 || twilioErrorCode === 21614) {
        return new Response(
          JSON.stringify({ 
            error: "invalid_phone",
            message: "Numéro de téléphone invalide ou non joignable"
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      
      // Blocked number
      if (twilioErrorCode === 21610) {
        return new Response(
          JSON.stringify({ 
            error: "blocked_phone",
            message: "Ce numéro est bloqué ou ne peut pas recevoir de SMS"
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      
      throw new Error(`Twilio error: ${errorData.message || "Échec de l'envoi du SMS"}`);
    }

    const data = await response.json();
    console.log("SMS sent successfully:", data.sid);

    return new Response(
      JSON.stringify({ success: true, message: "Code envoyé par SMS" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-sms-verification:", error);
    return new Response(
      JSON.stringify({ error: "server_error", message: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
