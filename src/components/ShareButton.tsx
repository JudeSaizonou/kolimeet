import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Share2, Facebook, MessageCircle, Link as LinkIcon, Check, ImageIcon, Loader2, Copy } from "lucide-react";
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
  const [imageCopied, setImageCopied] = useState(false);
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

  // Fonction pour copier l'image dans le presse-papiers
  const handleCopyImage = async () => {
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
      
      const blob = await getImageBlob(storyShare);
      
      // Copier l'image dans le presse-papiers
      if (navigator.clipboard && navigator.clipboard.write) {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        setImageCopied(true);
        toast({
          title: "Image copiée",
          description: "L'image a été copiée dans le presse-papiers",
        });
        setTimeout(() => setImageCopied(false), 2000);
      } else {
        // Fallback: télécharger l'image
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `kolimeet-${storyShare.type}-${storyShare.data.fromCity}-${storyShare.data.toCity}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({
          title: "Image téléchargée",
          description: "L'image a été téléchargée (copie non supportée sur ce navigateur)",
        });
      }
    } catch (error: any) {
      console.error('Erreur copie image:', error);
      toast({
        title: "Erreur",
        description: "Impossible de copier l'image",
        variant: "destructive",
      });
    } finally {
      setStoryLoading(false);
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
      
      // Générer l'image
      const blob = await getImageBlob(storyShare);
      const file = new File([blob], `kolimeet-${storyShare.type}.png`, {
        type: 'image/png',
      });
      
      // Utiliser l'API Web Share pour ouvrir directement WhatsApp avec l'image
      if (navigator.share && navigator.canShare) {
        const shareData: ShareData = {
          files: [file],
          title: title,
          text: `${description}\n\n${shareUrl}`,
          url: shareUrl,
        };
        
        // Vérifier si on peut partager avec cette configuration
        if (navigator.canShare(shareData)) {
          try {
            await navigator.share(shareData);
            toast({
              title: "Partage ouvert",
              description: "Choisissez WhatsApp dans le menu de partage",
            });
            return;
          } catch (error: any) {
            if (error.name === 'AbortError') {
              return;
            }
            // Si erreur, essayer seulement avec les fichiers
            const filesOnly: ShareData = { files: [file] };
            if (navigator.canShare(filesOnly)) {
              try {
                await navigator.share(filesOnly);
                toast({
                  title: "Partage ouvert",
                  description: "Choisissez WhatsApp dans le menu de partage",
                });
                return;
              } catch (fileError: any) {
                if (fileError.name === 'AbortError') {
                  return;
                }
              }
            }
          }
        } else {
          // Si canShare retourne false, essayer quand même
          try {
            await navigator.share(shareData);
            toast({
              title: "Partage ouvert",
              description: "Choisissez WhatsApp dans le menu de partage",
            });
            return;
          } catch (error: any) {
            if (error.name === 'AbortError') {
              return;
            }
          }
        }
      }
      
      // Fallback: télécharger l'image et ouvrir WhatsApp avec le texte
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
      
      // Générer l'image
      const blob = await getImageBlob(storyShare);
      const file = new File([blob], `kolimeet-${storyShare.type}.png`, {
        type: 'image/png',
      });
      
      // Utiliser l'API Web Share pour ouvrir directement Facebook avec l'image
      if (navigator.share && navigator.canShare) {
        const shareData: ShareData = {
          files: [file],
          title: title,
          text: `${description}\n\n${shareUrl}`,
          url: shareUrl,
        };
        
        // Vérifier si on peut partager avec cette configuration
        if (navigator.canShare(shareData)) {
          try {
            await navigator.share(shareData);
            toast({
              title: "Partage ouvert",
              description: "Choisissez Facebook dans le menu de partage",
            });
            return;
          } catch (error: any) {
            if (error.name === 'AbortError') {
              return;
            }
            // Si erreur, essayer seulement avec les fichiers
            const filesOnly: ShareData = { files: [file] };
            if (navigator.canShare(filesOnly)) {
              try {
                await navigator.share(filesOnly);
                toast({
                  title: "Partage ouvert",
                  description: "Choisissez Facebook dans le menu de partage",
                });
                return;
              } catch (fileError: any) {
                if (fileError.name === 'AbortError') {
                  return;
                }
              }
            }
          }
        } else {
          // Si canShare retourne false, essayer quand même
          try {
            await navigator.share(shareData);
            toast({
              title: "Partage ouvert",
              description: "Choisissez Facebook dans le menu de partage",
            });
            return;
          } catch (error: any) {
            if (error.name === 'AbortError') {
              return;
            }
          }
        }
      }
      
      // Fallback: télécharger l'image et ouvrir Facebook
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
            
            <DropdownMenuItem onClick={handleCopyImage} disabled={storyLoading}>
              {imageCopied ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  Image copiée !
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copier l'image
                </>
              )}
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
