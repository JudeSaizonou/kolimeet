import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewsList } from "@/components/reviews/ReviewsList";
import { ReviewDialog } from "@/components/reviews/ReviewDialog";
import { supabase } from "@/integrations/supabase/client";
import { Star, MapPin, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useReferrals } from "@/hooks/useReferrals";
import { TrustBadge, ReferralRequestDialog, ReferrersList } from "@/components/trust";

interface UserProfile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  country: string | null;
  city: string | null;
  rating_avg: number | null;
  rating_count: number | null;
  trust_score?: number;
  is_verified?: boolean;
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const { getReferrersForUser } = useReferrals();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [referrers, setReferrers] = useState<any[]>([]);

  const loadProfile = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, country, city, rating_avg, rating_count, trust_score, is_verified")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Charger les parrains séparément pour éviter les re-fetches
  const loadReferrers = useCallback(async () => {
    if (!userId) return;
    try {
      const userReferrers = await getReferrersForUser(userId);
      setReferrers(userReferrers);
    } catch (error) {
      console.error("Error loading referrers:", error);
    }
  }, [userId, getReferrersForUser]);

  useEffect(() => {
    if (userId) {
      loadProfile();
      loadReferrers();

      // Temps réel : écouter les changements du profil de cet utilisateur
      const channel = supabase
        .channel(`user-profile-${userId}`)
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'profiles',
            filter: `user_id=eq.${userId}`
          },
          () => {
            console.log('[UserProfile] 🔔 User profile changed, reloading...');
            loadProfile();
          }
        )
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'reviews',
            filter: `target_user_id=eq.${userId}`
          },
          () => {
            console.log('[UserProfile] 🔔 Reviews changed, reloading...');
            loadProfile();
          }
        )
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'referrals',
            filter: `referred_id=eq.${userId}`
          },
          () => {
            console.log('[UserProfile] 🔔 Referrals changed, reloading...');
            loadReferrers();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userId, loadProfile, loadReferrers]);

  if (loading) {
    return (
      <div className="bg-background min-h-screen pt-20 md:pt-28 py-8">
        <div className="container max-w-4xl mx-auto px-4">
          <Skeleton className="h-32 w-full mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-background min-h-screen pt-20 md:pt-28 py-8">
        <div className="container max-w-4xl mx-auto px-4">
          <Card className="p-8 text-center">
            <h1 className="text-xl font-semibold mb-2">Profil introuvable</h1>
            <p className="text-muted-foreground mb-4">
              Cet utilisateur n'existe pas ou a supprimé son compte.
            </p>
            <Button asChild>
              <Link to="/">Retour à l'accueil</Link>
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;
  const displayRating = profile.rating_avg ? Number(profile.rating_avg).toFixed(1) : "0.0";

  return (
    <>
      <div className="bg-background min-h-screen pt-20 md:pt-28 py-8">
        <div className="container max-w-4xl mx-auto px-4">
          {/* Profile Header */}
          <Card className="p-6 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {profile.full_name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">
                    {profile.full_name || "Utilisateur"}
                  </h1>
                  <TrustBadge 
                    trustScore={profile.trust_score || 50} 
                    referredByCount={referrers.length}
                    isVerified={profile.is_verified}
                    size="md"
                  />
                </div>

                {(profile.city || profile.country) && (
                  <div className="flex items-center gap-2 text-muted-foreground mb-3">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">
                      {[profile.city, profile.country].filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-[#F59E0B] text-[#F59E0B]" />
                    <span className="font-semibold">{displayRating}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({profile.rating_count || 0} avis)
                  </span>
                </div>
                
                {/* Liste des parrains */}
                {referrers.length > 0 && (
                  <div className="flex items-center gap-2 mb-4 p-3 bg-violet-50 rounded-xl">
                    <ReferrersList referrers={referrers} maxDisplay={4} size="sm" />
                    <span className="text-sm text-violet-700">
                      Parrainé par {referrers.length} personne{referrers.length > 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                {!isOwnProfile && currentUser && (
                  <div className="flex gap-2 flex-wrap">
                    <Button onClick={() => setReviewDialogOpen(true)} size="sm">
                      Laisser un avis
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/messages">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Contacter
                      </Link>
                    </Button>
                    <ReferralRequestDialog
                      targetUserId={profile.user_id}
                      targetUserName={profile.full_name || 'cet utilisateur'}
                    />
                  </div>
                )}

                {isOwnProfile && (
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/profil">Modifier mon profil</Link>
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Reviews Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Avis ({profile.rating_count || 0})
            </h2>
            <ReviewsList targetUserId={profile.user_id} />
          </div>
        </div>
      </div>

      {!isOwnProfile && currentUser && (
        <ReviewDialog
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          targetUserId={profile.user_id}
          targetUserName={profile.full_name || "cet utilisateur"}
        />
      )}
    </>
  );
}
