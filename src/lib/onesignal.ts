import OneSignal from 'react-onesignal';

// Configuration OneSignal
// Tu devras créer un compte sur https://onesignal.com et récupérer ton App ID
const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || '';

let isInitialized = false;

/**
 * Initialise OneSignal pour les notifications push
 * Fonctionne sur iOS PWA, Android, et tous les navigateurs
 */
export async function initOneSignal() {
  if (isInitialized || !ONESIGNAL_APP_ID) {
    console.log('[OneSignal] Déjà initialisé ou App ID manquant');
    return;
  }

  try {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
      serviceWorkerParam: {
        scope: '/'
      },
      serviceWorkerPath: '/OneSignalSDKWorker.js',
    });

    isInitialized = true;
    console.log('[OneSignal] ✅ Initialisé avec succès');
    
    // Écouter les changements de permission
    OneSignal.Notifications.addEventListener('permissionChange', (permission) => {
      console.log('[OneSignal] Permission changée:', permission);
    });

  } catch (error) {
    console.error('[OneSignal] Erreur initialisation:', error);
  }
}

/**
 * Demande la permission pour les notifications
 * Doit être appelé en réponse à un geste utilisateur (clic)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isInitialized) {
    console.log('[OneSignal] Non initialisé');
    return false;
  }

  try {
    await OneSignal.Notifications.requestPermission();
    const permission = await OneSignal.Notifications.permission;
    console.log('[OneSignal] Permission après demande:', permission);
    return permission;
  } catch (error) {
    console.error('[OneSignal] Erreur demande permission:', error);
    return false;
  }
}

/**
 * Vérifie si les notifications sont activées
 */
export async function isNotificationEnabled(): Promise<boolean> {
  if (!isInitialized) return false;
  
  try {
    return await OneSignal.Notifications.permission;
  } catch {
    return false;
  }
}

/**
 * Associe l'ID utilisateur Supabase à OneSignal pour cibler les notifications
 */
export async function setExternalUserId(userId: string) {
  if (!isInitialized) return;
  
  try {
    await OneSignal.login(userId);
    console.log('[OneSignal] ✅ User ID défini:', userId);
  } catch (error) {
    console.error('[OneSignal] Erreur setExternalUserId:', error);
  }
}

/**
 * Déconnecte l'utilisateur de OneSignal
 */
export async function removeExternalUserId() {
  if (!isInitialized) return;
  
  try {
    await OneSignal.logout();
    console.log('[OneSignal] User ID supprimé');
  } catch (error) {
    console.error('[OneSignal] Erreur removeExternalUserId:', error);
  }
}

/**
 * Ajoute un tag pour segmenter les notifications
 */
export async function addTag(key: string, value: string) {
  if (!isInitialized) return;
  
  try {
    await OneSignal.User.addTag(key, value);
  } catch (error) {
    console.error('[OneSignal] Erreur addTag:', error);
  }
}

export { OneSignal };
