import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/useAdmin";
import {
  ArrowLeft,
  Ban,
  UserX,
  RefreshCw,
  Mail,
  MapPin,
  Calendar,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  city: string | null;
  country: string | null;
  trust_score: number;
  is_verified: boolean;
  is_banned: boolean;
  banned_until: string | null;
  ban_reason: string | null;
  is_suspended: boolean;
  suspended_until: string | null;
  suspension_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  created_at: string;
  status?: string;
}

export default function UserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canManageUsers } = useAdmin();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [banDuration, setBanDuration] = useState("30");
  const [banReason, setBanReason] = useState("");
  const [suspendDuration, setSuspendDuration] = useState("7");
  const [suspendReason, setSuspendReason] = useState("");

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*, auth.users(email)")
        .eq("user_id", userId)
        .single();

      if (profileError) throw profileError;

      setProfile(profileData as any);

      // Fetch user activities (trips + parcels)
      const [tripsRes, parcelsRes] = await Promise.all([
        supabase
          .from("trips")
          .select("id, from_city, to_city, status, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("parcels")
          .select("id, from_city, to_city, status, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      const combinedActivities: ActivityItem[] = [
        ...(tripsRes.data || []).map((trip) => ({
          id: trip.id,
          type: "trip",
          title: `Trajet ${trip.from_city} → ${trip.to_city}`,
          created_at: trip.created_at,
          status: trip.status,
        })),
        ...(parcelsRes.data || []).map((parcel) => ({
          id: parcel.id,
          type: "parcel",
          title: `Colis ${parcel.from_city} → ${parcel.to_city}`,
          created_at: parcel.created_at,
          status: parcel.status,
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setActivities(combinedActivities);

      // Fetch reviews
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("*")
        .eq("target_user_id", userId)
        .order("created_at", { ascending: false });

      setReviews(reviewsData || []);

      // Fetch flags
      const { data: flagsData } = await supabase
        .from("flags")
        .select("*")
        .eq("flagged_user_id", userId)
        .order("created_at", { ascending: false });

      setFlags(flagsData || []);
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données utilisateur",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!canManageUsers()) return;

    try {
      const { error } = await supabase.rpc("admin_ban_user" as any, {
        p_user_id: userId,
        p_reason: banReason || "Banni par l'administrateur",
        p_permanent: false,
        p_duration_days: parseInt(banDuration),
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Utilisateur banni pour ${banDuration} jours`,
      });

      fetchUserData();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de bannir l'utilisateur",
        variant: "destructive",
      });
    }
  };

  const handleSuspendUser = async () => {
    if (!canManageUsers()) return;

    try {
      const { error } = await supabase.rpc("admin_suspend_user" as any, {
        p_user_id: userId,
        p_reason: suspendReason || "Suspendu par l'administrateur",
        p_duration_days: parseInt(suspendDuration),
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Utilisateur suspendu pour ${suspendDuration} jours`,
      });

      fetchUserData();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de suspendre l'utilisateur",
        variant: "destructive",
      });
    }
  };

  const handleResetTrustScore = async (newScore: number) => {
    if (!canManageUsers()) return;

    try {
      const { error } = await supabase.rpc("admin_reset_trust_score" as any, {
        p_user_id: userId,
        p_new_score: newScore,
        p_reason: "Réinitialisé par l'administrateur",
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Trust score mis à jour à ${newScore}`,
      });

      fetchUserData();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier le trust score",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Utilisateur introuvable</p>
        <Button onClick={() => navigate("/admin/users")} className="mt-4">
          Retour à la liste
        </Button>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (profile.is_banned) {
      return <Badge variant="destructive">Banni</Badge>;
    }
    if (profile.is_suspended) {
      return <Badge variant="secondary">Suspendu</Badge>;
    }
    if (profile.is_verified) {
      return <Badge variant="default">Vérifié</Badge>;
    }
    return <Badge variant="outline">Actif</Badge>;
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/users")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <Button onClick={fetchUserData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">
                {profile.full_name?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">
                  {profile.full_name || "Sans nom"}
                </h1>
                {getStatusBadge()}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {profile.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{profile.email}</span>
                  </div>
                )}
                {profile.city && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {profile.city}, {profile.country}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Membre depuis{" "}
                    {new Date(profile.created_at).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className={getTrustScoreColor(profile.trust_score)}>
                    Trust Score: {profile.trust_score}
                  </span>
                </div>
              </div>

              {profile.is_banned && profile.ban_reason && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">Banni</p>
                    <p className="text-sm text-muted-foreground">
                      {profile.ban_reason}
                    </p>
                    {profile.banned_until && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Jusqu'au{" "}
                        {new Date(profile.banned_until).toLocaleDateString(
                          "fr-FR"
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {canManageUsers() && (
              <div className="flex flex-col gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={profile.is_banned}>
                      <Ban className="h-4 w-4 mr-2" />
                      Bannir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Bannir l'utilisateur</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action suspendra l'accès de l'utilisateur.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="ban-duration">Durée (jours)</Label>
                        <Input
                          id="ban-duration"
                          type="number"
                          value={banDuration}
                          onChange={(e) => setBanDuration(e.target.value)}
                          min="1"
                          max="365"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ban-reason">Raison</Label>
                        <Textarea
                          id="ban-reason"
                          value={banReason}
                          onChange={(e) => setBanReason(e.target.value)}
                          placeholder="Raison du bannissement..."
                        />
                      </div>
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={handleBanUser}>
                        Confirmer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={profile.is_suspended}
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Suspendre
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Suspendre l'utilisateur</AlertDialogTitle>
                      <AlertDialogDescription>
                        Suspension temporaire de l'utilisateur.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="suspend-duration">Durée (jours)</Label>
                        <Input
                          id="suspend-duration"
                          type="number"
                          value={suspendDuration}
                          onChange={(e) => setSuspendDuration(e.target.value)}
                          min="1"
                          max="90"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="suspend-reason">Raison</Label>
                        <Textarea
                          id="suspend-reason"
                          value={suspendReason}
                          onChange={(e) => setSuspendReason(e.target.value)}
                          placeholder="Raison de la suspension..."
                        />
                      </div>
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSuspendUser}>
                        Confirmer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResetTrustScore(50)}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Score
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">
            Activité ({activities.length})
          </TabsTrigger>
          <TabsTrigger value="reviews">Avis ({reviews.length})</TabsTrigger>
          <TabsTrigger value="flags">
            Signalements ({flags.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          {activities.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Aucune activité
              </CardContent>
            </Card>
          ) : (
            activities.map((activity) => (
              <Card key={activity.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{activity.title}</CardTitle>
                    <Badge variant="outline">{activity.status}</Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    {new Date(activity.created_at).toLocaleDateString("fr-FR")}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          {reviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Aucun avis reçu
              </CardContent>
            </Card>
          ) : (
            reviews.map((review) => (
              <Card key={review.id}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={
                          i < review.rating
                            ? "text-yellow-500"
                            : "text-gray-300"
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <CardDescription>{review.comment}</CardDescription>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="flags" className="space-y-4">
          {flags.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Aucun signalement
              </CardContent>
            </Card>
          ) : (
            flags.map((flag) => (
              <Card key={flag.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{flag.reason}</CardTitle>
                    <Badge
                      variant={
                        flag.status === "pending"
                          ? "destructive"
                          : flag.status === "resolved"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {flag.status}
                    </Badge>
                  </div>
                  <CardDescription>{flag.description}</CardDescription>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
