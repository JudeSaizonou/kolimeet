/**
 * IMPORTANT: OAuth Callback Handler
 * 
 * This component handles both OAuth flows:
 * 1. Hash flow (#access_token): Supabase automatically exchanges the token
 * 2. Code flow (?code=...&state=...): Manual exchange required
 * 
 * Ensure Supabase Dashboard → Authentication → URL Configuration includes:
 * - Site URL: https://kolimeet.lovable.app
 * - Additional Redirect URLs:
 *   • http://localhost:8080/auth/callback
 *   • https://kolimeet.lovable.app/auth/callback
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

const Callback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        const hasHashToken = hashParams.has('access_token');
        const hasCodeParams = searchParams.has('code') && searchParams.has('state');
        
        console.log("🔐 OAuth Callback detected:");
        console.log("  - Hash flow:", hasHashToken);
        console.log("  - Code flow:", hasCodeParams);
        console.log("  - URL:", window.location.href);

        // Handle code flow (requires manual exchange)
        if (hasCodeParams && !hasHashToken) {
          const code = searchParams.get('code');
          console.log("  - Exchanging code for session...");
          
          try {
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code!);
            
            if (exchangeError) {
              console.error("❌ Code exchange failed:", exchangeError);
              throw new Error(`Code exchange failed: ${exchangeError.message}`);
            }
            
            if (!data?.session) {
              throw new Error("No session returned from code exchange");
            }
            
            console.log("✅ Code exchange successful");
          } catch (exchangeErr: any) {
            console.error("❌ Exchange error:", exchangeErr);
            setError(`Authentication failed: ${exchangeErr.message}`);
            setProcessing(false);
            return;
          }
        }
        
        // Wait for Supabase to process the session (for hash flow)
        if (hasHashToken) {
          console.log("  - Waiting for hash token processing...");
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Check if session exists
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("❌ Session error:", sessionError);
          throw new Error(`Session error: ${sessionError.message}`);
        }

        if (!session) {
          console.log("❌ No session found");
          throw new Error("No session established. Please try logging in again.");
        }

        const user = session.user;
        console.log("✅ User authenticated:", user.email);

        // Check profile and onboarding status
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("onboarding_completed, full_name")
          .eq("user_id", user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Profile error:", profileError);
        }

        // Redirect based on onboarding status
        if (!profile || !profile.onboarding_completed) {
          console.log("→ Redirecting to onboarding");
          navigate("/onboarding");
        } else {
          console.log("→ Redirecting to home");
          toast({
            title: "Connexion réussie",
            description: `Bienvenue ${profile.full_name || user.email} !`,
          });
          navigate("/");
        }
      } catch (error: any) {
        console.error("❌ Callback error:", error);
        setError(error.message || "Une erreur est survenue lors de la connexion");
        toast({
          title: "Erreur de connexion",
          description: error.message || "Une erreur est survenue",
          variant: "destructive",
        });
      } finally {
        setProcessing(false);
      }
    };

    handleCallback();
  }, [navigate, toast]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary px-4">
        <div className="max-w-md w-full bg-card p-6 rounded-lg shadow-lg border border-destructive/20">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <h2 className="text-lg font-semibold">Échec de la connexion</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <div className="space-y-2 text-xs text-muted-foreground bg-muted p-3 rounded">
            <p><strong>Debug info:</strong></p>
            <p>URL: {window.location.href}</p>
          </div>
          <Button 
            onClick={() => navigate("/auth/login")} 
            className="w-full mt-4"
          >
            Retour à la connexion
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">
          {processing ? "Connexion en cours..." : "Redirection..."}
        </p>
      </div>
    </div>
  );
};

export default Callback;
