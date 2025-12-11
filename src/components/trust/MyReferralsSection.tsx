import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserPlus, Shield, Loader2 } from 'lucide-react';
import { useReferrals } from '@/hooks/useReferrals';
import { TrustBadge } from './TrustBadge';
import { PendingReferrals } from './PendingReferrals';

const RELATIONSHIP_LABELS: Record<string, string> = {
  friend: 'Ami(e)',
  family: 'Famille',
  colleague: 'Collègue',
  neighbor: 'Voisin(e)',
  other: 'Connaissance',
};

export function MyReferralsSection() {
  const { referrers, referrals, loading } = useReferrals();

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Demandes en attente */}
      <PendingReferrals />

      {/* Mes parrainages */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Mon réseau de confiance
          </CardTitle>
          <CardDescription>
            Vos parrains et filleuls contribuent à votre score de confiance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="referrers" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="referrers" className="text-xs">
                <Users className="h-3.5 w-3.5 mr-1.5" />
                Mes parrains ({referrers.length})
              </TabsTrigger>
              <TabsTrigger value="referrals" className="text-xs">
                <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                Mes filleuls ({referrals.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="referrers" className="mt-0">
              {referrers.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Vous n'avez pas encore de parrain</p>
                  <p className="text-xs mt-1">
                    Demandez à vos proches de vous parrainer pour augmenter votre score de confiance
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {referrers.map((referrer) => (
                    <div 
                      key={referrer.referrer_id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={referrer.referrer_avatar || undefined} />
                        <AvatarFallback className="bg-violet-100 text-violet-700">
                          {referrer.referrer_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{referrer.referrer_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {RELATIONSHIP_LABELS[referrer.relationship] || 'Connaissance'}
                        </p>
                      </div>
                      <TrustBadge 
                        trustScore={referrer.referrer_trust_score} 
                        size="sm" 
                      />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="referrals" className="mt-0">
              {referrals.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <UserPlus className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Vous n'avez pas encore de filleul</p>
                  <p className="text-xs mt-1">
                    Parrainez des personnes que vous connaissez pour les aider à gagner en crédibilité
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {referrals.map((referral) => (
                    <div 
                      key={referral.referred_id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={referral.referred_avatar || undefined} />
                        <AvatarFallback className="bg-violet-100 text-violet-700">
                          {referral.referred_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{referral.referred_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {RELATIONSHIP_LABELS[referral.relationship] || 'Connaissance'}
                        </p>
                      </div>
                      <TrustBadge 
                        trustScore={referral.referred_trust_score} 
                        size="sm" 
                      />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
