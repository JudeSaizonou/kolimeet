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

// Encoder en base64 URL-safe
function base64UrlEncode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Créer le JWT pour l'authentification VAPID
async function createVapidJwt(
  endpoint: string,
  subject: string,
  publicKey: string,
  privateKey: string
): Promise<string> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const expiration = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // 12 heures

  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: audience,
    exp: expiration,
    sub: subject,
  };

  const headerB64 = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify(header))
  );
  const payloadB64 = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify(payload))
  );

  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Importer la clé privée
  const privateKeyData = base64UrlDecode(privateKey);
  const key = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyData,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  // Signer
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureB64 = base64UrlEncode(new Uint8Array(signature));

  return `${unsignedToken}.${signatureB64}`;
}

function base64UrlDecode(str: string): Uint8Array {
  const padding = "=".repeat((4 - (str.length % 4)) % 4);
  const base64 = (str + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from(rawData, (c) => c.charCodeAt(0));
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

    if (fetchError) {
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
      console.error("Clés VAPID non configurées");
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

    // Envoyer à chaque subscription
    for (const sub of subscriptions) {
      try {
        // Pour simplifier, on utilise fetch avec les headers VAPID
        // En production, il faudrait utiliser une lib comme web-push
        
        const jwt = await createVapidJwt(
          sub.endpoint,
          VAPID_SUBJECT,
          VAPID_PUBLIC_KEY,
          VAPID_PRIVATE_KEY
        );

        const response = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "Content-Encoding": "aes128gcm",
            "TTL": "86400",
            "Authorization": `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
          },
          body: pushPayload,
        });

        if (response.ok || response.status === 201) {
          results.sent++;
        } else if (response.status === 404 || response.status === 410) {
          // Subscription expirée, la supprimer
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", sub.id);
          results.failed++;
          results.errors.push(`Subscription expirée: ${sub.id}`);
        } else {
          results.failed++;
          results.errors.push(`Erreur ${response.status} pour ${sub.id}`);
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Exception pour ${sub.id}: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Notifications envoyées`,
        ...results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Erreur send-push:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
