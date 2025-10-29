import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const usePWAUpdates = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        
        // Check for updates every 5 minutes
        const updateInterval = setInterval(() => {
          reg.update();
        }, 5 * 60 * 1000);

        // Handle update found
        const handleUpdateFound = () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          }
        };

        reg.addEventListener('updatefound', handleUpdateFound);

        return () => {
          clearInterval(updateInterval);
          reg.removeEventListener('updatefound', handleUpdateFound);
        };
      });

      // Listen for new service worker taking control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (import.meta.env.DEV) {
          console.log('[PWA] New service worker activated, reloading...');
        }
        window.location.reload();
      });
    }
  }, []);

  const applyUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setUpdateAvailable(false);
    }
  };

  return { updateAvailable, applyUpdate, registration };
};