import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Share2, Users, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ReferralPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remainingReferrals: number;
  referralLink: string;
}

export const ReferralPromptDialog = ({
  open,
  onOpenChange,
  remainingReferrals,
  referralLink,
}: ReferralPromptDialogProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: "Lien copié !",
        description: "Le lien de parrainage a été copié dans le presse-papier",
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

  const handleShare = async () => {
    const shareData = {
      title: "Rejoignez Kolimeet !",
      text: `Je vous invite à rejoindre Kolimeet, la plateforme de transport collaboratif de colis. Utilisez mon lien de parrainage :`,
      url: referralLink,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast({
          title: "Partagé !",
          description: "Merci de partager Kolimeet",
        });
      } else {
        // Fallback: copy to clipboard
        await handleCopy();
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        toast({
          title: "Erreur",
          description: "Impossible de partager le lien",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">
            🎉 Annonce publiée avec succès !
          </DialogTitle>
          <DialogDescription className="text-center space-y-2">
            <p className="text-base">
              Pour rendre votre annonce visible par la communauté, parrainez{" "}
              <span className="font-semibold text-primary">
                {remainingReferrals} personne{remainingReferrals > 1 ? "s" : ""}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              Partagez votre lien de parrainage avec vos amis, votre famille ou sur les réseaux sociaux
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Lien de parrainage */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Votre lien de parrainage</label>
            <div className="flex gap-2">
              <Input
                value={referralLink}
                readOnly
                className="font-mono text-xs"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col gap-2">
            <Button onClick={handleShare} size="lg" className="w-full">
              <Share2 className="h-4 w-4 mr-2" />
              Partager le lien
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              size="lg"
              className="w-full"
            >
              Plus tard
            </Button>
          </div>

          {/* Info supplémentaire */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <span className="text-lg">💡</span>
              <span>
                Dès qu'une personne s'inscrit avec votre lien et accepte votre parrainage, 
                votre annonce deviendra automatiquement visible !
              </span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
