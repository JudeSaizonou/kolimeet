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
      
      // Déterminer le scale optimal basé sur le devicePixelRatio
      const dpr = window.devicePixelRatio || 1;
      const optimalScale = Math.max(3, dpr * 2); // Minimum 3x pour haute qualité
      
      const canvas = await html2canvas(payload.element, {
        backgroundColor: '#ffffff',
        scale: optimalScale, // Scale dynamique pour haute fidélité
        useCORS: true,
        logging: false,
        allowTaint: true, // Permettre les images cross-origin
        removeContainer: true,
        imageTimeout: 15000,
        // Options de qualité supérieure
        windowWidth: payload.element.scrollWidth,
        windowHeight: payload.element.scrollHeight,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc, clonedElement) => {
          // Forcer le fond blanc sur l'élément principal
          if (clonedElement instanceof HTMLElement) {
            clonedElement.style.backgroundColor = '#ffffff';
            clonedElement.style.transform = 'none';
            clonedElement.style.width = `${payload.element!.offsetWidth}px`;
            clonedElement.style.height = `${payload.element!.offsetHeight}px`;
          }
          
          // Arrêter toutes les animations et améliorer le rendu
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            htmlEl.style.animation = 'none';
            htmlEl.style.transition = 'none';
            // Forcer l'antialiasing du texte
            htmlEl.style.webkitFontSmoothing = 'antialiased';
            (htmlEl.style as any).textRendering = 'optimizeLegibility';
            
            // Remplacer les fonds pastel par du blanc pour un rendu plus propre
            const bgColor = window.getComputedStyle(htmlEl).backgroundColor;
            if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
              // Garder les fonds colorés foncés (badges, boutons) mais blanchir les fonds pastel
              const match = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
              if (match) {
                const [, r, g, b] = match.map(Number);
                // Si c'est un fond très clair (pastel), le remplacer par blanc
                if (r > 240 && g > 240 && b > 250) {
                  htmlEl.style.backgroundColor = '#ffffff';
                }
                // Si c'est un fond violet/lavande clair
                if (r > 230 && g > 220 && b > 240) {
                  htmlEl.style.backgroundColor = '#ffffff';
                }
              }
            }
          });
          
          // Convertir les SVG en inline pour meilleur rendu
          const svgs = clonedDoc.querySelectorAll('svg');
          svgs.forEach((svg) => {
            // S'assurer que les SVG ont des dimensions explicites
            const rect = svg.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              svg.setAttribute('width', String(rect.width));
              svg.setAttribute('height', String(rect.height));
            }
            // Forcer le fill des paths si pas défini
            svg.querySelectorAll('path, circle, rect, line, polyline, polygon').forEach((path) => {
              const currentFill = path.getAttribute('fill');
              const currentStroke = path.getAttribute('stroke');
              if (!currentFill && !currentStroke) {
                path.setAttribute('fill', 'currentColor');
              }
            });
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
        }, 'image/png', 1.0); // PNG qualité maximale
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

  // Vérifier si l'API Web Share est disponible
  if (navigator.share) {
    const file = new File([blob], `kolimeet-${payload.type}.png`, {
      type: 'image/png',
    });
    
    // Essayer d'abord avec image + texte + URL
    let shareData: ShareData = { 
      files: [file]
    };
    
    // Ajouter le texte et l'URL si fournis
    if (shareText?.title) {
      shareData.title = shareText.title;
    }
    if (shareText?.text) {
      shareData.text = shareText.text;
    }
    if (shareText?.url) {
      shareData.url = shareText.url;
    }

    // Essayer de partager avec image + texte + URL
    // Note: Certains navigateurs ont des bugs avec canShare, donc on essaie toujours
    let shareAttempted = false;
    try {
      // Essayer le partage même si canShare retourne false (certains navigateurs ont des bugs)
      await navigator.share(shareData);
      return 'shared';
    } catch (error: any) {
      shareAttempted = true;
      // Si l'utilisateur a annulé, on passe au téléchargement
      if (error.name === 'AbortError') {
        // Ne pas throw, continuer avec le téléchargement
      } else if (error.name === 'NotSupportedError' || error.message?.includes('not supported')) {
        // Le navigateur ne supporte pas cette combinaison, essayer seulement avec les fichiers
        // Ne pas throw, continuer avec l'essai suivant
      } else {
        // Autre erreur, essayer seulement avec les fichiers
        // Ne pas throw, continuer avec l'essai suivant
      }
    }

    // Si le partage avec texte a échoué, essayer seulement avec les fichiers
    // (certains navigateurs ne supportent pas fichiers + texte)
    const filesOnlyData: ShareData = { files: [file] };
    
    // Détecter si on est sur mobile
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Sur mobile, vérifier si le navigateur supporte vraiment le partage de fichiers
    // Certains navigateurs (comme Safari iOS) peuvent ouvrir l'image au lieu de partager
    if (isMobile && navigator.canShare) {
      const canShareFiles = navigator.canShare(filesOnlyData);
      if (!canShareFiles && shareText) {
        // Le navigateur ne supporte pas le partage de fichiers
        // Partager le texte/URL et télécharger l'image
        try {
          const shareTextData: ShareData = {
            title: shareText.title,
            text: shareText.text ? `${shareText.text}\n\n${shareText.url || ''}` : shareText.title,
            url: shareText.url,
          };
          
          await navigator.share(shareTextData);
          // Télécharger l'image après le partage du texte
          // (on continue vers le téléchargement en bas)
        } catch (textError: any) {
          if (textError.name === 'AbortError') {
            return 'downloaded'; // L'utilisateur a annulé, on télécharge quand même
          }
          // Si le partage de texte échoue, continuer vers le téléchargement
        }
      }
    }
    
    try {
      // Essayer le partage même si canShare retourne false (certains navigateurs ont des bugs)
      await navigator.share(filesOnlyData);
      return 'shared';
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // L'utilisateur a annulé, continuer avec le téléchargement
        // Ne pas throw, on va télécharger l'image
      } else {
        // Si le navigateur ne supporte pas le partage de fichiers,
        // essayer de partager juste le texte/URL
        if (shareText && !isMobile) {
          try {
            const shareTextData: ShareData = {
              title: shareText.title,
              text: shareText.text ? `${shareText.text}\n\n${shareText.url || ''}` : shareText.title,
              url: shareText.url,
            };
            
            await navigator.share(shareTextData);
            // Télécharger l'image après le partage du texte
            // (on continue vers le téléchargement en bas)
          } catch (textError: any) {
            if (textError.name !== 'AbortError') {
              // Si le partage de texte échoue aussi, continuer vers le téléchargement
            }
          }
        }
        // Autre erreur, continuer vers le téléchargement
        // Ne pas throw, on va télécharger l'image
      }
    }
  }

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

