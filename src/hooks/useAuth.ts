/**
 * IMPORTANT: Supabase OAuth Configuration
 * 
 * For Google OAuth to work properly, ensure the following are configured:
 * 
 * 1. Supabase Dashboard → Authentication → URL Configuration:
 *    - Site URL: https://kolimeet.lovable.app
 *    - Additional Redirect URLs:
 *      • http://localhost:8080/auth/callback
 *      • https://kolimeet.lovable.app/auth/callback
 * 
 * 2. Google Cloud Console → OAuth Client:
 *    - Authorized JavaScript origins:
 *      • http://localhost:8080
 *      • https://kolimeet.lovable.app
 *    - Authorized redirect URIs:
 *      • http://localhost:8080/auth/callback
 *      • https://kolimeet.lovable.app/auth/callback
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);

          // Check if user needs onboarding after login
          if (session?.user && event === 'SIGNED_IN') {
            setTimeout(() => {
              checkOnboarding(session.user.id);
            }, 0);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const checkOnboarding = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", userId)
        .single();

      if (profile && !profile.onboarding_completed) {
        navigate("/onboarding");
      }
    } catch (error) {
      console.error("Error checking onboarding:", error);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur kilomeet !",
      });
      navigate("/explorer");
    } catch (error: any) {
      toast({
        title: "Erreur de connexion",
        description: error.message || "Vérifiez vos identifiants",
        variant: "destructive",
      });
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Inscription réussie",
        description: "Votre compte a été créé avec succès !",
      });
      navigate("/explorer");
    } catch (error: any) {
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Determine redirect URL from environment variables (never use window.location.origin)
      const redirectTo =
        import.meta.env.VITE_OAUTH_REDIRECT_OVERRIDE?.trim() ||
        (import.meta.env.DEV
          ? import.meta.env.VITE_OAUTH_REDIRECT_DEV
          : import.meta.env.VITE_OAUTH_REDIRECT_PROD);

      console.log("🔐 Google OAuth Configuration:");
      console.log("  - Environment:", import.meta.env.DEV ? "DEVELOPMENT" : "PRODUCTION");
      console.log("  - Redirect URL:", redirectTo);
      console.log("  - Override active:", !!import.meta.env.VITE_OAUTH_REDIRECT_OVERRIDE?.trim());
      
      if (!redirectTo) {
        throw new Error("OAuth redirect URL not configured. Check environment variables.");
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        },
      });

      if (error) {
        console.error("❌ Google OAuth error:", error);
        throw error;
      }
    } catch (error: any) {
      console.error("❌ Sign in with Google failed:", error);
      toast({
        title: "Erreur de connexion",
        description: error.message || "Impossible de se connecter avec Google",
        variant: "destructive",
      });
    }
  };


  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Déconnexion réussie",
        description: "À bientôt sur kilomeet !",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de se déconnecter",
        variant: "destructive",
      });
    }
  };

  const getOAuthRedirectUrl = () => {
    return import.meta.env.VITE_OAUTH_REDIRECT_OVERRIDE?.trim() ||
      (import.meta.env.DEV
        ? import.meta.env.VITE_OAUTH_REDIRECT_DEV
        : import.meta.env.VITE_OAUTH_REDIRECT_PROD);
  };

  return {
    user,
    session,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    getOAuthRedirectUrl,
  };
};
