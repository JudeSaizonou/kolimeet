import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, UserPlus } from 'lucide-react';
import { useReferrals, SentPendingRequest } from '@/hooks/useReferrals';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const RELATIONSHIP_LABELS: Record<string, string> = {
  friend: 'Ami(e)',
  family: 'Famille',
  colleague: 'Collègue',
  neighbor: 'Voisin(e)',
  other: 'Connaissance',
};

export function SentPendingReferrals() {
  const { sentPendingRequests } = useReferrals();

  if (sentPendingRequests.length === 0) return null;

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-600" />
          Demandes envoyées
        </CardTitle>
        <CardDescription>
          {sentPendingRequests.length} demande{sentPendingRequests.length > 1 ? 's' : ''} en attente de réponse
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {sentPendingRequests.map((request: SentPendingRequest) => (
          <div 
            key={request.id}
            className="flex items-start gap-3 p-3 bg-white rounded-lg border"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={request.referred_avatar || undefined} />
              <AvatarFallback className="bg-amber-100 text-amber-700">
                {request.referred_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{request.referred_name}</p>
              <p className="text-xs text-muted-foreground">
                {RELATIONSHIP_LABELS[request.relationship] || 'Connaissance'} • Envoyé {formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: fr })}
              </p>
              {request.message && (
                <p className="text-sm text-muted-foreground mt-1 italic">
                  "{request.message}"
                </p>
              )}
            </div>

            <div className="flex items-center text-xs text-amber-600">
              <Clock className="h-3.5 w-3.5 mr-1" />
              En attente
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
