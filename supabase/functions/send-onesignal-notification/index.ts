import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  recipientUserId: string;
  title: string;
  message: string;
  url?: string;
  data?: Record<string, string>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
    const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      console.error("OneSignal credentials not configured");
      return new Response(
        JSON.stringify({ error: "OneSignal not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: NotificationPayload = await req.json();
    const { recipientUserId, title, message, url, data } = payload;

    console.log("Sending notification to user:", recipientUserId);
    console.log("Title:", title);
    console.log("Message:", message);

    // Envoyer la notification via l'API OneSignal
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        // Cibler l'utilisateur spécifique via son external_user_id (= Supabase user ID)
        include_external_user_ids: [recipientUserId],
        // Contenu de la notification
        headings: { en: title, fr: title },
        contents: { en: message, fr: message },
        // URL à ouvrir quand on clique
        url: url || undefined,
        web_url: url || undefined,
        app_url: url || undefined,
        // Données additionnelles
        data: data || {},
        // Options iOS
        ios_badgeType: "Increase",
        ios_badgeCount: 1,
        // Options Android
        android_channel_id: "messages",
        // Options Web
        chrome_web_badge: "/icon-192.png",
        chrome_web_icon: "/icon-192.png",
        firefox_icon: "/icon-192.png",
      }),
    });

    const result = await response.json();
    console.log("OneSignal response:", result);

    if (!response.ok) {
      console.error("OneSignal error:", result);
      return new Response(
        JSON.stringify({ error: "Failed to send notification", details: result }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
