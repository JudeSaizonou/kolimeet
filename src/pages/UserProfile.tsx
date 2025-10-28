import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewsList } from "@/components/reviews/ReviewsList";
import { ReviewDialog } from "@/components/reviews/ReviewDialog";
import { supabase } from "@/integrations/supabase/client";
import { Star, MapPin, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface UserProfile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  country: string | null;
  city: string | null;
  rating_avg: number | null;
  rating_count: number | null;
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  useEffect(() => {
    if (userId) {
      loadProfile();
    }
  }, [userId]);

  async function loadProfile() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, country, city, rating_avg, rating_count")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-background pt-16 pb-20">
          <div className="container max-w-4xl mx-auto px-4 py-8">
            <Skeleton className="h-32 w-full mb-8" />
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-background pt-16 pb-20">
          <div className="container max-w-4xl mx-auto px-4 py-8">
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
        </main>
        <Footer />
      </>
    );
  }

  const isOwnProfile = currentUser?.id === userId;
  const displayRating = profile.rating_avg ? Number(profile.rating_avg).toFixed(1) : "0.0";

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background pt-16 pb-20">
        <div className="container max-w-4xl mx-auto px-4 py-8">
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
                <h1 className="text-2xl font-bold mb-2">
                  {profile.full_name || "Utilisateur"}
                </h1>

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

                {!isOwnProfile && currentUser && (
                  <div className="flex gap-2">
                    <Button onClick={() => setReviewDialogOpen(true)} size="sm">
                      Laisser un avis
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/messages">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Contacter
                      </Link>
                    </Button>
                  </div>
                )}

                {isOwnProfile && (
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/profile">Modifier mon profil</Link>
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
      </main>
      <Footer />

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
