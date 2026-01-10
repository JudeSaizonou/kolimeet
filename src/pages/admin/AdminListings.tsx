import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Trash2, XCircle, MapPin, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

interface Trip {
  id: string;
  user_id: string;
  from_city: string;
  from_country: string;
  to_city: string;
  to_country: string;
  date_departure: string;
  status: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

interface Parcel {
  id: string;
  user_id: string;
  from_city: string;
  from_country: string;
  to_city: string;
  to_country: string;
  deadline: string;
  status: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

export function AdminListings() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchListings = async () => {
    try {
      const [tripsRes, parcelsRes] = await Promise.all([
        supabase
          .from("trips")
          .select("*, profiles:user_id(full_name)")
          .order("created_at", { ascending: false }),
        supabase
          .from("parcels")
          .select("*, profiles:user_id(full_name)")
          .order("created_at", { ascending: false }),
      ]);

      if (tripsRes.error) throw tripsRes.error;
      if (parcelsRes.error) throw parcelsRes.error;

      setTrips(tripsRes.data || []);
      setParcels(parcelsRes.data || []);
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
    fetchListings();
  }, []);

  const closeTrip = async (tripId: string) => {
    try {
      const { error } = await supabase
        .from("trips")
        .update({ status: "closed" })
        .eq("id", tripId);

      if (error) throw error;

      toast({
        title: "Trajet fermé",
        description: "Le trajet a été fermé",
      });

      fetchListings();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteTrip = async (tripId: string) => {
    try {
      const { error } = await supabase.from("trips").delete().eq("id", tripId);

      if (error) throw error;

      toast({
        title: "Trajet supprimé",
        description: "Le trajet a été supprimé",
      });

      fetchListings();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const closeParcel = async (parcelId: string) => {
    try {
      const { error } = await supabase
        .from("parcels")
        .update({ status: "closed" })
        .eq("id", parcelId);

      if (error) throw error;

      toast({
        title: "Colis fermé",
        description: "Le colis a été fermé",
      });

      fetchListings();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteParcel = async (parcelId: string) => {
    try {
      const { error } = await supabase.from("parcels").delete().eq("id", parcelId);

      if (error) throw error;

      toast({
        title: "Colis supprimé",
        description: "Le colis a été supprimé",
      });

      fetchListings();
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
    <Tabs defaultValue="trips" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="trips">Trajets ({trips.length})</TabsTrigger>
        <TabsTrigger value="parcels">Colis ({parcels.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="trips" className="mt-0 space-y-4">
        {trips.map((trip) => (
          <Card key={trip.id} className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={trip.status === "open" ? "default" : "secondary"}>
                      {trip.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground mb-1">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {trip.from_city}, {trip.from_country} → {trip.to_city}, {trip.to_country}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(trip.date_departure).toLocaleDateString("fr-FR")}</span>
                    <span>• Par {trip.profiles?.full_name || "Utilisateur"}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/trajets/${trip.id}`} target="_blank">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Voir
                  </Link>
                </Button>
                {trip.status === "open" && (
                  <Button variant="secondary" size="sm" onClick={() => closeTrip(trip.id)}>
                    <XCircle className="h-4 w-4 mr-1" />
                    Fermer
                  </Button>
                )}
                <Button variant="destructive" size="sm" onClick={() => deleteTrip(trip.id)}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </TabsContent>

      <TabsContent value="parcels" className="mt-0 space-y-4">
        {parcels.map((parcel) => (
          <Card key={parcel.id} className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={parcel.status === "open" ? "default" : "secondary"}>
                      {parcel.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground mb-1">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {parcel.from_city}, {parcel.from_country} → {parcel.to_city},{" "}
                      {parcel.to_country}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Avant le {new Date(parcel.deadline).toLocaleDateString("fr-FR")}</span>
                    <span>• Par {parcel.profiles?.full_name || "Utilisateur"}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/colis/${parcel.id}`} target="_blank">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Voir
                  </Link>
                </Button>
                {parcel.status === "open" && (
                  <Button variant="secondary" size="sm" onClick={() => closeParcel(parcel.id)}>
                    <XCircle className="h-4 w-4 mr-1" />
                    Fermer
                  </Button>
                )}
                <Button variant="destructive" size="sm" onClick={() => deleteParcel(parcel.id)}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </TabsContent>
    </Tabs>
  );
}
