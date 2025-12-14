import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, Loader2, AlertCircle, Shield, Clock, Phone, CheckCircle2 } from 'lucide-react';
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalTrigger,
} from '@/components/ui/responsive-modal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useReferrals, REFERRAL_CONSTRAINTS, EligibilityResult } from '@/hooks/useReferrals';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

interface ReferralRequestDialogProps {
  targetUserId: string;
  targetUserName: string;
  className?: string;
}

const RELATIONSHIPS = [
  { value: 'friend', label: 'Ami(e)', emoji: '👋' },
  { value: 'family', label: 'Famille', emoji: '👨‍👩‍👧‍👦' },
  { value: 'colleague', label: 'Collègue', emoji: '💼' },
  { value: 'neighbor', label: 'Voisin(e)', emoji: '🏠' },
  { value: 'other', label: 'Autre', emoji: '🤝' },
];

export function ReferralRequestDialog({ 
  targetUserId, 
  targetUserName,
  className 
}: ReferralRequestDialogProps) {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { sendReferralRequest, checkReferralEligibility } = useReferrals();
  const [open, setOpen] = useState(false);
  const [relationship, setRelationship] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [checking, setChecking] = useState(true); // Commence à true

  useEffect(() => {
    // Attendre que l'auth soit chargée et qu'on ait un user différent de la cible
    if (!authLoading && user && targetUserId && user.id !== targetUserId) {
      checkEligibility();
    } else if (!authLoading && (!user || user.id === targetUserId)) {
      // Auth chargée mais pas de user ou même utilisateur
      setChecking(false);
    }
  }, [user, authLoading, targetUserId]);

  const checkEligibility = async () => {
    if (!user?.id) return;
    setChecking(true);
    // Passer explicitement l'ID utilisateur pour éviter les problèmes de désync d'auth
    const result = await checkReferralEligibility(targetUserId, user.id);
    setEligibility(result);
    setChecking(false);
  };

  // Pendant le chargement de l'auth ou de l'éligibilité
  if (authLoading || checking) {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  // Ne rien afficher si pas connecté ou si c'est le même utilisateur
  if (!user || user.id === targetUserId) return null;

  // Afficher un bouton désactivé avec info si non éligible
  if (eligibility && !eligibility.canRefer) {
    // Si déjà parrainé
    if (eligibility.reason?.includes('déjà parrainé')) {
      return (
        <Button variant="outline" size="sm" disabled className={className}>
          <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
          Déjà parrainé
        </Button>
      );
    }

    // Si téléphone non vérifié
    if (eligibility.details?.isPhoneVerified === false) {
      return (
        <Button variant="outline" size="sm" asChild className={className}>
          <Link to="/profile">
            <Phone className="h-4 w-4 mr-2 text-amber-500" />
            Vérifier téléphone
          </Link>
        </Button>
      );
    }

    // Autres cas (cooldown, limite, ancienneté)
    return (
      <ResponsiveModal>
        <ResponsiveModalTrigger asChild>
          <Button variant="outline" size="sm" className={`${className} opacity-70`}>
            <UserPlus className="h-4 w-4 mr-2" />
            Parrainer
          </Button>
        </ResponsiveModalTrigger>
        <ResponsiveModalContent className="sm:max-w-md">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Parrainage non disponible
            </ResponsiveModalTitle>
          </ResponsiveModalHeader>
          <div className="py-4 px-4 md:px-0">
            <p className="text-muted-foreground mb-4">{eligibility.reason}</p>
            
            {eligibility.details && (
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-2 text-sm">
                <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Vos informations</h4>
                {eligibility.details.accountAgeDays !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ancienneté du compte :</span>
                    <span className={eligibility.details.accountAgeDays >= REFERRAL_CONSTRAINTS.MIN_ACCOUNT_AGE_DAYS ? 'text-green-600' : 'text-amber-600'}>
                      {eligibility.details.accountAgeDays} jours
                    </span>
                  </div>
                )}
                {eligibility.details.referralCount !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Parrainages effectués :</span>
                    <span className={eligibility.details.referralCount < REFERRAL_CONSTRAINTS.MAX_REFERRALS_AS_REFERRER ? 'text-green-600' : 'text-amber-600'}>
                      {eligibility.details.referralCount}/{REFERRAL_CONSTRAINTS.MAX_REFERRALS_AS_REFERRER}
                    </span>
                  </div>
                )}
                {eligibility.details.isPhoneVerified !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Téléphone vérifié :</span>
                    <span className={eligibility.details.isPhoneVerified ? 'text-green-600' : 'text-amber-600'}>
                      {eligibility.details.isPhoneVerified ? 'Oui ✓' : 'Non'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          <ResponsiveModalFooter className="px-4 pb-4 md:px-0">
            <Button variant="outline" className="w-full md:w-auto">
              Compris
            </Button>
          </ResponsiveModalFooter>
        </ResponsiveModalContent>
      </ResponsiveModal>
    );
  }

  const handleSubmit = async () => {
    if (!relationship) {
      toast({
        title: "Champ requis",
        description: "Veuillez sélectionner votre relation",
        variant: "destructive",
      });
      return;
    }

    // Re-vérifier l'éligibilité avant d'envoyer
    const recheckEligibility = await checkReferralEligibility(targetUserId);
    if (!recheckEligibility.canRefer) {
      toast({
        title: "Parrainage non autorisé",
        description: recheckEligibility.reason,
        variant: "destructive",
      });
      setEligibility(recheckEligibility);
      return;
    }

    setLoading(true);
    try {
      const result = await sendReferralRequest(targetUserId, relationship, message);
      
      if (result.error) {
        if (result.error.includes('duplicate') || result.error.includes('unique')) {
          toast({
            title: "Demande existante",
            description: "Vous avez déjà envoyé une demande de parrainage à cette personne",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erreur",
            description: "Erreur lors de l'envoi de la demande",
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Demande envoyée ! 🎉",
        description: `${targetUserName} recevra une notification et pourra l'accepter.`,
      });
      setOpen(false);
      setRelationship('');
      setMessage('');
      // Rafraîchir l'éligibilité (cooldown maintenant actif)
      setEligibility({ canRefer: false, reason: 'Vous avez déjà parrainé ou envoyé une demande à cette personne' });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'envoi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveModal open={open} onOpenChange={setOpen}>
      <ResponsiveModalTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <UserPlus className="h-4 w-4 mr-2" />
          Parrainer
        </Button>
      </ResponsiveModalTrigger>
      <ResponsiveModalContent className="sm:max-w-md">
        <ResponsiveModalHeader className="px-4 md:px-0">
          <ResponsiveModalTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Parrainer {targetUserName}
          </ResponsiveModalTitle>
          <ResponsiveModalDescription>
            En parrainant quelqu'un, vous certifiez le connaître personnellement 
            et lui faites confiance.
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <div className="space-y-4 py-4 px-4 md:px-0">
          {/* Sélection de la relation avec boutons visuels sur mobile */}
          <div className="space-y-3">
            <Label>Comment connaissez-vous cette personne ? *</Label>
            
            {/* Version mobile : boutons */}
            <div className="grid grid-cols-2 gap-2 md:hidden">
              {RELATIONSHIPS.map((r) => (
                <Button
                  key={r.value}
                  type="button"
                  variant={relationship === r.value ? "default" : "outline"}
                  className="h-auto py-3 flex flex-col gap-1"
                  onClick={() => setRelationship(r.value)}
                >
                  <span className="text-lg">{r.emoji}</span>
                  <span className="text-xs">{r.label}</span>
                </Button>
              ))}
            </div>
            
            {/* Version desktop : select */}
            <div className="hidden md:block">
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez votre relation" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.emoji} {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Message (optionnel)</Label>
            <Textarea
              placeholder="Ex: On se connaît depuis 5 ans, c'est une personne de confiance..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="bg-violet-50 dark:bg-violet-950 p-3 rounded-lg text-sm text-violet-700 dark:text-violet-300">
            <p className="font-medium mb-1">💡 Bon à savoir</p>
            <p className="text-xs mb-2">
              Le parrainage est un engagement de confiance. Ne parrainez que des 
              personnes que vous connaissez vraiment.
            </p>
            <div className="text-xs space-y-1 pt-2 border-t border-violet-200 dark:border-violet-800">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 shrink-0" />
                <span>Délai de {REFERRAL_CONSTRAINTS.COOLDOWN_HOURS}h entre chaque parrainage</span>
              </div>
              <div className="flex items-center gap-1">
                <UserPlus className="h-3 w-3 shrink-0" />
                <span>Maximum {REFERRAL_CONSTRAINTS.MAX_REFERRALS_AS_REFERRER} filleuls par parrain</span>
              </div>
            </div>
          </div>
        </div>

        <ResponsiveModalFooter className="flex-col-reverse gap-2 px-4 pb-4 md:flex-row md:px-0 md:pb-0">
          <Button variant="outline" onClick={() => setOpen(false)} className="w-full md:w-auto">
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!relationship || loading}
            className="w-full md:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              'Envoyer la demande'
            )}
          </Button>
        </ResponsiveModalFooter>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
