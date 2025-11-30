import html2canvas from 'html2canvas';

interface BaseShareData {
  fromCity: string;
  toCity: string;
  fromCountry: string;
  toCountry: string;
  date?: string;
  capacity?: number;
  price?: number;
  weight?: number;
  parcelType?: string;
  deadline?: string;
  reward?: number;
}

export type ShareImagePayload = {
  type: 'trip' | 'parcel';
  data: BaseShareData;
  element?: HTMLElement | null; // Élément DOM à capturer
};

const buildImageUrl = (payload: ShareImagePayload) => {
  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  const params = new URLSearchParams();

  params.set('from', payload.data.fromCity ?? '');
  params.set('to', payload.data.toCity ?? '');
  params.set('fromCountry', payload.data.fromCountry ?? '');
  params.set('toCountry', payload.data.toCountry ?? '');

  if (payload.type === 'trip') {
    if (payload.data.date) params.set('date', payload.data.date);
    if (typeof payload.data.capacity === 'number') {
      params.set('capacity', payload.data.capacity.toString());
    }
    if (typeof payload.data.price === 'number') {
      params.set('price', payload.data.price.toString());
    }
    return `${baseUrl}/api/og/trip?${params.toString()}`;
  }

  if (typeof payload.data.weight === 'number') {
    params.set('weight', payload.data.weight.toString());
  }
  if (payload.data.parcelType) params.set('type', payload.data.parcelType);
  if (payload.data.deadline) params.set('deadline', payload.data.deadline);
  if (typeof payload.data.reward === 'number') {
    params.set('reward', payload.data.reward.toString());
  }
  return `${baseUrl}/api/og/parcel?${params.toString()}`;
};

export type ShareImageResult = 'shared' | 'downloaded';

/**
 * Génère et retourne le blob de l'image sans la partager
 */
export const getImageBlob = async (
  payload: ShareImagePayload
): Promise<Blob> => {
  let blob: Blob | undefined;

  // Si un élément DOM est fourni, capturer directement depuis le DOM
  if (payload.element && payload.element.offsetWidth > 0 && payload.element.offsetHeight > 0) {
    try {
      // Attendre un peu pour que les animations se stabilisent
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const canvas = await html2canvas(payload.element, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: false,
        removeContainer: true,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // Arrêter toutes les animations dans le clone
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            htmlEl.style.animation = 'none';
            htmlEl.style.transition = 'none';
          });
        },
      });
      
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas is empty');
      }
      
      blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob && blob.size > 0) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        }, 'image/png', 1.0);
      });
    } catch (error) {
      console.warn('[shareStoryImage] DOM capture failed, using API fallback:', error);
      // Continue vers le fallback API
    }
  }
  
  // Si pas de blob créé (pas d'élément ou échec), utiliser l'API
  if (!blob) {
    // Fallback: utiliser l'API OG
    const imageUrl = buildImageUrl(payload);
    
    try {
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      blob = await response.blob();
      
      if (!blob || blob.size === 0) {
        throw new Error('API returned empty image');
      }
    } catch (error) {
      console.error('[shareStoryImage] API fallback failed:', error);
      throw new Error('image-generation-failed');
    }
  }

  // Vérifier que l'image n'est pas vide
  if (!blob || blob.size === 0) {
    throw new Error('image-empty');
  }

  return blob;
};

export const shareStoryImage = async (
  payload: ShareImagePayload,
  shareText?: { title?: string; text?: string; url?: string }
): Promise<ShareImageResult> => {
  const blob = await getImageBlob(payload);

  // Pour le moment, on désactive le partage natif mobile car ça télécharge toujours
  // On va utiliser directement le téléchargement et laisser WhatsApp/Facebook gérer le partage
  // TODO: Réactiver le partage natif mobile une fois le problème résolu
  
  // Télécharger l'image directement

  // Télécharger l'image
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `kolimeet-${payload.type}-${payload.data.fromCity}-${payload.data.toCity}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return 'downloaded';
};

