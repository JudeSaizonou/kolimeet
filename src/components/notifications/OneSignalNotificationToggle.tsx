import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { 
  initOneSignal, 
  requestNotificationPermission, 
  isNotificationEnabled,
  setExternalUserId,
  OneSignal
} from '@/lib/onesignal';

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;

/**
 * Composant pour activer/désactiver les notifications via OneSignal
 * Fonctionne sur iOS PWA, Android, et tous les navigateurs modernes
 */
export function OneSignalNotificationToggle() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(!!ONESIGNAL_APP_ID);

  useEffect(() => {
    const init = async () => {
      // Vérifier si OneSignal est configuré
      if (!ONESIGNAL_APP_ID) {
        console.log('[OneSignalToggle] App ID non configuré');
        setIsConfigured(false);
        setLoading(false);
        return;
      }

      // Vérifier le support de base
      const supported = 'Notification' in window && 'serviceWorker' in navigator;
      setIsSupported(supported);

      if (!supported) {
        setLoading(false);
        return;
      }

      try {
        // Initialiser OneSignal
        await initOneSignal();
        
        // Vérifier l'état actuel
        const enabled = await isNotificationEnabled();
        setIsEnabled(enabled);
        
        // Associer l'utilisateur si connecté
        if (user?.id) {
          await setExternalUserId(user.id);
        }
      } catch (error) {
        console.error('[OneSignalToggle] Erreur init:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user?.id]);

  // Écouter les changements de permission
  useEffect(() => {
    if (!ONESIGNAL_APP_ID) return;

    const handlePermissionChange = async () => {
      const enabled = await isNotificationEnabled();
      setIsEnabled(enabled);
    };

    try {
      OneSignal.Notifications.addEventListener('permissionChange', handlePermissionChange);
      return () => {
        OneSignal.Notifications.removeEventListener('permissionChange', handlePermissionChange);
      };
    } catch {
      // OneSignal pas encore initialisé
    }
  }, []);

  const handleToggle = useCallback(async () => {
    if (loading || !isSupported) return;

    setLoading(true);
    try {
      if (isEnabled) {
        // On ne peut pas vraiment désactiver, informer l'utilisateur
        toast({
          title: 'Information',
          description: 'Pour désactiver les notifications, allez dans les paramètres de votre appareil.',
        });
      } else {
        // Demander la permission (doit être en réponse à un geste utilisateur)
        const granted = await requestNotificationPermission();
        setIsEnabled(granted);
        
        if (granted) {
          toast({
            title: 'Notifications activées ! 🔔',
            description: 'Vous recevrez des notifications même quand l\'app est fermée.',
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Permission refusée',
            description: 'Autorisez les notifications dans les paramètres de votre appareil.',
          });
        }
      }
    } catch (error) {
      console.error('[OneSignalToggle] Erreur toggle:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de modifier les notifications.',
      });
    } finally {
      setLoading(false);
    }
  }, [isEnabled, isSupported, loading, toast]);

  // Si OneSignal n'est pas configuré
  if (!isConfigured) {
    return (
      <div className="px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-100">
            <AlertCircle className="h-4.5 w-4.5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">Notifications</p>
            <p className="text-xs text-slate-500">Non configurées</p>
          </div>
        </div>
        <a 
          href="https://onesignal.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-primary flex items-center gap-1"
        >
          Configurer <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    );
  }

  const getStatusMessage = () => {
    if (!isSupported) return 'Non supportées';
    if (isEnabled) return 'Activées';
    return 'Désactivées';
  };

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
          <p className="text-xs text-slate-500">{getStatusMessage()}</p>
        </div>
      </div>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
      ) : (
        <Switch
          checked={isEnabled}
          onCheckedChange={handleToggle}
          disabled={loading || !isSupported}
        />
      )}
    </div>
  );
}
