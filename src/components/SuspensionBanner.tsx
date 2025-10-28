import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function SuspensionBanner() {
  const { user } = useAuth();
  const [isSuspended, setIsSuspended] = useState(false);

  useEffect(() => {
    const checkSuspension = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("is_suspended")
        .eq("user_id", user.id)
        .single();

      setIsSuspended(data?.is_suspended || false);
    };

    checkSuspension();
  }, [user]);

  if (!isSuspended) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Compte suspendu</AlertTitle>
      <AlertDescription>
        Votre compte est actuellement suspendu. Vous ne pouvez pas publier de contenu ni envoyer de messages. 
        Pour plus d'informations, veuillez contacter le support.
      </AlertDescription>
    </Alert>
  );
}
