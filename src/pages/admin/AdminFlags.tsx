import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle, X, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

interface Flag {
  id: string;
  entity_type: string;
  entity_id: string;
  reason: string;
  reporter_id: string;
  created_at: string;
  status: string;
}

interface FlagWithReporter extends Flag {
  reporter?: {
    full_name: string;
  } | null;
}

export function AdminFlags() {
  const [flags, setFlags] = useState<FlagWithReporter[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFlags = async () => {
    try {
      const { data, error } = await supabase
        .from("flags")
        .select(`
          *,
          reporter:profiles(full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFlags(data as FlagWithReporter[] || []);
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
    fetchFlags();
  }, []);

  const updateFlagStatus = async (flagId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("flags")
        .update({ status })
        .eq("id", flagId);

      if (error) throw error;

      toast({
        title: "Signalement mis à jour",
        description: status === "resolved" ? "Marqué comme traité ✅" : "Marqué comme rejeté",
      });

      fetchFlags();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteEntity = async (entityType: string, entityId: string, flagId: string) => {
    try {
      let error = null;

      if (entityType === "trip") {
        const res = await supabase.from("trips").delete().eq("id", entityId);
        error = res.error;
      } else if (entityType === "parcel") {
        const res = await supabase.from("parcels").delete().eq("id", entityId);
        error = res.error;
      } else if (entityType === "message") {
        const res = await supabase.from("messages").delete().eq("id", entityId);
        error = res.error;
      } else if (entityType === "review") {
        const res = await supabase.from("reviews").delete().eq("id", entityId);
        error = res.error;
      } else {
        throw new Error("Type d'entité invalide");
      }

      if (error) throw error;

      await updateFlagStatus(flagId, "resolved");

      toast({
        title: "Contenu supprimé",
        description: "Le contenu signalé a été supprimé 🗑️",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getEntityLink = (entityType: string, entityId: string) => {
    const linkMap: Record<string, string> = {
      trip: `/trajets/${entityId}`,
      parcel: `/colis/${entityId}`,
      profile: `/u/${entityId}`,
    };
    return linkMap[entityType] || "#";
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      {flags.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="text-muted-foreground">Aucun signalement en attente</p>
        </Card>
      ) : (
        flags.map((flag) => (
          <Card key={flag.id} className="p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={flag.status === "pending" ? "default" : "secondary"}>
                      {flag.entity_type}
                    </Badge>
                    <Badge
                      variant={
                        flag.status === "resolved"
                          ? "default"
                          : flag.status === "dismissed"
                          ? "secondary"
                          : "destructive"
                      }
                      className={
                        flag.status === "resolved"
                          ? "bg-green-500 hover:bg-green-600"
                          : ""
                      }
                    >
                      {flag.status === "pending" && <AlertCircle className="h-3 w-3 mr-1" />}
                      {flag.status === "resolved" && <CheckCircle className="h-3 w-3 mr-1" />}
                      {flag.status === "dismissed" && <X className="h-3 w-3 mr-1" />}
                      {flag.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground mb-1">
                    <span className="font-medium">Motif :</span> {flag.reason}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Signalé par {flag.reporter?.full_name || "Utilisateur inconnu"} •{" "}
                    {new Date(flag.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>

              {flag.status === "pending" && (
                <div className="flex flex-wrap gap-2">
                  {(flag.entity_type === "trip" || flag.entity_type === "parcel" || flag.entity_type === "profile") && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link to={getEntityLink(flag.entity_type, flag.entity_id)} target="_blank">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Voir contenu
                      </Link>
                    </Button>
                  )}
                  {(flag.entity_type !== "profile") && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteEntity(flag.entity_type, flag.entity_id, flag.id)}
                    >
                      Supprimer contenu
                    </Button>
                  )}
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => updateFlagStatus(flag.id, "resolved")}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Marquer traité
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => updateFlagStatus(flag.id, "dismissed")}
                  >
                    Rejeter
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
