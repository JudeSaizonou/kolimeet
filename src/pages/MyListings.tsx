import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Edit, Trash2, Lock, LockOpen, MapPin, Calendar, Package, Plus, Minus, DollarSign } from "lucide-react";
import { useTrips } from "@/hooks/useTrips";
import { useParcels } from "@/hooks/useParcels";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface Trip {
  id: string;
  from_country: string;
  from_city: string;
  to_country: string;
  to_city: string;
  date_departure: string;
  capacity_liters: number;
  capacity_available_liters: number;
  price_expect?: number;
  notes?: string;
  status: string;
}

interface Parcel {
  id: string;
  type: string;
  weight_kg: number;
  size: string;
  from_country: string;
  from_city: string;
  to_country: string;
  to_city: string;
  deadline: string;
  description?: string;
  photos?: string[];
  status: string;
}

const MyListings = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const { deleteTrip, toggleTripStatus, updateTrip } = useTrips();
  const { deleteParcel, toggleParcelStatus } = useParcels();
  const navigate = useNavigate();

  const fetchMyListings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [tripsData, parcelsData] = await Promise.all([
        supabase.from("trips").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("parcels").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);

      if (tripsData.data) setTrips(tripsData.data);
      if (parcelsData.data) setParcels(parcelsData.data);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyListings();
  }, []);

  const handleDeleteTrip = async (id: string) => {
    await deleteTrip(id);
    fetchMyListings();
  };

  const handleToggleTripStatus = async (id: string, status: string) => {
    await toggleTripStatus(id, status);
    fetchMyListings();
  };

  const handleDeleteParcel = async (id: string) => {
    await deleteParcel(id);
    fetchMyListings();
  };

  const handleToggleParcelStatus = async (id: string, status: string) => {
    await toggleParcelStatus(id, status);
    fetchMyListings();
  };

  const handleUpdateCapacity = async (tripId: string, newCapacity: number, maxCapacity: number) => {
    if (newCapacity < 0) {
      toast({
        title: "Erreur",
        description: "La capacité ne peut pas être négative",
        variant: "destructive",
      });
      return;
    }
    if (newCapacity > maxCapacity) {
      toast({
        title: "Erreur",
        description: "La capacité disponible ne peut pas dépasser la capacité totale",
        variant: "destructive",
      });
      return;
    }
    await updateTrip(tripId, { capacity_available_liters: newCapacity });
    fetchMyListings();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mes annonces</h1>
          <p className="text-muted-foreground">
            Gérez vos trajets et vos colis
          </p>
        </div>

        <Tabs defaultValue="trips" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="trips">Mes trajets ({trips.length})</TabsTrigger>
            <TabsTrigger value="parcels">Mes colis ({parcels.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="trips" className="space-y-4">
            {trips.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">Aucun trajet publié</p>
                  <Button asChild>
                    <a href="/publier/trajet">Publier un trajet</a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              trips.map((trip) => (
                <Card key={trip.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-primary" />
                          {trip.from_city}, {trip.from_country} → {trip.to_city}, {trip.to_country}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(trip.date_departure), "PPP", { locale: fr })}
                        </CardDescription>
                      </div>
                      <Badge variant={trip.status === "open" ? "default" : "secondary"}>
                        {trip.status === "open" ? "Ouvert" : "Fermé"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{trip.capacity_available_liters}L / {trip.capacity_liters}L</span>
                          </div>
                          {trip.price_expect && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <DollarSign className="h-4 w-4" />
                              <span>{trip.price_expect}€</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleUpdateCapacity(trip.id, trip.capacity_available_liters - 5, trip.capacity_liters)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleUpdateCapacity(trip.id, trip.capacity_available_liters + 5, trip.capacity_liters)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleTripStatus(trip.id, trip.status)}
                        >
                          {trip.status === "open" ? (
                            <>
                              <Lock className="h-4 w-4 mr-1" />
                              Fermer
                            </>
                          ) : (
                            <>
                              <LockOpen className="h-4 w-4 mr-1" />
                              Ouvrir
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate(`/publier/trajet/${trip.id}`)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Modifier
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
                              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action est irréversible. Le trajet sera définitivement supprimé.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteTrip(trip.id)}>
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="parcels" className="space-y-4">
            {parcels.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">Aucun colis publié</p>
                  <Button asChild>
                    <a href="/publier/colis">Publier un colis</a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              parcels.map((parcel) => (
                <Card key={parcel.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5 text-primary" />
                          {parcel.from_city}, {parcel.from_country} → {parcel.to_city}, {parcel.to_country}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Avant le {format(new Date(parcel.deadline), "PPP", { locale: fr })}
                        </CardDescription>
                      </div>
                      <Badge variant={parcel.status === "open" ? "default" : "secondary"}>
                        {parcel.status === "open" ? "Ouvert" : "Fermé"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span className="capitalize">{parcel.type}</span>
                        <span>•</span>
                        <span>{parcel.weight_kg} kg</span>
                        <span>•</span>
                        <span>Taille {parcel.size}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleParcelStatus(parcel.id, parcel.status)}
                        >
                          {parcel.status === "open" ? (
                            <>
                              <Lock className="h-4 w-4 mr-1" />
                              Fermer
                            </>
                          ) : (
                            <>
                              <LockOpen className="h-4 w-4 mr-1" />
                              Ouvrir
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/publier/colis/${parcel.id}`)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Modifier
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
                              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action est irréversible. Le colis sera définitivement supprimé.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteParcel(parcel.id)}>
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyListings;
