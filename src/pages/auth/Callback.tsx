import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Callback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if user needs onboarding
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("onboarding_completed")
            .eq("user_id", user.id)
            .single();

          if (profile && !profile.onboarding_completed) {
            navigate("/onboarding");
          } else {
            navigate("/");
          }
        } else {
          navigate("/auth/login");
        }
      } catch (error) {
        console.error("Callback error:", error);
        navigate("/auth/login");
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Connexion en cours...</p>
      </div>
    </div>
  );
};

export default Callback;
