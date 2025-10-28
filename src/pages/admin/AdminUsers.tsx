import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { UserX, UserCheck, ExternalLink, Star } from "lucide-react";
import { Link } from "react-router-dom";

interface Profile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  country: string | null;
  city: string | null;
  is_suspended: boolean;
  rating_avg: number;
  rating_count: number;
  created_at: string;
}

export function AdminUsers() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const toggleSuspension = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_suspended: !currentStatus })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: currentStatus ? "Utilisateur réactivé" : "Utilisateur suspendu",
        description: currentStatus
          ? "Le compte a été réactivé ✅"
          : "Le compte a été suspendu 🚫",
      });

      fetchProfiles();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      {profiles.map((profile) => (
        <Card key={profile.user_id} className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile.avatar_url || ""} />
              <AvatarFallback>
                {profile.full_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground truncate">
                  {profile.full_name || "Sans nom"}
                </h3>
                {profile.is_suspended && (
                  <Badge variant="destructive" className="bg-red-500">
                    <UserX className="h-3 w-3 mr-1" />
                    Suspendu
                  </Badge>
                )}
              </div>

              <p className="text-sm text-muted-foreground mb-2">
                {profile.city && profile.country
                  ? `${profile.city}, ${profile.country}`
                  : "Localisation non renseignée"}
              </p>

              {profile.rating_count > 0 && (
                <div className="flex items-center gap-1 text-sm mb-3">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{profile.rating_avg.toFixed(1)}</span>
                  <span className="text-muted-foreground">({profile.rating_count} avis)</span>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/u/${profile.user_id}`} target="_blank">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Voir profil
                  </Link>
                </Button>

                <Button
                  variant={profile.is_suspended ? "default" : "destructive"}
                  size="sm"
                  onClick={() => toggleSuspension(profile.user_id, profile.is_suspended)}
                  className={profile.is_suspended ? "bg-green-500 hover:bg-green-600" : ""}
                >
                  {profile.is_suspended ? (
                    <>
                      <UserCheck className="h-4 w-4 mr-1" />
                      Réactiver
                    </>
                  ) : (
                    <>
                      <UserX className="h-4 w-4 mr-1" />
                      Suspendre
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
