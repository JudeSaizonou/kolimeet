import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { shareStoryImage, ShareImagePayload } from '@/lib/utils/shareImage';

interface ShareStoryButtonProps {
  type: 'trip' | 'parcel';
  data: {
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
  };
  element?: HTMLElement | null;
}

export function ShareStoryButton({ type, data, element }: ShareStoryButtonProps) {
  const [loading, setLoading] = useState(false);

  const downloadImage = async () => {
    setLoading(true);
    try {
      // Trouver l'élément GlassCard
      let targetElement = element;
      
      if (!targetElement || targetElement.offsetWidth === 0) {
        // Chercher le GlassCard dans la page
        // D'abord chercher par la structure complète
        const glassCards = document.querySelectorAll('.relative.overflow-hidden');
        for (const card of glassCards) {
          if (card instanceof HTMLElement && 
              card.offsetWidth > 0 && 
              card.offsetHeight > 0 &&
              card.querySelector('[class*="backdrop-blur"]')) {
            targetElement = card;
            break;
          }
        }
        
        // Si toujours pas trouvé, chercher n'importe quel élément avec backdrop-blur
        if (!targetElement || targetElement.offsetWidth === 0) {
          const backdropElement = document.querySelector('[class*="backdrop-blur"]')?.closest('.relative') as HTMLElement;
          if (backdropElement && backdropElement.offsetWidth > 0) {
            targetElement = backdropElement;
          }
        }
      }
      
      const payload: ShareImagePayload = { type, data, element: targetElement || undefined };
      const result = await shareStoryImage(payload);
      const successMessage =
        result === 'shared'
          ? 'Image prête à partager !'
          : 'Image téléchargée ! Partagez-la sur vos réseaux.';
      toast.success(successMessage);
    } catch (error: any) {
      // Ignorer les annulations de partage (AbortError) - c'est un comportement normal
      if (error.name === 'AbortError') {
        // L'utilisateur a annulé, ne rien faire
        return;
      }
      
      // Ne pas logger les erreurs normales (annulation, etc.)
      if (error?.name !== 'AbortError' && error?.message !== 'Share canceled') {
        console.error('Erreur génération image:', error);
      }
      
      const errorMessage = error?.message === 'dom-capture-failed'
        ? "Impossible de capturer l'élément. L'image sera générée via l'API."
        : error?.message === 'image-empty' 
        ? "L'image générée est vide. Réessayez."
        : error?.message === 'image-generation-failed'
        ? "Erreur lors de la génération. Vérifiez votre connexion."
        : "Une erreur est survenue. Réessayez.";
      
      // Seulement afficher l'erreur si ce n'est pas une annulation
      if (error?.name !== 'AbortError' && error?.message !== 'Share canceled') {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={downloadImage} 
      disabled={loading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ImageIcon className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">Télécharger pour Story</span>
      <span className="sm:hidden">Story</span>
    </Button>
  );
}
