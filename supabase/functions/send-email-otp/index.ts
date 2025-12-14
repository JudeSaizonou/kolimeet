import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OTPRequest {
  email: string;
  code: string;
  userId: string;
}

// Rate limiting: max 5 codes per email per hour
async function checkRateLimit(supabase: any, email: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const { count, error } = await supabase
    .from('phone_verification_codes')
    .select('id', { count: 'exact', head: true })
    .eq('phone_e164', email) // On réutilise la même table
    .gte('created_at', oneHourAgo);
  
  if (error) {
    console.error('Rate limit check error:', error);
    return true;
  }
  
  return (count || 0) < 5;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code, userId }: OTPRequest = await req.json();

    if (!email || !code) {
      throw new Error("Email et code requis");
    }

    // Validate email format
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return new Response(
        JSON.stringify({ 
          error: "invalid_email",
          message: "Format d'email invalide"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Initialize Supabase client for rate limiting
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check rate limit
    const canSend = await checkRateLimit(supabase, email);
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

    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.log("Resend not configured, returning code for development");
      return new Response(
        JSON.stringify({ 
          error: "dev_mode",
          message: "Mode développement - Resend non configuré",
          code: code
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send email via Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "KoliMeet <noreply@kolimeet.com>",
        to: [email],
        subject: "🔐 Code de vérification KoliMeet",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #7C3AED; margin: 0;">KoliMeet</h1>
              <p style="color: #666; margin-top: 5px;">Vérification de votre compte</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%); border-radius: 16px; padding: 30px; text-align: center; color: white;">
              <p style="margin: 0 0 15px 0; font-size: 14px; opacity: 0.9;">Votre code de vérification</p>
              <div style="background: white; border-radius: 12px; padding: 20px; margin: 10px 0;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #7C3AED;">${code}</span>
              </div>
              <p style="margin: 15px 0 0 0; font-size: 12px; opacity: 0.8;">Ce code expire dans 10 minutes</p>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background: #F8F9FA; border-radius: 12px;">
              <p style="margin: 0; color: #666; font-size: 13px; line-height: 1.5;">
                Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email en toute sécurité.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #999; font-size: 12px;">© 2025 KoliMeet - Envoi de colis entre particuliers</p>
            </div>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Resend error:", JSON.stringify(errorData));
      throw new Error(`Resend error: ${errorData.message || "Failed to send email"}`);
    }

    const data = await response.json();
    console.log("Email sent successfully:", data.id);

    return new Response(
      JSON.stringify({ success: true, message: "Code envoyé par email" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-email-otp:", error);
    return new Response(
      JSON.stringify({ error: "server_error", message: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
