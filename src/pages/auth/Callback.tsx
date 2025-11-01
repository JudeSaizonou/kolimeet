import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Callback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase gère automatiquement l'échange de tokens avec le hash de l'URL
        // Attendons un peu pour que Supabase traite la session
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Vérifier si l'utilisateur est connecté
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          toast({
            title: "Erreur de connexion",
            description: "Une erreur est survenue lors de la connexion",
            variant: "destructive",
          });
          navigate("/auth/login");
          return;
        }

        if (!session) {
          console.log("No session found, redirecting to login");
          navigate("/auth/login");
          return;
        }

        const user = session.user;
        console.log("User authenticated:", user.email);

        // Vérifier si le profil existe et est complet
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("onboarding_completed, full_name")
          .eq("user_id", user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Profile error:", profileError);
        }

        // Si le profil n'existe pas ou l'onboarding n'est pas terminé
        if (!profile || !profile.onboarding_completed) {
          console.log("Redirecting to onboarding");
          navigate("/onboarding");
        } else {
          console.log("Redirecting to home");
          toast({
            title: "Connexion réussie",
            description: `Bienvenue ${profile.full_name || user.email} !`,
          });
          navigate("/");
        }
      } catch (error) {
        console.error("Callback error:", error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue",
          variant: "destructive",
        });
        navigate("/auth/login");
      } finally {
        setProcessing(false);
      }
    };

    handleCallback();
  }, [navigate, toast]);

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
