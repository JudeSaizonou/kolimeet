import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { UserX, UserCheck, ExternalLink, Star, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
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
      setLoading(true);
      
      console.log("Attempting to toggle suspension for user:", userId, "current status:", currentStatus);
      
      // First update the local state optimistically
      setProfiles(prev => 
        prev.map(profile => 
          profile.user_id === userId 
            ? { ...profile, is_suspended: !currentStatus }
            : profile
        )
      );

      const { error, data } = await supabase
        .from("profiles")
        .update({ is_suspended: !currentStatus })
        .eq("user_id", userId)
        .select();

      if (error) {
        console.error("Suspension toggle error details:", error);
        
        // Revert optimistic update on error
        setProfiles(prev => 
          prev.map(profile => 
            profile.user_id === userId 
              ? { ...profile, is_suspended: currentStatus }
              : profile
          )
        );
        
        // Check if it's a permission error
        if (error.message.includes('permission') || error.message.includes('policy')) {
          throw new Error("Permissions insuffisantes. Vérifiez que vous avez bien les droits d'administrateur et que les politiques de sécurité sont correctement configurées.");
        }
        
        throw error;
      }

      console.log("Suspension toggle successful:", data);

      toast({
        title: currentStatus ? "Utilisateur réactivé" : "Utilisateur suspendu",
        description: currentStatus
          ? "Le compte a été réactivé"
          : "Le compte a été suspendu",
      });

      // Refresh data to ensure consistency
      await fetchProfiles();
    } catch (error: any) {
      console.error("Toggle suspension error:", error);
      toast({
        title: "Erreur de modification",
        description: error.message || "Une erreur est survenue lors de la modification du statut",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      setLoading(true);
      
      console.log("Attempting to delete user:", userId);
      
      // Optimistically remove user from UI
      const userToDelete = profiles.find(p => p.user_id === userId);
      setProfiles(prev => prev.filter(profile => profile.user_id !== userId));

      // Try direct profile deletion first (which should work with admin policies)
      const { error: profileError, data } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", userId)
        .select();
      
      if (profileError) {
        console.error("Profile delete error:", profileError);
        
        // Restore user to UI on error
        if (userToDelete) {
          setProfiles(prev => [...prev, userToDelete].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ));
        }
        
        // Check if it's a permission error
        if (profileError.message.includes('permission') || profileError.message.includes('policy')) {
          throw new Error("Permissions insuffisantes pour supprimer cet utilisateur. Vérifiez que vous avez bien les droits d'administrateur et que les politiques de sécurité sont correctement configurées.");
        }
        
        throw profileError;
      }

      console.log("Profile deletion successful:", data);

      // Optionally try to delete from auth.users as well (this might fail if no service role)
      try {
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);
        if (authError) {
          console.log("Auth user deletion failed (this is expected if no service role):", authError);
        } else {
          console.log("Auth user deletion successful");
        }
      } catch (authError) {
        console.log("Auth deletion attempt failed:", authError);
      }

      toast({
        title: "Utilisateur supprimé",
        description: "Le profil utilisateur a été supprimé avec succès",
      });

      // Refresh data to ensure consistency
      await fetchProfiles();
    } catch (error: any) {
      console.error("Delete user error:", error);
      
      toast({
        title: "Erreur de suppression",
        description: error.message || "Impossible de supprimer l'utilisateur. Vérifiez vos permissions d'administration.",
        variant: "destructive",
      });
      
      // Refresh data in case of partial failure
      await fetchProfiles();
    } finally {
      setLoading(false);
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

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. Cela supprimera définitivement le compte de{" "}
                        <strong>{profile.full_name || "cet utilisateur"}</strong> ainsi que toutes
                        ses données (annonces, messages, avis, etc.).
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteUser(profile.user_id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Supprimer définitivement
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
