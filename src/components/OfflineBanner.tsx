import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <Alert className="fixed top-16 left-4 right-4 z-50 bg-destructive text-destructive-foreground border-destructive md:max-w-md md:left-auto md:right-4">
      <WifiOff className="h-4 w-4" />
      <AlertDescription>
        Vous êtes hors connexion. Certaines fonctionnalités peuvent être limitées.
      </AlertDescription>
    </Alert>
  );
}
