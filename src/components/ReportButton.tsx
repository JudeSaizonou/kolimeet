import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Flag } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ReportButtonProps {
  targetType: 'trip' | 'parcel' | 'user' | 'message';
  targetId: string;
  targetUserId?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
}

const REPORT_REASONS = [
  { value: 'illegal_items', label: 'Articles illégaux suspectés' },
  { value: 'scam', label: 'Tentative d\'arnaque' },
  { value: 'fake_profile', label: 'Faux profil / Usurpation d\'identité' },
  { value: 'harassment', label: 'Harcèlement ou comportement abusif' },
  { value: 'inappropriate', label: 'Contenu inapproprié' },
  { value: 'no_show', label: 'Ne s\'est pas présenté au rendez-vous' },
  { value: 'damaged_parcel', label: 'Colis endommagé ou volé' },
  { value: 'false_info', label: 'Informations fausses ou trompeuses' },
  { value: 'other', label: 'Autre' },
];

export function ReportButton({ 
  targetType, 
  targetId, 
  targetUserId,
  variant = 'ghost',
  size = 'sm',
  showText = true
}: ReportButtonProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user || !reason) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        target_type: targetType,
        target_id: targetId,
        target_user_id: targetUserId,
        reason,
        description: description || null,
        status: 'pending',
      });

      if (error) throw error;

      toast({
        title: 'Signalement envoyé',
        description: 'Notre équipe examinera votre signalement dans les plus brefs délais.',
      });
      setOpen(false);
      setReason('');
      setDescription('');
    } catch (error: any) {
      console.error('Error submitting report:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du signalement. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Ne pas afficher le bouton si l'utilisateur n'est pas connecté ou s'il est le propriétaire
  if (!user || user.id === targetUserId) return null;

  const getTargetLabel = () => {
    switch (targetType) {
      case 'trip': return 'ce trajet';
      case 'parcel': return 'ce colis';
      case 'user': return 'cet utilisateur';
      case 'message': return 'ce message';
      default: return 'cet élément';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className="text-muted-foreground hover:text-destructive"
        >
          <Flag className="h-4 w-4" />
          {showText && <span className="ml-1">Signaler</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Signaler {getTargetLabel()}</DialogTitle>
          <DialogDescription>
            Aidez-nous à maintenir une communauté sûre en signalant tout comportement suspect 
            ou contenu inapproprié. Votre signalement sera traité de manière confidentielle.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Raison du signalement *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Sélectionnez une raison" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              placeholder="Décrivez le problème en détail pour nous aider à mieux comprendre la situation..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Plus vous êtes précis, plus nous pourrons traiter votre signalement efficacement.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!reason || loading}
            variant="destructive"
          >
            {loading ? 'Envoi...' : 'Envoyer le signalement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
