import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, UserPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useReferrals, PendingRequest } from '@/hooks/useReferrals';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const RELATIONSHIP_LABELS: Record<string, string> = {
  friend: 'Ami(e)',
  family: 'Famille',
  colleague: 'Collègue',
  neighbor: 'Voisin(e)',
  other: 'Connaissance',
};

export function PendingReferrals() {
  const { toast } = useToast();
  const { pendingRequests, acceptReferral, declineReferral, refresh } = useReferrals();
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (pendingRequests.length === 0) return null;

  const handleAccept = async (referralId: string, referrerName: string) => {
    setProcessingId(referralId);
    try {
      const result = await acceptReferral(referralId);
      if (result.success) {
        toast({
          title: "Parrainage accepté !",
          description: `${referrerName} est maintenant votre parrain.`,
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible d'accepter le parrainage",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'acceptation",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (referralId: string) => {
    setProcessingId(referralId);
    try {
      const result = await declineReferral(referralId);
      if (result.success) {
        toast({
          title: "Demande refusée",
          description: "La demande de parrainage a été refusée.",
        });
        refresh();
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de refuser le parrainage",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors du refus",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Card className="border-violet-200 bg-violet-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-violet-600" />
          Demandes de parrainage
        </CardTitle>
        <CardDescription>
          {pendingRequests.length} demande{pendingRequests.length > 1 ? 's' : ''} en attente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingRequests.map((request: PendingRequest) => (
          <div 
            key={request.id}
            className="flex items-start gap-3 p-3 bg-white rounded-lg border"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={request.referrer_avatar || undefined} />
              <AvatarFallback className="bg-violet-100 text-violet-700">
                {request.referrer_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{request.referrer_name}</p>
              <p className="text-xs text-muted-foreground">
                {RELATIONSHIP_LABELS[request.relationship] || 'Connaissance'} • {formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: fr })}
              </p>
              {request.message && (
                <p className="text-sm text-muted-foreground mt-1 italic">
                  "{request.message}"
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                onClick={() => handleDecline(request.id)}
                disabled={processingId === request.id}
              >
                {processingId === request.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleAccept(request.id, request.referrer_name)}
                disabled={processingId === request.id}
              >
                {processingId === request.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
