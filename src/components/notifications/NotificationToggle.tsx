import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, Loader2, AlertCircle, Info } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface NotificationToggleProps {
  compact?: boolean;
}

// Détecter si on est sur iOS
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Détecter si on est en mode PWA (standalone)
const isPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
};

// Vérifier si iOS supporte les notifications (iOS 16.4+)
const getIOSVersion = () => {
  const match = navigator.userAgent.match(/OS (\d+)_(\d+)/);
  if (match) {
    return { major: parseInt(match[1]), minor: parseInt(match[2]) };
  }
  return null;
};

/**
 * Composant simple pour activer/désactiver les notifications locales
 * Ne nécessite pas de configuration VAPID - utilise juste l'API Notification
 */
export function NotificationToggle({ compact = false }: NotificationToggleProps) {
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const [iosInfo, setIosInfo] = useState<{ isIOS: boolean; isPWA: boolean; version: { major: number; minor: number } | null }>({
    isIOS: false,
    isPWA: false,
    version: null
  });

  useEffect(() => {
    // Vérifier le support
    const supported = 'Notification' in window;
    const iosDevice = isIOS();
    const pwaMode = isPWA();
    const iosVer = getIOSVersion();
    
    setIosInfo({ isIOS: iosDevice, isPWA: pwaMode, version: iosVer });
    
    // Sur iOS en PWA, les notifications ne sont supportées qu'à partir d'iOS 16.4
    if (iosDevice && pwaMode) {
      if (iosVer && (iosVer.major > 16 || (iosVer.major === 16 && iosVer.minor >= 4))) {
        setIsSupported(supported);
      } else {
        setIsSupported(false);
      }
    } else {
      setIsSupported(supported);
    }
    
    if (supported) {
      setPermission(Notification.permission);
    }
    
    console.log('[NotificationToggle] Setup:', {
      supported,
      isIOS: iosDevice,
      isPWA: pwaMode,
      iosVersion: iosVer,
      permission: supported ? Notification.permission : 'N/A'
    });
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return;
    
    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast({
          title: 'Notifications activées ! 🔔',
          description: 'Vous recevrez des notifications pour les nouveaux messages.',
        });
        
        // Envoyer une notification de test
        try {
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            const registration = await navigator.serviceWorker.ready;
            registration.showNotification('Kolimeet', {
              body: 'Les notifications sont activées ! 🎉',
              icon: '/icon-192.png',
              badge: '/icon-192.png',
            });
          } else {
            new Notification('Kolimeet', {
              body: 'Les notifications sont activées ! 🎉',
              icon: '/icon-192.png',
            });
          }
        } catch (e) {
          console.error('Erreur notification test:', e);
        }
      } else if (result === 'denied') {
        toast({
          variant: 'destructive',
          title: 'Permission refusée',
          description: 'Pour activer les notifications, autorisez-les dans les paramètres de votre navigateur.',
        });
      }
    } catch (error) {
      console.error('Erreur demande permission:', error);
    } finally {
      setLoading(false);
    }
  }, [isSupported, toast]);

  const handleToggle = async () => {
    if (permission === 'granted') {
      // On ne peut pas vraiment "désactiver" les notifications via JS
      // On informe juste l'utilisateur
      toast({
        title: 'Information',
        description: 'Pour désactiver les notifications, allez dans les paramètres de votre navigateur.',
      });
    } else {
      await requestPermission();
    }
  };

  const isEnabled = permission === 'granted';
  
  // Message d'information pour iOS
  const getStatusMessage = () => {
    if (!isSupported) {
      if (iosInfo.isIOS && iosInfo.isPWA) {
        if (!iosInfo.version || iosInfo.version.major < 16 || (iosInfo.version.major === 16 && iosInfo.version.minor < 4)) {
          return 'iOS 16.4+ requis';
        }
      }
      return 'Non supportées';
    }
    if (isEnabled) return 'Activées';
    if (permission === 'denied') return 'Bloquées';
    return 'Désactivées';
  };

  // Mode compact pour intégration dans la page profil
  if (compact) {
    return (
      <div className="px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center",
            !isSupported ? "bg-amber-100" : isEnabled ? "bg-green-100" : "bg-slate-100"
          )}>
            {!isSupported ? (
              <AlertCircle className="h-4.5 w-4.5 text-amber-600" />
            ) : isEnabled ? (
              <Bell className="h-4.5 w-4.5 text-green-600" />
            ) : (
              <BellOff className="h-4.5 w-4.5 text-slate-600" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">Notifications</p>
            <p className="text-xs text-slate-500">
              {getStatusMessage()}
            </p>
          </div>
        </div>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        ) : (
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={loading || !isSupported || permission === 'denied'}
          />
        )}
      </div>
    );
  }

  // Mode full (non utilisé pour l'instant)
  return (
    <div className="p-4 bg-white rounded-xl border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            isEnabled ? "bg-green-100" : "bg-slate-100"
          )}>
            {isEnabled ? (
              <Bell className="h-5 w-5 text-green-600" />
            ) : (
              <BellOff className="h-5 w-5 text-slate-500" />
            )}
          </div>
          <div>
            <p className="font-medium">Notifications de messages</p>
            <p className="text-sm text-slate-500">
              {isEnabled ? 'Vous serez notifié des nouveaux messages' : 'Activez pour ne rien manquer'}
            </p>
          </div>
        </div>
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={!isSupported || permission === 'denied'}
          />
        )}
      </div>
      
      {permission === 'denied' && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
          Les notifications sont bloquées. Pour les activer, cliquez sur l'icône de cadenas 
          dans la barre d'adresse et autorisez les notifications.
        </p>
      )}
    </div>
  );
}
