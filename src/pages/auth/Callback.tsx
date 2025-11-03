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

        // Handle code flow (requires manual exchange)
        if (hasCodeParams && !hasHashToken) {
          const code = searchParams.get('code');
          
          try {
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code!);
            
            if (exchangeError) {
              throw new Error(`Code exchange failed: ${exchangeError.message}`);
            }
            
            if (!data?.session) {
              throw new Error("No session returned from code exchange");
            }
          } catch (exchangeErr: any) {
            setError(`Authentication failed: ${exchangeErr.message}`);
            setProcessing(false);
            return;
          }
        }
        
        // Wait for Supabase to process the session (for hash flow)
        if (hasHashToken) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Check if session exists
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw new Error(`Session error: ${sessionError.message}`);
        }

        if (!session) {
          throw new Error("No session established. Please try logging in again.");
        }

        const user = session.user;

        // Check profile and onboarding status
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("onboarding_completed, full_name")
          .eq("user_id", user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          // Silently handle profile error
        }

        // Redirect based on onboarding status
        if (!profile || !profile.onboarding_completed) {
          navigate("/onboarding");
        } else {
          toast({
            title: "Connexion réussie",
            description: `Bienvenue ${profile.full_name || user.email} !`,
          });
          navigate("/");
        }
      } catch (error: any) {
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
