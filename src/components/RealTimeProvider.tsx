import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import { usePWAUpdates } from "@/hooks/usePWAUpdates";
import { useAuth } from "@/hooks/useAuth";

interface RealTimeContextType {
  isConnected: boolean;
  lastUpdate: Date | null;
  updateAvailable: boolean;
  applyUpdate: () => void;
}

const RealTimeContext = createContext<RealTimeContextType>({
  isConnected: true,
  lastUpdate: null,
  updateAvailable: false,
  applyUpdate: () => {},
});

export const useRealTime = () => useContext(RealTimeContext);

interface RealTimeProviderProps {
  children: ReactNode;
}

export const RealTimeProvider = ({ children }: RealTimeProviderProps) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(navigator.onLine);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // PWA updates
  const { updateAvailable, applyUpdate } = usePWAUpdates();

  // Real-time database updates
  useRealTimeUpdates({
    tables: ['trips', 'parcels', 'profiles', 'reviews', 'messages', 'flags'],
    showNotifications: !!user, // Only show notifications to logged-in users
    onUpdate: (table, payload) => {
      setLastUpdate(new Date());
      
      if (import.meta.env.DEV) {
        console.log(`[RealTimeProvider] Update received for ${table}:`, payload.eventType);
      }
    },
  });

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => {
      setIsConnected(true);
      if (import.meta.env.DEV) {
        console.log('[RealTimeProvider] Connection restored');
      }
    };
    
    const handleOffline = () => {
      setIsConnected(false);
      if (import.meta.env.DEV) {
        console.log('[RealTimeProvider] Connection lost');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const contextValue: RealTimeContextType = {
    isConnected,
    lastUpdate,
    updateAvailable,
    applyUpdate,
  };

  return (
    <RealTimeContext.Provider value={contextValue}>
      {children}
    </RealTimeContext.Provider>
  );
};