import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCw, X, Wifi, WifiOff } from "lucide-react";
import { useRealTime } from "@/components/RealTimeProvider";
import { cn } from "@/lib/utils";

export const UpdateNotification = () => {
  const { updateAvailable, applyUpdate, isConnected } = useRealTime();
  const [showUpdate, setShowUpdate] = useState(false);
  const [showOffline, setShowOffline] = useState(false);

  useEffect(() => {
    setShowUpdate(updateAvailable);
  }, [updateAvailable]);

  useEffect(() => {
    if (!isConnected) {
      setShowOffline(true);
    } else {
      // Hide offline notification after a short delay when back online
      const timer = setTimeout(() => setShowOffline(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isConnected]);

  const handleUpdate = () => {
    applyUpdate();
    setShowUpdate(false);
  };

  return (
    <>
      {/* PWA Update Notification */}
      {showUpdate && (
        <Card className="fixed top-20 left-4 right-4 z-50 p-4 shadow-lg border-blue-500/20 bg-blue-50 dark:bg-blue-950 md:max-w-md md:left-auto md:right-4">
          <button
            onClick={() => setShowUpdate(false)}
            className="absolute top-2 right-2 p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full transition-colors"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex items-start gap-3 pr-6">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <RefreshCw className="h-5 w-5 text-white" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1 text-blue-900 dark:text-blue-100">
                🚀 Mise à jour disponible
              </h3>
              <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                Une nouvelle version de Kolimeet est prête. Actualisez pour profiter des dernières fonctionnalités.
              </p>
              
              <Button
                onClick={handleUpdate}
                size="sm"
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Actualiser
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Connection Status */}
      <div
        className={cn(
          "fixed top-4 right-4 z-50 transition-all duration-300 transform",
          showOffline ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        )}
      >
        <Card className={cn(
          "p-3 shadow-lg border-2",
          isConnected 
            ? "border-green-500/20 bg-green-50 dark:bg-green-950" 
            : "border-red-500/20 bg-red-50 dark:bg-red-950"
        )}>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                  Reconnecté
                </span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-700 dark:text-red-300 font-medium">
                  Hors ligne
                </span>
              </>
            )}
          </div>
        </Card>
      </div>
    </>
  );
};