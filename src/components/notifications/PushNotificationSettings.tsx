import { useState } from 'react';
import { Bell, BellOff, Loader2, CheckCircle2, AlertCircle, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function PushNotificationSettings() {
  const { toast } = useToast();
  const {
    isSupported,
    isSubscribed,
    permission,
    loading,
    error,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications();
  const [testSent, setTestSent] = useState(false);

  const handleToggle = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        toast({
          title: 'Notifications désactivées',
          description: 'Vous ne recevrez plus de notifications push.',
        });
      }
    } else {
      const success = await subscribe();
      if (success) {
        toast({
          title: 'Notifications activées ! 🔔',
          description: 'Vous recevrez des notifications pour les nouveaux messages.',
        });
      } else if (permission === 'denied') {
        toast({
          variant: 'destructive',
          title: 'Permission refusée',
          description: 'Veuillez autoriser les notifications dans les paramètres de votre navigateur.',
        });
      }
    }
  };

  const handleTest = async () => {
    await sendTestNotification();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  if (!isSupported) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <AlertCircle className="h-5 w-5" />
            Notifications non supportées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-700">
            Votre navigateur ne supporte pas les notifications push. 
            Essayez avec Chrome, Firefox, Safari ou Edge sur un appareil récent.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-primary" />
          Notifications push
        </CardTitle>
        <CardDescription>
          Recevez des notifications sur votre appareil même quand l'app est fermée
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle principal */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isSubscribed ? "bg-green-100" : "bg-slate-200"
            )}>
              {isSubscribed ? (
                <Bell className="h-5 w-5 text-green-600" />
              ) : (
                <BellOff className="h-5 w-5 text-slate-500" />
              )}
            </div>
            <div>
              <Label className="text-base font-medium">
                {isSubscribed ? 'Notifications activées' : 'Notifications désactivées'}
              </Label>
              <p className="text-xs text-muted-foreground">
                {isSubscribed 
                  ? 'Vous recevrez des alertes pour les nouveaux messages'
                  : 'Activez pour ne rien manquer'}
              </p>
            </div>
          </div>
          
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <Switch
              checked={isSubscribed}
              onCheckedChange={handleToggle}
              disabled={loading}
            />
          )}
        </div>

        {/* État de la permission */}
        {permission === 'denied' && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <div className="text-sm text-red-700">
              <p className="font-medium">Permission bloquée</p>
              <p className="text-xs mt-1">
                Les notifications sont bloquées. Pour les activer, cliquez sur l'icône 
                de cadenas dans la barre d'adresse et autorisez les notifications.
              </p>
            </div>
          </div>
        )}

        {/* Bouton de test */}
        {isSubscribed && (
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={testSent}
              className="w-full"
            >
              {testSent ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                  Notification envoyée !
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Envoyer une notification test
                </>
              )}
            </Button>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <p className="text-sm text-red-500 mt-2">{error}</p>
        )}

        {/* Info */}
        <p className="text-xs text-muted-foreground pt-2">
          💡 Sur iOS, ajoutez d'abord Kolimeet à l'écran d'accueil pour recevoir les notifications.
        </p>
      </CardContent>
    </Card>
  );
}
