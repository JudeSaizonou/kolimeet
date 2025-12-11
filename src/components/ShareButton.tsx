import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Share2, Facebook, MessageCircle, Link as LinkIcon, Check, ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { shareStoryImage, ShareImagePayload, getImageBlob } from "@/lib/utils/shareImage";

interface ShareButtonProps {
  title: string;
  description: string;
  url: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  storyShare?: ShareImagePayload;
}

export function ShareButton({ 
  title, 
  description, 
  url, 
  variant = "outline",
  size = "default",
  className,
  storyShare
}: ShareButtonProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [storyLoading, setStoryLoading] = useState(false);

  const shareUrl = `${window.location.origin}${url}`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Lien copié",
        description: "Le lien a été copié dans le presse-papiers",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien",
        variant: "destructive",
      });
    }
  };

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400');
  };

  const handleStoryShare = async () => {
    if (!storyShare) return;
    try {
      setStoryLoading(true);
      
      // Si element n'est pas fourni, essayer de le trouver
      if (!storyShare.element || storyShare.element.offsetWidth === 0) {
        // Chercher le GlassCard dans la page
        const glassCards = document.querySelectorAll('.relative.overflow-hidden');
        for (const card of glassCards) {
          if (card instanceof HTMLElement && 
              card.offsetWidth > 0 && 
              card.offsetHeight > 0 &&
              card.querySelector('[class*="backdrop-blur"]')) {
            storyShare.element = card;
            break;
          }
        }
        
        // Si toujours pas trouvé, chercher n'importe quel élément avec backdrop-blur
        if (!storyShare.element || storyShare.element.offsetWidth === 0) {
          const backdropElement = document.querySelector('[class*="backdrop-blur"]')?.closest('.relative') as HTMLElement;
          if (backdropElement && backdropElement.offsetWidth > 0) {
            storyShare.element = backdropElement;
          }
        }
      }
      
      const result = await shareStoryImage(storyShare, {
        title,
        text: description,
        url: shareUrl,
      });
      toast({
        title: result === 'shared' ? 'Partage natif ouvert' : 'Image téléchargée',
        description:
          result === 'shared'
            ? 'Publiez directement dans votre story avec le lien.'
            : "Retrouvez l'image dans vos téléchargements.",
      });
    } catch (error: any) {
      // Ignorer les annulations de partage (AbortError) - c'est un comportement normal
      if (error.name === 'AbortError') {
        // L'utilisateur a annulé, ne rien faire
        return;
      }
      
      // Ne pas logger les erreurs normales
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
        toast({
          title: "Erreur",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setStoryLoading(false);
    }
  };

  // Si l'API Web Share est disponible (mobile) - partager l'image si disponible
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        // Si on a storyShare, générer et partager l'image directement
        if (storyShare) {
          setStoryLoading(true);
          try {
            const result = await shareStoryImage(storyShare);
            setStoryLoading(false);
            if (result === 'shared') {
              // Déjà partagé via l'API native
              toast({
                title: "Image partagée",
                description: "L'image a été partagée avec succès.",
              });
              return;
            }
            // Si téléchargée, on peut aussi partager le lien
          } catch (error: any) {
            setStoryLoading(false);
            if (error.name === 'AbortError') {
              return;
            }
            // En cas d'erreur, fallback vers le partage de lien
            console.warn('Erreur partage image, fallback lien:', error);
          }
        }
        
        // Fallback: partager le lien texte
        await navigator.share({
          title,
          text: description,
          url: shareUrl,
        });
      } catch (error: any) {
        // Ignorer les annulations de partage (AbortError) - c'est un comportement normal
        if (error.name !== 'AbortError') {
          console.error('Erreur lors du partage:', error);
        }
      }
    }
  };

  // Fonction pour partager via WhatsApp
  const handleShareWhatsApp = async () => {
    if (!storyShare) return;
    try {
      setStoryLoading(true);
      
      // Préparer l'élément si nécessaire
      if (!storyShare.element || storyShare.element.offsetWidth === 0) {
        const glassCards = document.querySelectorAll('.relative.overflow-hidden');
        for (const card of glassCards) {
          if (card instanceof HTMLElement && 
              card.offsetWidth > 0 && 
              card.offsetHeight > 0 &&
              card.querySelector('[class*="backdrop-blur"]')) {
            storyShare.element = card;
            break;
          }
        }
      }
      
      // Utiliser le partage natif (comme le bouton principal)
      // Cela ouvrira le menu de partage natif où l'utilisateur peut choisir WhatsApp
      const result = await shareStoryImage(storyShare, {
        title,
        text: description,
        url: shareUrl,
      });
      
      if (result === 'shared') {
        toast({
          title: "Partage ouvert",
          description: "Choisissez WhatsApp dans le menu de partage",
        });
      } else {
        // Si le partage natif n'est pas disponible, fallback vers l'ancienne méthode
        const blob = await getImageBlob(storyShare);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `kolimeet-${storyShare.type}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        const message = `${title}\n\n${description}\n\n${shareUrl}`;
        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        } else {
          window.open(`https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
        }
        
        toast({
          title: "Image téléchargée",
          description: "Partagez l'image via WhatsApp",
        });
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return;
      }
      console.error('Erreur partage WhatsApp:', error);
      toast({
        title: "Erreur",
        description: "Impossible de partager via WhatsApp",
        variant: "destructive",
      });
    } finally {
      setStoryLoading(false);
    }
  };

  // Fonction pour partager via Facebook
  const handleShareFacebook = async () => {
    if (!storyShare) return;
    try {
      setStoryLoading(true);
      
      // Préparer l'élément si nécessaire
      if (!storyShare.element || storyShare.element.offsetWidth === 0) {
        const glassCards = document.querySelectorAll('.relative.overflow-hidden');
        for (const card of glassCards) {
          if (card instanceof HTMLElement && 
              card.offsetWidth > 0 && 
              card.offsetHeight > 0 &&
              card.querySelector('[class*="backdrop-blur"]')) {
            storyShare.element = card;
            break;
          }
        }
      }
      
      // Utiliser le partage natif (comme le bouton principal)
      // Cela ouvrira le menu de partage natif où l'utilisateur peut choisir Facebook
      const result = await shareStoryImage(storyShare, {
        title,
        text: description,
        url: shareUrl,
      });
      
      if (result === 'shared') {
        toast({
          title: "Partage ouvert",
          description: "Choisissez Facebook dans le menu de partage",
        });
      } else {
        // Si le partage natif n'est pas disponible, fallback vers l'ancienne méthode
        const blob = await getImageBlob(storyShare);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `kolimeet-${storyShare.type}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
        toast({
          title: "Image téléchargée",
          description: "Partagez l'image téléchargée sur Facebook",
        });
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return;
      }
      console.error('Erreur partage Facebook:', error);
      toast({
        title: "Erreur",
        description: "Impossible de partager via Facebook",
        variant: "destructive",
      });
    } finally {
      setStoryLoading(false);
    }
  };

  // Fonction pour partager via Instagram
  const handleShareInstagram = async () => {
    if (!storyShare) return;
    try {
      setStoryLoading(true);
      
      // Préparer l'élément si nécessaire
      if (!storyShare.element || storyShare.element.offsetWidth === 0) {
        const glassCards = document.querySelectorAll('.relative.overflow-hidden');
        for (const card of glassCards) {
          if (card instanceof HTMLElement && 
              card.offsetWidth > 0 && 
              card.offsetHeight > 0 &&
              card.querySelector('[class*="backdrop-blur"]')) {
            storyShare.element = card;
            break;
          }
        }
      }
      
      // Utiliser le partage natif pour Instagram
      const result = await shareStoryImage(storyShare, {
        title,
        text: description,
        url: shareUrl,
      });
      
      if (result === 'shared') {
        toast({
          title: "Partage ouvert",
          description: "Choisissez Instagram dans le menu de partage",
        });
      } else {
        // Si le partage natif n'est pas disponible, télécharger l'image
        const blob = await getImageBlob(storyShare);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `kolimeet-${storyShare.type}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Image téléchargée",
          description: "Ouvrez Instagram et partagez l'image téléchargée",
        });
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return;
      }
      console.error('Erreur partage Instagram:', error);
      toast({
        title: "Erreur",
        description: "Impossible de partager via Instagram",
        variant: "destructive",
      });
    } finally {
      setStoryLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className={className}
          disabled={storyLoading}
        >
          {storyLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {size !== "icon" && <span className="ml-2">Préparation...</span>}
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4" />
              {size !== "icon" && <span className="ml-2">Partager</span>}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {storyShare ? (
          <>
            {/* Options de partage d'image */}
            <DropdownMenuItem onClick={handleStoryShare} disabled={storyLoading}>
              {storyLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Préparation...
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Partager l'image
                </>
              )}
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => handleShare('twitter')} disabled={storyLoading}>
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Partager sur X (Twitter)
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={handleShareInstagram} disabled={storyLoading}>
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              Partager sur Instagram
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={handleShareWhatsApp} disabled={storyLoading}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Partager sur WhatsApp
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={handleShareFacebook} disabled={storyLoading}>
              <Facebook className="h-4 w-4 mr-2" />
              Partager sur Facebook
            </DropdownMenuItem>
            
            <div className="h-px bg-border my-1" />
            
            {/* Options de partage de lien */}
            <DropdownMenuItem onClick={handleCopyLink}>
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  Lien copié !
                </>
              ) : (
                <>
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Copier le lien
                </>
              )}
            </DropdownMenuItem>
            
            {navigator.share && (
              <DropdownMenuItem onClick={handleNativeShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Partager le lien
              </DropdownMenuItem>
            )}
          </>
        ) : (
          <>
            {navigator.share && (
              <DropdownMenuItem onClick={handleNativeShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Partager
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem onClick={() => handleShare('facebook')}>
              <Facebook className="h-4 w-4 mr-2" />
              Facebook
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => handleShare('twitter')}>
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              X (Twitter)
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleCopyLink}>
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  Lien copié !
                </>
              ) : (
                <>
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Copier le lien
                </>
              )}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
