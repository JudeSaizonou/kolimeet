import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// VAPID keys - À générer avec: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:contact@kolimeet.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  vibrate?: number[];
  requireInteraction?: boolean;
  actions?: Array<{ action: string; title: string; icon?: string }>;
}

interface RequestBody {
  user_id: string;
  payload: PushPayload;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, payload }: RequestBody = await req.json();
    
    console.log("[send-push] Received request for user:", user_id);

    if (!user_id || !payload) {
      return new Response(
        JSON.stringify({ error: "user_id et payload requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Récupérer les subscriptions de l'utilisateur
    const { data: subscriptions, error: fetchError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id);

    console.log("[send-push] Found subscriptions:", subscriptions?.length || 0);

    if (fetchError) {
      console.error("[send-push] Error fetching subscriptions:", fetchError);
      throw fetchError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "Aucune subscription trouvée", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Vérifier les clés VAPID
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.error("[send-push] Clés VAPID non configurées");
      return new Response(
        JSON.stringify({ error: "Configuration VAPID manquante" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Préparer le payload
    const pushPayload = JSON.stringify({
      title: payload.title || "Kolimeet",
      body: payload.body || "Nouvelle notification",
      icon: payload.icon || "/icon-192.png",
      badge: payload.badge || "/icon-192.png",
      tag: payload.tag || `kolimeet-${Date.now()}`,
      data: payload.data || {},
      vibrate: payload.vibrate || [200, 100, 200],
      requireInteraction: payload.requireInteraction || false,
      actions: payload.actions || [],
    });

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Envoyer à chaque subscription via une approche simplifiée
    // Note: Pour une vraie implémentation, utiliser web-push sur un serveur Node.js
    // ou un service tiers comme Firebase Cloud Messaging, OneSignal, etc.
    for (const sub of subscriptions) {
      try {
        console.log("[send-push] Sending to endpoint:", sub.endpoint);
        
        // Créer les headers VAPID
        const url = new URL(sub.endpoint);
        const audience = `${url.protocol}//${url.host}`;
        
        // Créer un JWT simple pour VAPID
        const header = btoa(JSON.stringify({ typ: "JWT", alg: "ES256" }))
          .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        
        const now = Math.floor(Date.now() / 1000);
        const claims = btoa(JSON.stringify({
          aud: audience,
          exp: now + 43200, // 12h
          sub: VAPID_SUBJECT,
        })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

        // Pour une vraie signature ES256, il faudrait utiliser crypto.subtle
        // Ici on fait un appel direct qui peut échouer si le endpoint requiert une vraie signature
        
        const response = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "TTL": "86400",
            "Urgency": "high",
          },
          body: pushPayload,
        });

        console.log("[send-push] Response status:", response.status);

        if (response.ok || response.status === 201) {
          results.sent++;
          console.log("[send-push] ✅ Notification sent successfully");
        } else if (response.status === 404 || response.status === 410) {
          // Subscription expirée, la supprimer
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", sub.id);
          results.failed++;
          results.errors.push(`Subscription expirée: ${sub.id}`);
          console.log("[send-push] ⚠️ Subscription expired, deleted");
        } else {
          const errorText = await response.text();
          results.failed++;
          results.errors.push(`Erreur ${response.status}: ${errorText}`);
          console.log("[send-push] ❌ Error:", response.status, errorText);
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Exception: ${error.message}`);
        console.error("[send-push] Exception:", error);
      }
    }

    console.log("[send-push] Results:", results);

    return new Response(
      JSON.stringify({
        message: `Notifications envoyées`,
        ...results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[send-push] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
